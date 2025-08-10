import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, Building2, User, Search, Plus, Upload, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { uploadUserFile } from '../../lib/storage'
import { useAuth } from '../../hooks/useAuth'

const companySchema = yup.object().shape({
  name: yup.string().required('Nombre de empresa requerido').min(2, 'Mínimo 2 caracteres'),
  company_id: yup.string().required('ID de empresa requerido').min(3, 'Mínimo 3 caracteres'),
  super_admin_email: yup.string().email('Email inválido').required('Email del super admin requerido'),
  super_admin_name: yup.string().required('Nombre del super admin requerido'),
  subscription_plan: yup.string().required('Plan requerido'),
  max_users: yup.number().positive('Debe ser mayor a 0').required('Límite de usuarios requerido'),
  max_screens: yup.number().positive('Debe ser mayor a 0').required('Límite de pantallas requerido'),
})

interface CompanyFormData {
  name: string
  company_id: string
  super_admin_email: string
  super_admin_name: string
  subscription_plan: string
  max_users: number
  max_screens: number
  primary_color: string
  secondary_color: string
  accent_color: string
}

interface CompanyFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  company?: any
}

export function CompanyForm({ isOpen, onClose, onSuccess, company }: CompanyFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CompanyFormData>({
    resolver: yupResolver(companySchema),
    defaultValues: {
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      accent_color: '#F59E0B',
      subscription_plan: 'basic',
      max_users: 50,
      max_screens: 20,
    }
  })


  React.useEffect(() => {
    if (!isOpen) return // Solo ejecutar si el modal está abierto
    
    if (company) {
      Object.keys(company).forEach((key) => {
        if (key in company) {
          setValue(key as keyof CompanyFormData, company[key])
        }
      })
      if (company.logo_url) {
        setLogoPreview(company.logo_url)
      }
    }
  }, [company, setValue, isOpen])

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      
      if (!allowedTypes.includes(file.type)) {
        setError(`Tipo de archivo no permitido. Tipos permitidos: JPG, PNG, GIF, WEBP, SVG`)
        return
      }

      // Validate file size (5MB max for logos)
      if (file.size > 5 * 1024 * 1024) {
        setError('El logo es demasiado grande. Máximo 5MB.')
        return
      }

      setLogoFile(file)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user) return null
    
    setUploadingLogo(true)
    try {
      const { url } = await uploadUserFile(user.id, logoFile)
      return url
    } catch (error) {
      console.error('Error uploading logo:', error)
      throw new Error('Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
  }

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true)
    setError('')

    try {
      // Upload logo if selected
      let logoUrl = company?.logo_url || null
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      // 1. Create or update company
      const companyData = {
        name: data.name,
        company_id: data.company_id,
        logo_url: logoUrl,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        accent_color: data.accent_color,
        is_active: true,
        subscription_plan: data.subscription_plan,
        max_users: data.max_users,
        max_screens: data.max_screens,
      }

      let companyId: string

      if (company) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id)

        if (updateError) throw updateError
        companyId = company.id
      } else {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert(companyData)
          .select()
          .single()

        if (createError) throw createError
        companyId = newCompany.id
      }

      // 2. Create super admin user via secure Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-company-user', {
        body: {
          email: data.super_admin_email,
          full_name: data.super_admin_name,
          company_id: companyId,
          role: 'admin',
        },
      })

      if (functionError || (functionData && functionData.success === false)) {
        const msg = functionError?.message ?? functionData?.error ?? 'Unknown error';
        console.error('create-company-user failed:', { error: functionError, data: functionData });
        throw new Error(`Create super admin failed: ${msg}`);
      }

      console.log('User created/assigned successfully:', functionData?.message)
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Error creating/updating company:', err)
      setError(err.message || 'Error al crear/actualizar empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setLogoFile(null)
    setLogoPreview('')
    setError('')
    onClose()
  }

  const generateCompanyId = () => {
    const name = watch('name')
    if (name) {
      const id = name.toLowerCase().replace(/\s+/g, '').slice(0, 8)
      setValue('company_id', id)
    }
  }

  const handleColorChange = (colorType: 'primary_color' | 'secondary_color' | 'accent_color', value: string) => {
    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (value.startsWith('#') && hexRegex.test(value)) {
      setValue(colorType, value)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {company ? 'Editar Empresa' : 'Nueva Empresa'}
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

          {/* Company Information */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Información de la Empresa</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Mi Empresa S.A."
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Empresa
                </label>
                <div className="flex space-x-2">
                  <input
                    {...register('company_id')}
                    type="text"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="miempresa"
                  />
                  <button
                    type="button"
                    onClick={generateCompanyId}
                    className="px-3 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Generar desde nombre"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.company_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.company_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de la Empresa
                </label>
                
                {!logoPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Subir Logo</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, SVG hasta 5MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-24 object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* URL del Logo (alternativa) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  O URL del Logo (opcional)
                </label>
                <input
                  type="url"
                  value={logoPreview.startsWith('http') ? logoPreview : ''}
                  onChange={(e) => {
                    const url = e.target.value
                    if (url) {
                      setLogoPreview(url)
                      setLogoFile(null)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="https://ejemplo.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Super Admin Assignment */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-green-600" />
              <span>Super Administrador (se creará nuevo usuario)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Super Admin
                </label>
                <input
                  {...register('super_admin_email')}
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="admin@empresa.com"
                />
                <p className="text-blue-600 text-sm mt-1">
                  ℹ️ Se creará una nueva cuenta con este email si no existe
                </p>
                {errors.super_admin_email && (
                  <p className="text-red-500 text-sm mt-1">{errors.super_admin_email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  {...register('super_admin_name')}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Juan Pérez"
                />
                {errors.super_admin_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.super_admin_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Company Configuration */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configuración y Límites
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan de Suscripción
                </label>
                <select
                  {...register('subscription_plan')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="basic">Básico</option>
                  <option value="professional">Profesional</option>
                  <option value="enterprise">Empresarial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite de Usuarios
                </label>
                <input
                  {...register('max_users')}
                  type="number"
                  min="1"
                  max="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {errors.max_users && (
                  <p className="text-red-500 text-sm mt-1">{errors.max_users.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Límite de Pantallas
                </label>
                <input
                  {...register('max_screens')}
                  type="number"
                  min="1"
                  max="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {errors.max_screens && (
                  <p className="text-red-500 text-sm mt-1">{errors.max_screens.message}</p>
                )}
              </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-4 mt-6">
              <h4 className="font-medium text-gray-900">Colores de Marca</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Primario
                </label>
                <div className="flex space-x-2">
                  <input
                    {...register('primary_color')}
                    type="color"
                    className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={watch('primary_color')}
                    onChange={(e) => handleColorChange('primary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Secundario
                </label>
                <div className="flex space-x-2">
                  <input
                    {...register('secondary_color')}
                    type="color"
                    className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={watch('secondary_color')}
                    onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="#1E40AF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color de Acento
                </label>
                <div className="flex space-x-2">
                  <input
                    {...register('accent_color')}
                    type="color"
                    className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={watch('accent_color')}
                    onChange={(e) => handleColorChange('accent_color', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
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
              disabled={loading || uploadingLogo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploadingLogo ? 'Guardando...' : company ? 'Actualizar Empresa' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}