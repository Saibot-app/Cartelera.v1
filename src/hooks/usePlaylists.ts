import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface Playlist {
  id: string
  name: string
  description: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface PlaylistWithItems extends Playlist {
  playlist_items: {
    id: string
    content_id: string
    order_index: number
    content: {
      id: string
      title: string
      type: 'text' | 'image' | 'video' | 'html'
      duration: number
    }
  }[]
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPlaylists = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_items (
            id,
            content_id,
            order_index,
            content (
              id,
              title,
              type,
              duration
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading playlists:', err)
    } finally {
      setLoading(false)
    }
  }

  const createPlaylist = async (playlistData: {
    name: string
    description: string
  }) => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert(playlistData)
        .select()
        .single()

      if (error) throw error
      await loadPlaylists()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await loadPlaylists()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deletePlaylist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadPlaylists()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const addContentToPlaylist = async (playlistId: string, contentId: string, orderIndex: number) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .insert({
          playlist_id: playlistId,
          content_id: contentId,
          order_index: orderIndex
        })

      if (error) throw error
      await loadPlaylists()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const removeContentFromPlaylist = async (playlistItemId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('id', playlistItemId)

      if (error) throw error
      await loadPlaylists()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const reorderPlaylistItems = async (playlistId: string, newOrder: { id: string; order_index: number }[]) => {
    try {
      for (const item of newOrder) {
        const { error } = await supabase
          .from('playlist_items')
          .update({ order_index: item.order_index })
          .eq('id', item.id)

        if (error) throw error
      }
      
      await loadPlaylists()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    await updatePlaylist(id, { is_active: !currentState })
  }

  useEffect(() => {
    loadPlaylists()
  }, [])

  return {
    playlists,
    loading,
    error,
    loadPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addContentToPlaylist,
    removeContentFromPlaylist,
    reorderPlaylistItems,
    toggleActive
  }
}