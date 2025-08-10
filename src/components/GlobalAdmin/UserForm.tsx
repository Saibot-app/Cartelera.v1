import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { X, User, Search, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const userSchema = yup.object().shape({
  email: yup.string()
    .email('Por favor, introduce una dirección de correo electrónico válida')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El formato del email es inválido - debe contener @')
    .required('El email es requerido'),
  full_name: yup.string().required('Nombre completo requerido'),
  role: yup.string().oneOf(['admin', 'editor', 'viewer']).required('Rol requerido'),
  company_id: yup.string().nullable(),
  password: yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un símbolo')
    .nullable(),
})

interface UserFormData {
  email: string
  full_name: string
  role: 'admin' | 'editor' | 'viewer'
  company_id: string | null
  password: string | null
}

interface Company {
  id: string
  name: string
  company_id: string
}

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user?: any
}

export function UserForm({ isOpen, onClose, onSuccess, user }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserFormData>({
    resolver: yupResolver(userSchema),
    defaultValues: {
      role: 'viewer',
      company_id: null,
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadCompanies()
      if (user) {
        setValue('email', user.email)
        setValue('full_name', user.full_name)
        setValue('role', user.role)
        setValue('company_id', user.company_id)
      }
    }
  }, [isOpen, user])

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, company_id')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
    }
  }

  const onSubmit = async (data: UserFormData) => {
    setLoading(true)
    setError('')

    try {
      const requestBody = {
        email: data.email,
        full_name: data.full_name,
        company_id: data.company_id || null,
        role: data.role,
        ...(data.password && data.password.trim() !== '' && { password: data.password })
      }

      // DEBUG LOGGING: Check email before sending to Edge Function
      console.log('DEBUG - Email from form:', data.email)
      console.log('DEBUG - Email contains @:', data.email?.includes('@'))
      console.log('DEBUG - Full payload:', requestBody)

      console.log('Calling Edge Function with data:', requestBody)
      
      const { data: result, error } = await supabase.functions.invoke('create-company-user', {
        body: requestBody
      })

      if (error) {
        console.error('Edge Function error:', error)
        throw new Error(`Edge Function Error: ${error.message}`)
      }

      if (!result?.success) {
        console.error('Edge Function returned failure:', result)
        const errorMessage = result?.error || 'Unknown error from Edge Function'
        throw new Error(`User Creation Failed: ${errorMessage}`)
      }

      console.log('User creation/update successful:', result)

      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Error creating/updating user:', err)
      setError(err.message || 'Error al crear/actualizar usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    setShowPassword(false)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              disabled={!!user} // Disable email editing for existing users
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100"
              placeholder="usuario@email.com"
            />
            {user && (
              <p className="text-xs text-gray-500 mt-1">
                El email no se puede modificar para usuarios existentes
              </p>
            )}
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo
            </label>
            <input
              {...register('full_name')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Juan Pérez"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              {...register('role')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="viewer">Viewer - Solo lectura</option>
              <option value="editor">Editor - Puede crear y editar contenido</option>
              <option value="admin">Admin - Acceso completo</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Empresa (Opcional)
            </label>
            <select
              {...register('company_id')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Sin empresa asignada</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.company_id})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Los usuarios pueden trabajar sin estar asignados a una empresa específica
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña {user ? '(Opcional)' : ''}
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={user ? 'Dejar vacío para mantener contraseña actual' : 'Mínimo 8 caracteres'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {user 
                ? 'Solo completa este campo si deseas cambiar la contraseña'
                : 'Debe contener al menos 8 caracteres con mayúscula, minúscula, número y símbolo'
              }
            </p>
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
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : user ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}