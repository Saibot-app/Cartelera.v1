import React, { useState, useEffect } from 'react'
import { Monitor, MapPin, Wifi, WifiOff, Play } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface Screen {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'maintenance'
  resolution: string
  last_seen: string
}

interface ScreenSelectorProps {
  onSelectScreen: (screenId: string) => void
}

export function ScreenSelector({ onSelectScreen }: ScreenSelectorProps) {
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScreens()
  }, [])

  const loadScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('screens')
        .select('*')
        .order('name')

      if (error) throw error
      setScreens(data || [])
    } catch (error) {
      console.error('Error loading screens:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'online' ? Wifi : WifiOff
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'En línea'
      case 'offline':
        return 'Desconectada'
      case 'maintenance':
        return 'Mantenimiento'
      default:
        return 'Desconocido'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pantallas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seleccionar Pantalla</h1>
          <p className="text-gray-600">Elige la pantalla en la que deseas mostrar el contenido</p>
        </div>

        {screens.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay pantallas registradas</h3>
            <p className="text-gray-500 mb-6">Primero debes registrar pantallas en la sección "Pantallas"</p>
            <button
              onClick={() => window.location.href = '/screens'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a Pantallas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screens.map((screen) => {
              const StatusIcon = getStatusIcon(screen.status)
              return (
                <div
                  key={screen.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-50 p-3 rounded-xl">
                        <Monitor className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="w-4 h-4 text-gray-400" />
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(screen.status)}`}>
                          {getStatusText(screen.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{screen.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{screen.location}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Resolución: {screen.resolution}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectScreen(screen.id)}
                      disabled={screen.status === 'maintenance'}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Ver Display</span>
                    </button>

                    {screen.status === 'maintenance' && (
                      <p className="text-xs text-orange-600 text-center mt-2">
                        Pantalla en mantenimiento
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Opción para vista genérica */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <div className="bg-gray-50 p-3 rounded-xl w-fit mx-auto mb-3">
                <Monitor className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Vista Genérica</h3>
              <p className="text-sm text-gray-500 mt-1">
                Mostrar contenido sin asignar a una pantalla específica
              </p>
            </div>
            <button
              onClick={() => onSelectScreen('generic')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center space-x-2 mx-auto"
            >
              <Play className="w-4 h-4" />
              <span>Vista Genérica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}