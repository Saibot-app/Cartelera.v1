import React, { useState } from 'react'
import { Plus, Edit, Trash2, Play, Calendar, Clock, Monitor, PlayCircle } from 'lucide-react'
import { useSchedules } from '../../hooks/useSchedules'
import { ScheduleForm } from './ScheduleForm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function SchedulesList() {
  const { schedules, loading, toggleActive, deleteSchedule } = useSchedules()
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSchedule(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta programación?')) return
    await deleteSchedule(id)
  }

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'HH:mm')
  }

  const getDayNames = (days: number[]) => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    if (days.length === 7) return 'Todos los días'
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Lunes a Viernes'
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Fines de semana'
    return days.map(d => dayNames[d]).join(', ')
  }

  const isCurrentlyActive = (schedule: any) => {
    if (!schedule.is_active) return false
    
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = format(now, 'HH:mm')
    
    return schedule.days_of_week.includes(currentDay) &&
           currentTime >= schedule.start_time &&
           currentTime <= schedule.end_time
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Programación de Contenido</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Programación</span>
        </button>
      </div>

      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${
                  isCurrentlyActive(schedule) 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-orange-50'
                }`}>
                  <Calendar className={`w-8 h-8 ${
                    isCurrentlyActive(schedule) ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{schedule.name}</h3>
                    {isCurrentlyActive(schedule) && (
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                        EN VIVO
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <PlayCircle className="w-4 h-4" />
                        <span>{schedule.playlist?.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Monitor className="w-4 h-4" />
                        <span>{schedule.screen?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                      </div>
                      <span>•</span>
                      <span>{getDayNames(schedule.days_of_week)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleActive(schedule.id, schedule.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    schedule.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={schedule.is_active ? 'Desactivar' : 'Activar'}
                >
                  <Play className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEdit(schedule)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    schedule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {schedule.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="ml-2 font-medium text-gray-900">{schedule.screen?.location}</span>
                </div>
                <div>
                  <span className="text-gray-600">Creada:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {format(new Date(schedule.created_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay programaciones</h3>
          <p className="text-gray-500 mb-6">Crea tu primera programación para automatizar el contenido</p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Programación
          </button>
        </div>
      )}

      <ScheduleForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm()
          window.location.reload() // Refresh to see changes
        }}
        schedule={editingSchedule}
      />
    </div>
  )
}