import React, { useState, useEffect } from 'react'
import { Users, Edit, Trash2, Power, Plus, Eye, Crown, UserCheck } from 'lucide-react'
import { UserForm } from './UserForm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabaseClient'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'editor' | 'viewer'
  company_id: string | null
  created_at: string
  updated_at: string
  company?: {
    name: string
    company_id: string
  }
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [filter, setFilter] = useState<'all' | 'admin' | 'editor' | 'viewer'>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          company:companies!users_company_id_fkey(name, company_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
      alert('Rol actualizado exitosamente')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Error al actualizar el rol del usuario')
    }
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${userEmail}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      // First delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) throw authError

      // Then delete from users table (should cascade automatically)
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (userError) throw userError
      
      await loadUsers()
      alert('Usuario eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error al eliminar el usuario')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const handleFormSuccess = () => {
    loadUsers()
    handleCloseForm()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'editor':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown
      case 'editor':
        return Edit
      case 'viewer':
        return Eye
      default:
        return Users
    }
  }

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(user => user.role === filter)

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          <p className="text-gray-600">Administra todos los usuarios del sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los usuarios</option>
            <option value="admin">Administradores</option>
            <option value="editor">Editores</option>
            <option value="viewer">Visualizadores</option>
          </select>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const RoleIcon = getRoleIcon(user.role)
          return (
            <div
              key={user.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                        <RoleIcon className="w-3 h-3" />
                        <span className="capitalize">{user.role}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{user.email}</span>
                      {user.company && (
                        <>
                          <span>•</span>
                          <span>{user.company.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Creado: {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Role change buttons */}
                  <div className="flex items-center space-x-1">
                    {(['admin', 'editor', 'viewer'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => updateUserRole(user.id, role)}
                        disabled={user.role === role}
                        className={`p-2 rounded-lg transition-colors text-xs font-medium ${
                          user.role === role
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={`Cambiar a ${role}`}
                      >
                        {role.charAt(0).toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleEdit(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id, user.email)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="font-mono text-xs text-gray-900 truncate">{user.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rol</p>
                  <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Empresa</p>
                  <p className="font-semibold text-gray-900">
                    {user.company ? user.company.name : 'Sin empresa'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    Activo
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No hay usuarios registrados' : `No hay usuarios con rol "${filter}"`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? 'Los usuarios aparecerán aquí cuando se registren'
                : `Cambia el filtro o crea usuarios con rol "${filter}"`
              }
            </p>
            {filter === 'all' && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primer Usuario
              </button>
            )}
          </div>
        )}
      </div>

      <UserForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        user={editingUser}
      />
    </div>
  )
}