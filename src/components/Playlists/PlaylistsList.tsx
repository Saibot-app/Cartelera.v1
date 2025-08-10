import React, { useState } from 'react'
import { Plus, Edit, Trash2, Play, PlayCircle, Clock } from 'lucide-react'
import { usePlaylists } from '../../hooks/usePlaylists'
import { PlaylistForm } from './PlaylistForm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function PlaylistsList() {
  const { playlists, loading, toggleActive, deletePlaylist } = usePlaylists()
  const [showForm, setShowForm] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null)

  const handleEdit = (playlist: any) => {
    setEditingPlaylist(playlist)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingPlaylist(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta playlist?')) return
    await deletePlaylist(id)
  }

  const getTotalDuration = (playlist: any) => {
    return playlist.playlist_items?.reduce((total: number, item: any) => {
      return total + (item.content?.duration || 0)
    }, 0) || 0
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
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Playlists</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-50 p-3 rounded-xl">
                  <PlayCircle className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{playlist.name}</h3>
                  <p className="text-sm text-gray-500">{playlist.description || 'Sin descripción'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleActive(playlist.id, playlist.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    playlist.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  title={playlist.is_active ? 'Desactivar' : 'Activar'}
                >
                  <Play className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEdit(playlist)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(playlist.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Elementos</span>
                <span className="text-sm font-medium text-gray-900">
                  {playlist.playlist_items?.length || 0} elementos
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duración total</span>
                <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
                  <Clock className="w-4 h-4" />
                  <span>{getTotalDuration(playlist)}s</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  playlist.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {playlist.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Creada</span>
                <span className="text-sm text-gray-900">
                  {format(new Date(playlist.created_at), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>

              {playlist.playlist_items && playlist.playlist_items.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Contenido:</p>
                  <div className="space-y-1">
                    {playlist.playlist_items.slice(0, 3).map((item: any, index: number) => (
                      <div key={item.id} className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="w-4 text-center text-xs">{index + 1}.</span>
                        <span className="truncate">{item.content?.title}</span>
                      </div>
                    ))}
                    {playlist.playlist_items.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{playlist.playlist_items.length - 3} elementos más
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {playlists.length === 0 && (
        <div className="text-center py-12">
          <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay playlists</h3>
          <p className="text-gray-500 mb-6">Crea tu primera playlist para organizar tu contenido</p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear Playlist
          </button>
        </div>
      )}

      <PlaylistForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm()
          window.location.reload() // Refresh to see changes
        }}
        playlist={editingPlaylist}
      />
    </div>
  )
}