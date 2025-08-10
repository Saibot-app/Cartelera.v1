import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, Plus, Trash2, Move } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const playlistSchema = yup.object().shape({
  name: yup.string().required('Nombre requerido').min(3, 'Mínimo 3 caracteres'),
  description: yup.string(),
})

interface PlaylistFormData {
  name: string
  description: string
}

interface Content {
  id: string
  title: string
  type: string
  duration: number
  is_active: boolean
}

interface PlaylistFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  playlist?: any
}

export function PlaylistForm({ isOpen, onClose, onSuccess, playlist }: PlaylistFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableContent, setAvailableContent] = useState<Content[]>([])
  const [selectedContent, setSelectedContent] = useState<{ id: string; order_index: number }[]>([])
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<PlaylistFormData>({
    resolver: yupResolver(playlistSchema)
  })

  useEffect(() => {
    if (isOpen) {
      loadAvailableContent()
      if (playlist) {
        setValue('name', playlist.name)
        setValue('description', playlist.description)
        setSelectedContent(
          playlist.playlist_items?.map((item: any) => ({
            id: item.content_id,
            order_index: item.order_index
          })) || []
        )
      }
    }
  }, [isOpen, playlist])

  const loadAvailableContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, type, duration, is_active')
        .eq('is_active', true)
        .order('title')

      if (error) throw error
      setAvailableContent(data || [])
    } catch (err) {
      console.error('Error loading content:', err)
    }
  }

  const onSubmit = async (data: PlaylistFormData) => {
    setLoading(true)
    setError('')

    try {
      if (playlist) {
        // Update existing playlist
        const { error: updateError } = await supabase
          .from('playlists')
          .update({
            name: data.name,
            description: data.description
          })
          .eq('id', playlist.id)

        if (updateError) throw updateError

        // Update playlist items
        // First remove all existing items
        await supabase
          .from('playlist_items')
          .delete()
          .eq('playlist_id', playlist.id)

        // Then add new ones
        if (selectedContent.length > 0) {
          const items = selectedContent.map((item, index) => ({
            playlist_id: playlist.id,
            content_id: item.id,
            order_index: index
          }))

          const { error: itemsError } = await supabase
            .from('playlist_items')
            .insert(items)

          if (itemsError) throw itemsError
        }
      } else {
        // Create new playlist
        const { data: newPlaylist, error: createError } = await supabase
          .from('playlists')
          .insert({
            name: data.name,
            description: data.description,
            created_by: user?.id
          })
          .select()
          .single()

        if (createError) throw createError

        // Add selected content to playlist
        if (selectedContent.length > 0) {
          const items = selectedContent.map((item, index) => ({
            playlist_id: newPlaylist.id,
            content_id: item.id,
            order_index: index
          }))

          const { error: itemsError } = await supabase
            .from('playlist_items')
            .insert(items)

          if (itemsError) throw itemsError
        }
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Error al guardar playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedContent([])
    setError('')
    onClose()
  }

  const addContent = (contentId: string) => {
    if (!selectedContent.find(item => item.id === contentId)) {
      setSelectedContent(prev => [...prev, { id: contentId, order_index: prev.length }])
    }
  }

  const removeContent = (contentId: string) => {
    setSelectedContent(prev => 
      prev.filter(item => item.id !== contentId)
        .map((item, index) => ({ ...item, order_index: index }))
    )
  }

  const moveContent = (fromIndex: number, toIndex: number) => {
    const newContent = [...selectedContent]
    const [moved] = newContent.splice(fromIndex, 1)
    newContent.splice(toIndex, 0, moved)
    setSelectedContent(newContent.map((item, index) => ({ ...item, order_index: index })))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {playlist ? 'Editar Playlist' : 'Nueva Playlist'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Playlist
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Ej: Promociones Matutinas"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                {...register('description')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Content */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contenido Disponible</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{content.title}</h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {content.type} • {content.duration}s
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addContent(content.id)}
                      disabled={selectedContent.some(item => item.id === content.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {availableContent.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No hay contenido activo disponible</p>
                )}
              </div>
            </div>

            {/* Selected Content */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contenido en Playlist ({selectedContent.length})
              </h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedContent.map((item, index) => {
                  const content = availableContent.find(c => c.id === item.id)
                  if (!content) return null
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{content.title}</h4>
                          <p className="text-sm text-gray-500 capitalize">
                            {content.type} • {content.duration}s
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveContent(index, index - 1)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Mover arriba"
                          >
                            <Move className="w-4 h-4" />
                          </button>
                        )}
                        {index < selectedContent.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveContent(index, index + 1)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded rotate-180"
                            title="Mover abajo"
                          >
                            <Move className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeContent(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {selectedContent.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Agrega contenido a la playlist</p>
                )}
              </div>
            </div>
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
              disabled={loading || selectedContent.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : playlist ? 'Actualizar Playlist' : 'Crear Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}