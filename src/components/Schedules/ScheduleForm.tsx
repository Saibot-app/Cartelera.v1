import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const scheduleSchema = yup.object().shape({
  name: yup.string().required('Nombre requerido').min(3, 'Mínimo 3 caracteres'),
  playlist_id: yup.string().required('Playlist requerida'),
  screen_id: yup.string().required('Pantalla requerida'),
  start_time: yup.string().required('Hora de inicio requerida'),
  end_time: yup.string().required('Hora de fin requerida'),
})

interface ScheduleFormData {
  name: string
  playlist_id: string
  screen_id: string
  start_time: string
  end_time: string
}

interface ScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  schedule?: any
}

interface Playlist {
  id: string
  name: string
  is_active: boolean
}

interface Screen {
  id: string
  name: string
  location: string
  status: string
}

export function ScheduleForm({ isOpen, onClose, onSuccess, schedule }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [screens, setScreens] = useState<Screen[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]) // Default: Lun-Vie
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ScheduleFormData>({
    resolver: yupResolver(scheduleSchema)
  })

  const startTime = watch('start_time')
  const endTime = watch('end_time')

  useEffect(() => {
    if (isOpen) {
      loadPlaylists()
      loadScreens()
      if (schedule) {
        setValue('name', schedule.name)
        setValue('playlist_id', schedule.playlist_id)
        setValue('screen_id', schedule.screen_id)
        setValue('start_time', schedule.start_time)
        setValue('end_time', schedule.end_time)
        setSelectedDays(schedule.days_of_week || [1, 2, 3, 4, 5])
      }
    }
  }, [isOpen, schedule])

  const loadPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, is_active')
        .order('name')

      if (error) throw error
      setPlaylists(data || [])
    } catch (err) {
      console.error('Error loading playlists:', err)
      setError('Error cargando playlists. Verifica que tengas playlists creadas.')
    }
  }

  const loadScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('screens')
        .select('id, name, location, status')
        .order('name')

      if (error) throw error
      setScreens(data || [])
    } catch (err) {
      console.error('Error loading screens:', err)
    }
  }

  const onSubmit = async (data: ScheduleFormData) => {
    setLoading(true)
    setError('')

    // Validate time range
    if (data.start_time >= data.end_time) {
      setError('La hora de inicio debe ser anterior a la hora de fin')
      setLoading(false)
      return
    }

    // Validate days selection
    if (selectedDays.length === 0) {
      setError('Debes seleccionar al menos un día de la semana')
      setLoading(false)
      return
    }

    try {
      const scheduleData = {
        name: data.name,
        playlist_id: data.playlist_id,
        screen_id: data.screen_id,
        start_time: data.start_time,
        end_time: data.end_time,
        days_of_week: selectedDays,
        created_by: user?.id
      }

      if (schedule) {
        // Update existing schedule
        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', schedule.id)

        if (error) throw error
      } else {
        // Create new schedule
        const { error } = await supabase
          .from('schedules')
          .insert(scheduleData)

        if (error) throw error
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar programación')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedDays([1, 2, 3, 4, 5])
    setError('')
    onClose()
  }

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {schedule ? 'Editar Programación' : 'Nueva Programación'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Programación
            </label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Ej: Horario Matutino"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Playlist
              </label>
              <select
                {...register('playlist_id')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Seleccionar playlist</option>
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} {!playlist.is_active ? '(Inactiva)' : ''}
                  </option>
                ))}
                {playlists.length === 0 && (
                  <option value="" disabled>No hay playlists disponibles</option>
                )}
              </select>
              {errors.playlist_id && (
                <p className="text-red-500 text-sm mt-1">{errors.playlist_id.message}</p>
              )}
              {playlists.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">
                  Primero debes crear una playlist en la sección "Playlists"
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pantalla
              </label>
              <select
                {...register('screen_id')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Seleccionar pantalla</option>
                {screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name} - {screen.location}
                  </option>
                ))}
              </select>
              {errors.screen_id && (
                <p className="text-red-500 text-sm mt-1">{errors.screen_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Inicio
              </label>
              <input
                {...register('start_time')}
                type="time"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {errors.start_time && (
                <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Fin
              </label>
              <input
                {...register('end_time')}
                type="time"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {errors.end_time && (
                <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>
              )}
            </div>
          </div>

          {startTime && endTime && startTime >= endTime && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              La hora de inicio debe ser anterior a la hora de fin
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Días de la Semana
            </label>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`p-3 text-sm font-medium rounded-lg transition-colors ${
                    selectedDays.includes(index)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-red-500 text-sm mt-1">Selecciona al menos un día</p>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedDays.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : schedule ? 'Actualizar Programación' : 'Crear Programación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}