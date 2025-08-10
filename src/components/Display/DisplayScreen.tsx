import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Play, Pause } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabaseClient'
import { getSignedUrl } from '../../lib/storage'

interface ContentItem {
  id: string
  title: string
  type: 'text' | 'image' | 'video' | 'html'
  content_data: any
  duration: number
}

export function DisplayScreen() {
  const { screenId: paramScreenId } = useParams()
  const navigate = useNavigate()
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [playlist, setPlaylist] = useState<ContentItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [signedUrls, setSignedUrls] = useState<{[key: string]: string}>({})
  const [videoErrors, setVideoErrors] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    loadPlaylist()
  }, [])

  useEffect(() => {
    if (playlist.length > 0) {
      setCurrentContent(playlist[currentIndex])
    }
  }, [playlist, currentIndex])

  useEffect(() => {
    if (currentContent && playlist.length > 1 && isPlaying) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % playlist.length)
      }, currentContent.duration * 1000)

      return () => clearTimeout(timer)
    }
  }, [currentContent, playlist.length, isPlaying])

  useEffect(() => {
    // Load signed URLs for media content
    if (playlist.length > 0) {
      loadSignedUrls()
    }
  }, [playlist])

  const loadSignedUrls = async () => {
    const urlPromises = playlist
      .filter(item => (item.type === 'image' || item.type === 'video') && item.content_data.storage_path)
      .map(async (item) => {
        try {
          const url = await getSignedUrl(item.content_data.storage_path)
          return { id: item.id, url }
        } catch (error) {
          console.error('Error loading signed URL for:', item.id, error)
          return { id: item.id, url: null }
        }
      })

    const results = await Promise.all(urlPromises)
    const urlMap = results.reduce((acc, result) => {
      if (result.url) {
        acc[result.id] = result.url
      }
      return acc
    }, {} as {[key: string]: string})

    setSignedUrls(urlMap)
  }

  const loadPlaylist = async () => {
    try {
      // Check if we're in preview mode
      const urlParams = new URLSearchParams(window.location.search)
      const previewId = urlParams.get('preview')
      const screenId = urlParams.get('screen') || paramScreenId
      
      if (previewId) {
        // Load single content for preview
        const { data: contentData, error } = await supabase
          .from('content')
          .select('*')
          .eq('id', previewId)
          .single()

        if (error) throw error

        if (contentData) {
          const formattedContent: ContentItem = {
            id: contentData.id,
            title: contentData.title,
            type: contentData.type,
            content_data: contentData.content_data,
            duration: contentData.duration
          }
          setPlaylist([formattedContent])
          return
        }
      }

      // Check for active schedules for this screen
      const now = new Date()
      const currentDay = now.getDay()
      const currentTime = format(now, 'HH:mm')

      let contentData = null

      if (screenId) {
        // Load scheduled content for specific screen
        const actualScreenId = screenId === 'generic' ? null : screenId
        const { data: activeSchedules, error: scheduleError } = await supabase
          .from('schedules')
          .select(`
            *,
            playlist:playlists (
              id,
              name,
              playlist_items (
                id,
                content_id,
                order_index,
                content (
                  id,
                  title,
                  type,
                  content_data,
                  duration
                )
              )
            )
          `)
          .eq('screen_id', actualScreenId || '')
          .eq('is_active', true)
          .contains('days_of_week', [currentDay])
          .lte('start_time', currentTime)
          .gte('end_time', currentTime)

        // Skip schedule loading if screenId is 'generic'
        if (screenId !== 'generic') {
        if (scheduleError) throw scheduleError

        if (activeSchedules && activeSchedules.length > 0) {
          // Use the first active schedule
          const schedule = activeSchedules[0]
          if (schedule.playlist?.playlist_items) {
            contentData = schedule.playlist.playlist_items
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((item: any) => item.content)
              .filter((content: any) => content)
          }
        }
        }
      }

      // If no scheduled content, load active content from database
      if (!contentData || contentData.length === 0) {
        const { data: fallbackData, error } = await supabase
          .from('content')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        contentData = fallbackData
      }

      // Si hay contenido en la base de datos, usarlo; si no, usar contenido demo
      if (contentData && contentData.length > 0) {
        const formattedContent: ContentItem[] = contentData.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          content_data: item.content_data,
          duration: item.duration
        }))
        setPlaylist(formattedContent)
      } else {
        // Contenido demo si no hay contenido en la base de datos
        const demoContent: ContentItem[] = [
          {
            id: '1',
            title: 'Bienvenidos',
            type: 'text',
            content_data: {
              text: 'Bienvenidos a nuestra empresa',
              fontSize: '48px',
              color: '#1F2937',
              backgroundColor: '#F3F4F6'
            },
            duration: 5
          },
          {
            id: '2',
            title: 'Promoción Enero',
            type: 'image',
            content_data: {
              url: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080',
              alt: 'Promoción especial'
            },
            duration: 8
          },
          {
            id: '3',
            title: 'Horarios de Atención',
            type: 'html',
            content_data: {
              html: `
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; font-family: 'Arial', sans-serif;">
                  <h1 style="font-size: 4rem; margin-bottom: 2rem; font-weight: bold;">Horarios de Atención</h1>
                  <div style="font-size: 2rem; line-height: 1.5;">
                    <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                    <p>Sábados: 9:00 AM - 2:00 PM</p>
                    <p style="margin-top: 1rem; font-size: 1.5rem; opacity: 0.9;">¡Te esperamos!</p>
                  </div>
                </div>
              `
            },
            duration: 6
          }
        ]
        setPlaylist(demoContent)
      }
    } catch (error) {
      console.error('Error loading playlist:', error)
      // En caso de error, mostrar mensaje de error
      setPlaylist([])
    }
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length)
  }

  const handleMouseMove = () => {
    setShowControls(true)
    setTimeout(() => setShowControls(false), 3000)
  }

  const renderContent = () => {
    if (!currentContent) return null

    switch (currentContent.type) {
      case 'text':
        return (
          <div 
            className="flex items-center justify-center h-full"
            style={{ 
              backgroundColor: currentContent.content_data.backgroundColor || '#F3F4F6',
              color: currentContent.content_data.color || '#1F2937'
            }}
          >
            <h1 
              className="text-center font-bold"
              style={{ fontSize: currentContent.content_data.fontSize || '48px' }}
            >
              {currentContent.content_data.text}
            </h1>
          </div>
        )

      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-black">
            {signedUrls[currentContent.id] ? (
              <img
                src={signedUrls[currentContent.id]}
                alt={currentContent.content_data.alt || currentContent.title}
                className="max-w-full max-h-full object-contain"
              />
            ) : currentContent.content_data.url ? (
              <img
                src={currentContent.content_data.url}
                alt={currentContent.content_data.alt || currentContent.title}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080'
                }}
              />
            ) : (
              <div className="text-white">Cargando imagen...</div>
            )}
          </div>
        )

      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-black">
            {videoErrors[currentContent.id] ? (
              <div className="text-white text-center">
                <p>Video no disponible</p>
                <p className="text-sm text-gray-400 mt-2">Verificar formato o conexión</p>
              </div>
            ) : signedUrls[currentContent.id] ? (
              <video
                src={signedUrls[currentContent.id]}
                autoPlay
                muted
                loop
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.warn('Failed to load video from signed URL')
                  setVideoErrors(prev => ({ ...prev, [currentContent.id]: true }))
                }}
              />
            ) : currentContent.content_data.url ? (
              <video
                src={currentContent.content_data.url}
                autoPlay
                muted
                loop
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  console.warn('Video failed to load')
                  setVideoErrors(prev => ({ ...prev, [currentContent.id]: true }))
                }}
              />
            ) : (
              <div className="text-white">Cargando video...</div>
            )}
          </div>
        )

      case 'html':
        return (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: currentContent.content_data.html }}
          />
        )

      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-gray-500">Tipo de contenido no soportado</p>
          </div>
        )
    }
  }

  if (playlist.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="mb-8">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Cargando contenido...</h2>
            <p className="text-gray-300">No hay contenido disponible para mostrar</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
    >
      {renderContent()}
      
      {/* Controles de navegación */}
      <div className={`absolute top-4 left-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-lg transition-colors backdrop-blur-sm"
          title="Volver al Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Controles de reproducción */}
      {playlist.length > 1 && (
        <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={goToPrevious}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-lg transition-colors backdrop-blur-sm"
            title="Anterior"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlayback}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-lg transition-colors backdrop-blur-sm"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={goToNext}
            className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-lg transition-colors backdrop-blur-sm"
            title="Siguiente"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      )}

      {/* Información del contenido actual */}
      <div className={`absolute bottom-20 left-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold">{currentContent?.title}</h3>
          <p className="text-sm text-gray-300 capitalize">{currentContent?.type}</p>
          <p className="text-xs text-gray-400">
            {currentIndex + 1} de {playlist.length} • {currentContent?.duration}s
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      {playlist.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {playlist.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Barra de progreso del contenido actual */}
      {currentContent && isPlaying && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
          <div 
            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
            style={{
              width: `${((Date.now() % (currentContent.duration * 1000)) / (currentContent.duration * 1000)) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  )
}