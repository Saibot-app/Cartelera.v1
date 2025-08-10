import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { removeUserFile } from '../lib/storage'

export interface Content {
  id: string
  title: string
  type: 'text' | 'image' | 'video' | 'html'
  content_data: any
  duration: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export function useContent() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadContents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading content:', err)
    } finally {
      setLoading(false)
    }
  }

  const createContent = async (contentData: {
    title: string
    type: 'text' | 'image' | 'video' | 'html'
    content_data: any
    duration: number
  }) => {
    try {
      const { data, error } = await supabase
        .from('content')
        .insert(contentData)
        .select()
        .single()

      if (error) throw error
      await loadContents()
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateContent = async (id: string, updates: Partial<Content>) => {
    try {
      const { error } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)

      if (error) throw error
      await loadContents()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteContent = async (id: string) => {
    try {
      // Get content to check if it has files to delete
      const { data: content } = await supabase
        .from('content')
        .select('content_data')
        .eq('id', id)
        .single()

      // Delete associated files if they exist
      if (content?.content_data?.storage_path) {
        await removeUserFile(content.content_data.storage_path)
      }

      // Delete content record
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadContents()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const toggleActive = async (id: string, currentState: boolean) => {
    await updateContent(id, { is_active: !currentState })
  }

  useEffect(() => {
    loadContents()
  }, [])

  return {
    contents,
    loading,
    error,
    loadContents,
    createContent,
    updateContent,
    deleteContent,
    toggleActive
  }
}