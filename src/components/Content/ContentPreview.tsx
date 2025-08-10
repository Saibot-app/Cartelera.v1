import React from 'react'
import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { getSignedUrl } from '../../lib/storage'

interface ContentPreviewProps {
  content: {
    id: string
    title: string
    type: 'text' | 'image' | 'video' | 'html'
    content_data: any
    duration: number
  }
  isOpen: boolean
  onClose: () => void
}

export function ContentPreview({ content, isOpen, onClose }: ContentPreviewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)

  useEffect(() => {
    if (isOpen && (content.type === 'image' || content.type === 'video') && content.content_data.storage_path) {
      loadSignedUrl()
    }
  }, [isOpen, content])

  const loadSignedUrl = async () => {
    if (!content.content_data.storage_path) return
    
    setLoadingUrl(true)
    try {
      const url = await getSignedUrl(content.content_data.storage_path)
      setSignedUrl(url)
    } catch (error) {
      console.error('Error loading signed URL:', error)
    } finally {
      setLoadingUrl(false)
    }
  }

  if (!isOpen) return null

  const renderPreview = () => {
    switch (content.type) {
      case 'text':
        return (
          <div 
            className="w-full h-96 flex items-center justify-center rounded-lg"
            style={{ 
              backgroundColor: content.content_data.backgroundColor || '#F3F4F6',
              color: content.content_data.color || '#1F2937'
            }}
          >
            <span 
              className="font-bold text-center px-4"
              style={{ 
                fontSize: content.content_data.fontSize || '48px',
                textAlign: content.content_data.textAlign || 'center'
              }}
            >
              {content.content_data.text}
            </span>
          </div>
        )

      case 'image':
        return (
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            {loadingUrl ? (
              <div className="text-gray-500">Cargando imagen...</div>
            ) : signedUrl ? (
              <img
                src={signedUrl}
                alt={content.content_data.alt || content.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : content.content_data.url ? (
              <img
                src={content.content_data.url}
                alt={content.content_data.alt || content.title}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=800'
                }}
              />
            ) : (
              <div className="text-gray-500">Error al cargar imagen</div>
            )}
          </div>
        )

      case 'video':
        return (
          <div className="w-full h-96 bg-black rounded-lg flex items-center justify-center overflow-hidden">
            {loadingUrl ? (
              <div className="text-white">Cargando video...</div>
            ) : signedUrl ? (
              <video
                src={signedUrl}
                controls
                className="max-w-full max-h-full"
              >
                Tu navegador no soporta el elemento video.
              </video>
            ) : content.content_data.url ? (
              <video
                src={content.content_data.url}
                controls
                className="max-w-full max-h-full"
                onError={(e) => {
                  console.error('Error loading video:', e)
                }}
              >
                Tu navegador no soporta el elemento video.
              </video>
            ) : (
              <div className="text-white">Error al cargar video</div>
            )}
          </div>
        )

      case 'html':
        return (
          <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              srcDoc={content.content_data.html}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin"
              title={`Preview: ${content.title}`}
            />
          </div>
        )

      default:
        return (
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Vista previa no disponible</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{content.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span className="capitalize">{content.type}</span>
              <span>•</span>
              <span>{content.duration}s duración</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.open(`/display?preview=${content.id}`, '_blank')}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Abrir en pantalla completa"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {renderPreview()}
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Información del contenido</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium capitalize">{content.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Duración:</span>
                <span className="ml-2 font-medium">{content.duration} segundos</span>
              </div>
              {content.content_data.fileSize && (
                <div>
                  <span className="text-gray-600">Tamaño:</span>
                  <span className="ml-2 font-medium">
                    {(content.content_data.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
              {content.content_data.mimeType && (
                <div>
                  <span className="text-gray-600">Formato:</span>
                  <span className="ml-2 font-medium">{content.content_data.mimeType}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}