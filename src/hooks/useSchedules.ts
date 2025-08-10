import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Schedule {
  id: string
  name: string
  playlist_id: string
  screen_id: string
  start_time: string
  end_time: string
  days_of_week: number[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ScheduleWithDetails extends Schedule {
  playlist: {
    id: string
    name: string
  }
  screen: {
    id: string
    name: string
    location: string
  }
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          playlist:playlists (
            id,
            name
          ),
          screen:screens (
            id,
            name,
            location
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchedules(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async (scheduleData: {
    name: string
    playlist_id: string
    screen_id: string
    start_time: string
    end_time: string
    days_of_week: number[]
  }) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert(scheduleData)
        .select()
        .single()

      if (error) throw error
      await loadSchedules()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateSchedule = async (id: string, updates: Partial<Schedule>) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await loadSchedules()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadSchedules()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    await updateSchedule(id, { is_active: !currentState })
  }

  useEffect(() => {
    loadSchedules()
  }, [])

  return {
    schedules,
    loading,
    error,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleActive
  }
}