import React, { useState } from 'react'
import { Building2, Users, Monitor, FileText, Edit, Trash2, Power, Plus, Eye } from 'lucide-react'
import { CompanyForm } from './CompanyForm'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabaseClient'

export function CompanyManagement() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<any>(null)

  React.useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          company_users!inner (
            user_id,
            role,
            is_active,
            users (
              id,
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const toggleCompanyStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !currentStatus })
        .eq('id', companyId)

      if (error) throw error
      await loadCompanies()
    } catch (error) {
      console.error('Error toggling company status:', error)
    }
  }

  const deleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${companyName}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (error) throw error
      await loadCompanies()
      alert('Empresa eliminada exitosamente')
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Error al eliminar la empresa')
    }
  }

  const handleEdit = (company: any) => {
    setEditingCompany(company)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCompany(null)
  }

  const handleFormSuccess = () => {
    loadCompanies()
    handleCloseForm()
  }

  const filteredCompanies = showInactive 
    ? companies 
    : companies.filter(company => company.is_active)

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h2>
          <p className="text-gray-600">Administra todas las empresas del sistema</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Mostrar inactivas</span>
          </label>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className={`border rounded-xl p-6 transition-colors ${
              company.is_active 
                ? 'border-gray-200 bg-white' 
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: company.primary_color }}
                >
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={`${company.name} logo`}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    company.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    {!company.is_active && (
                      <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>ID: {company.company_id}</span>
                    <span>•</span>
                    <span>Plan: {company.plan_type}</span>
                    <span>•</span>
                    <span>Creada: {format(new Date(company.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    company.is_active
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={company.is_active ? 'Desactivar empresa' : 'Activar empresa'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button 
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver detalles"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEdit(company)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Editar empresa"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCompany(company.id, company.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar empresa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Company Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Usuarios</p>
                  <p className="font-semibold text-gray-900">
                    {company._count?.users || 0}/{company.user_limit}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Pantallas</p>
                  <p className="font-semibold text-gray-900">
                    {company._count?.screens || 0}/{company.screen_limit}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Contenido</p>
                  <p className="font-semibold text-gray-900">0</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className={`font-semibold ${company.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showInactive ? 'No hay empresas inactivas' : 'No hay empresas registradas'}
            </h3>
            <p className="text-gray-500 mb-6">
              {showInactive 
                ? 'Todas las empresas están activas en este momento'
                : 'Comienza creando tu primera empresa en el sistema'
              }
            </p>
            {!showInactive && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primera Empresa
              </button>
            )}
          </div>
        )}
      </div>

      <CompanyForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
        company={editingCompany}
      />
    </div>
  )
}