import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'

export interface GlobalStats {
  totalUsers: number
  totalScreens: number
  totalContent: number
  totalPlaylists: number
  totalSchedules: number
  activeUsers: number
}

export function useGlobalAdmin() {
  const { user } = useAuth()
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false)
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalUsers: 0,
    totalScreens: 0,
    totalContent: 0,
    totalPlaylists: 0,
    totalSchedules: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      checkGlobalAdminStatus()
    }
  }, [user])

  const checkGlobalAdminStatus = () => {
    const isGlobal = user?.email === 'saibot.app@gmail.com'
    console.log('Checking global admin status:', {
      userEmail: user?.email,
      expectedEmail: 'saibot.app@gmail.com',
      isGlobal: isGlobal
    })
    setIsGlobalAdmin(isGlobal)
    
    if (isGlobal) {
      loadGlobalData()
    } else {
      setLoading(false)
    }
  }

  const loadGlobalData = async () => {
    try {
      setLoading(true)
      await loadGlobalStats()
    } catch (error) {
      console.error('Error loading global data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGlobalStats = async () => {
    try {
      const [usersRes, screensRes, contentRes, playlistsRes, schedulesRes] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('screens').select('id'),
        supabase.from('content').select('id, is_active'),
        supabase.from('playlists').select('id, is_active'),
        supabase.from('schedules').select('id, is_active')
      ])

      const stats: GlobalStats = {
        totalUsers: usersRes.data?.length || 0,
        totalScreens: screensRes.data?.length || 0,
        totalContent: contentRes.data?.length || 0,
        totalPlaylists: playlistsRes.data?.length || 0,
        totalSchedules: schedulesRes.data?.length || 0,
        activeUsers: usersRes.data?.length || 0 // Assuming all users are active in current schema
      }

      setGlobalStats(stats)
    } catch (error) {
      console.error('Error loading global stats:', error)
    }
  }

  return {
    isGlobalAdmin,
    globalStats,
    loading,
    loadGlobalData
  }
}