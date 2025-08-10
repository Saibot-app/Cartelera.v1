import React, { useState, useEffect } from 'react'
import { Monitor, FileText, PlayCircle, Calendar } from 'lucide-react'
import { StatsCard } from './StatsCard'
import { supabase } from '../../lib/supabase'

interface DashboardStats {
  totalScreens: number
  onlineScreens: number
  totalContent: number
  activeSchedules: number
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalScreens: 0,
    onlineScreens: 0,
    totalContent: 0,
    activeSchedules: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [screensRes, contentRes, schedulesRes] = await Promise.all([
        supabase.from('screens').select('status'),
        supabase.from('content').select('id').eq('is_active', true),
        supabase.from('schedules').select('id').eq('is_active', true),
      ])

      const totalScreens = screensRes.data?.length || 0
      const onlineScreens = screensRes.data?.filter(s => s.status === 'online').length || 0
      const totalContent = contentRes.data?.length || 0
      const activeSchedules = schedulesRes.data?.length || 0

      setStats({
        totalScreens,
        onlineScreens,
        totalContent,
        activeSchedules,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Pantallas"
          value={stats.totalScreens}
          icon={Monitor}
          trend={{ value: 12, label: 'este mes' }}
          color="blue"
        />
        <StatsCard
          title="Pantallas Online"
          value={stats.onlineScreens}
          icon={Monitor}
          trend={{ value: 5, label: 'vs ayer' }}
          color="green"
        />
        <StatsCard
          title="Contenido Activo"
          value={stats.totalContent}
          icon={FileText}
          trend={{ value: 8, label: 'esta semana' }}
          color="orange"
        />
        <StatsCard
          title="Programaciones"
          value={stats.activeSchedules}
          icon={Calendar}
          trend={{ value: -2, label: 'vs semana pasada' }}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nueva pantalla conectada</p>
                <p className="text-xs text-gray-500">Sala de Conferencias - hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Contenido actualizado</p>
                <p className="text-xs text-gray-500">Promoción Enero 2025 - hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Programación modificada</p>
                <p className="text-xs text-gray-500">Horario Matutino - hace 6 horas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pantallas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">Recepción Principal</span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">Sala de Conferencias</span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">Cafetería</span>
              </div>
              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">Offline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}