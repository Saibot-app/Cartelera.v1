import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, Upload, FileText, Image, Video, Code, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../hooks/useAuth'
import { uploadUserFile } from '../../lib/storage'

const contentSchema = yup.object().shape({
  title: yup.string().required('Título requerido').min(3, 'Mínimo 3 caracteres'),
  type: yup.string().oneOf(['text', 'image', 'video', 'html']).required('Tipo requerido'),
  duration: yup.number().min(1, 'Mínimo 1 segundo').max(300, 'Máximo 5 minutos').required('Duración requerida'),
})

interface ContentFormData {
  title: string
  type: 'text' | 'image' | 'video' | 'html'
  duration: number
}

interface ContentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ContentForm({ isOpen, onClose, onSuccess }: ContentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [textStyle, setTextStyle] = useState({
    fontSize: '48px',
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    textAlign: 'center' as const
  })
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ContentFormData>({
    resolver: yupResolver(contentSchema),
    defaultValues: {
      duration: 5,
      type: 'text'
    }
  })

  const contentType = watch('type')

  const uploadFile = async (file: File): Promise<string> => {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      throw new Error('Please sign in')
    }
    return await uploadUserFile(authData.user.id, file)
  }

  const onSubmit = async (data: ContentFormData) => {
    setLoading(true)
    setError('')
    setUploadProgress(0)

    try {
      let contentData: any = {}

      switch (data.type) {
        case 'text':
          contentData = {
            text: textContent,
            ...textStyle
          }
          break

        case 'image':
        case 'video':
          if (!selectedFile) {
            throw new Error('Archivo requerido')
          }
          setUploadProgress(25)
          const { path, url } = await uploadFile(selectedFile)
          setUploadProgress(75)
          contentData = {
            url: url,
            storage_path: path,
            alt: data.title,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type
          }
          break

        case 'html':
          contentData = {
            html: htmlContent
          }
          break
      }

      setUploadProgress(90)

      const { error: insertError } = await supabase
        .from('content')
        .insert({
          title: data.title,
          type: data.type,
          content_data: contentData,
          duration: data.duration,
          created_by: user?.id
        })

      if (insertError) throw insertError

      setUploadProgress(100)
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Error al crear contenido')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    reset()
    setSelectedFile(null)
    setTextContent('')
    setHtmlContent('')
    setError('')
    setUploadProgress(0)
    onClose()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = contentType === 'image' 
        ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        : ['video/mp4', 'video/webm', 'video/ogg']
      
      if (!allowedTypes.includes(file.type)) {
        setError(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`)
        return
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 50MB.')
        return
      }

      setSelectedFile(file)
      setError('')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText
      case 'image': return Image
      case 'video': return Video
      case 'html': return Code
      default: return FileText
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Contenido</h2>
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

          {uploadProgress > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Subiendo archivo...</span>
                <span className="text-sm text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Nombre del contenido"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración (segundos)
              </label>
              <input
                {...register('duration')}
                type="number"
                min="1"
                max="300"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="5"
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Contenido
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'text', label: 'Texto', icon: FileText },
                { value: 'image', label: 'Imagen', icon: Image },
                { value: 'video', label: 'Video', icon: Video },
                { value: 'html', label: 'HTML', icon: Code },
              ].map(({ value, label, icon: Icon }) => (
                <label key={value} className="relative">
                  <input
                    {...register('type')}
                    type="radio"
                    value={value}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-colors">
                    <Icon className="w-6 h-6 text-gray-400 peer-checked:text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 peer-checked:text-blue-700">
                      {label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Content Type Specific Fields */}
          {contentType === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto a mostrar
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  rows={3}
                  placeholder="Ingresa el texto que se mostrará en pantalla"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamaño de fuente
                  </label>
                  <select
                    value={textStyle.fontSize}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="24px">Pequeño (24px)</option>
                    <option value="36px">Mediano (36px)</option>
                    <option value="48px">Grande (48px)</option>
                    <option value="64px">Extra Grande (64px)</option>
                    <option value="96px">Gigante (96px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color de texto
                  </label>
                  <input
                    type="color"
                    value={textStyle.color}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color de fondo
                  </label>
                  <input
                    type="color"
                    value={textStyle.backgroundColor}
                    onChange={(e) => setTextStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                <div 
                  className="w-full h-32 flex items-center justify-center rounded-lg"
                  style={{ 
                    backgroundColor: textStyle.backgroundColor,
                    color: textStyle.color
                  }}
                >
                  <span 
                    className="font-bold text-center"
                    style={{ fontSize: textStyle.fontSize }}
                  >
                    {textContent || 'Texto de ejemplo'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {(contentType === 'image' || contentType === 'video') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo {contentType === 'image' ? 'de imagen' : 'de video'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept={contentType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  required
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Seleccionar {contentType === 'image' ? 'imagen' : 'video'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {contentType === 'image' 
                      ? 'PNG, JPG, GIF, WEBP hasta 50MB'
                      : 'MP4, WEBM, OGG hasta 50MB'
                    }
                  </p>
                </label>
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {contentType === 'image' ? (
                        <Image className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Video className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {contentType === 'html' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código HTML
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm"
                rows={8}
                placeholder="<div>Tu código HTML aquí...</div>"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes usar HTML, CSS y JavaScript básico
              </p>
            </div>
          )}

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
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <span>Crear Contenido</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}