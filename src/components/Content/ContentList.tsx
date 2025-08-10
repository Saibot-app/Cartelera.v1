import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, FileText, Image, Video, Code } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { ContentForm } from './ContentForm'
import { ContentPreview } from './ContentPreview'

interface Content {
  id: string
  title: string
  type: 'text' | 'image' | 'video' | 'html'
  duration: number
  is_active: boolean
  created_at: string
}

export function ContentList() {
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [previewContent, setPreviewContent] = useState<Content | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    loadContents()
  }, [])

  const loadContents = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      loadContents()
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const deleteContent = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este contenido?')) return

    try {
      const { error } = await supabase.from('content').delete().eq('id', id)
      if (error) throw error
      loadContents()
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return FileText
      case 'image':
        return Image
      case 'video':
        return Video
      case 'html':
        return Code
      default:
        return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text':
        return 'bg-blue-100 text-blue-700'
      case 'image':
        return 'bg-green-100 text-green-700'
      case 'video':
        return 'bg-purple-100 text-purple-700'
      case 'html':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Contenido</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Contenido</span>
        </button>
      </div>

      <div className="space-y-4">
        {contents.map((content) => {
          const TypeIcon = getTypeIcon(content.type)
          return (
            <div key={content.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(content.type)}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="capitalize">{content.type}</span>
                      <span>•</span>
                      <span>{content.duration}s duración</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        content.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {content.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(content.id, content.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      content.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={content.is_active ? 'Desactivar' : 'Activar'}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPreviewContent(content)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                    title="Vista previa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteContent(content.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {contents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contenido</h3>
            <p className="text-gray-500 mb-6">Comienza creando tu primer contenido digital</p>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Contenido
            </button>
          </div>
        )}
      </div>

      <ContentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadContents}
      />

      {previewContent && (
        <ContentPreview
          content={previewContent}
          isOpen={!!previewContent}
          onClose={() => setPreviewContent(null)}
        />
      )}
    </div>
  )
}