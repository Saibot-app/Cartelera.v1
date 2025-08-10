import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Monitor, MapPin, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Screen {
  id: string
  name: string
  location: string
  resolution: string
  status: 'online' | 'offline' | 'maintenance'
  last_seen: string
  created_at: string
}

export function ScreensList() {
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
        .order('created_at', { ascending: false })

      if (error) throw error
      setScreens(data || [])
    } catch (error) {
      console.error('Error loading screens:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteScreen = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta pantalla?')) return

    try {
      const { error } = await supabase.from('screens').delete().eq('id', id)
      if (error) throw error
      loadScreens()
    } catch (error) {
      console.error('Error deleting screen:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-700'
      case 'offline':
        return 'bg-red-100 text-red-700'
      case 'maintenance':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'online' ? Wifi : WifiOff
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Pantallas</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nueva Pantalla</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {screens.map((screen) => {
          const StatusIcon = getStatusIcon(screen.status)
          return (
            <div key={screen.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <Monitor className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{screen.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{screen.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteScreen(screen.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado</span>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-4 h-4 text-gray-400" />
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(screen.status)}`}>
                      {screen.status === 'online' ? 'En línea' : 
                       screen.status === 'offline' ? 'Desconectada' : 'Mantenimiento'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Resolución</span>
                  <span className="text-sm font-medium text-gray-900">{screen.resolution}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última conexión</span>
                  <span className="text-sm text-gray-900">
                    {format(new Date(screen.last_seen), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {screens.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pantallas registradas</h3>
          <p className="text-gray-500 mb-6">Registra tu primera pantalla para comenzar</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Registrar Pantalla
          </button>
        </div>
      )}
    </div>
  )
}