import React, { useState } from 'react'
import { Crown, Users, Monitor, FileText, List, Clock, Activity, Building2 } from 'lucide-react'
import { useGlobalAdmin } from '../../hooks/useGlobalAdmin'
import { CompanyManagement } from './CompanyManagement'
import { UserManagement } from './UserManagement'

export function GlobalAdminDashboard() {
  const { globalStats, loading } = useGlobalAdmin()
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'users'>('users') // Start with users tab

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total de Usuarios',
      value: globalStats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pantallas Registradas',
      value: globalStats.totalScreens,
      icon: Monitor,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Contenidos Creados',
      value: globalStats.totalContent,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Playlists Activas',
      value: globalStats.totalPlaylists,
      icon: List,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Programaciones',
      value: globalStats.totalSchedules,
      icon: Clock,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'Usuarios Activos',
      value: globalStats.activeUsers,
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <Crown className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Panel de Super Administrador</h1>
            <p className="text-yellow-100">Vista global del sistema SignagePro</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-4 flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-yellow-600'
                : 'text-yellow-100 hover:text-white hover:bg-yellow-600'
            }`}
          >
            Resumen General
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-yellow-600'
                : 'text-yellow-100 hover:text-white hover:bg-yellow-600'
            }`}
          >
            Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'companies'
                ? 'bg-white text-yellow-600'
                : 'text-yellow-100 hover:text-white hover:bg-yellow-600'
            }`}
          >
            Gestión de Empresas
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <div key={index} className={`${card.bgColor} rounded-xl p-6 border border-gray-100`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`bg-gradient-to-r ${card.color} p-3 rounded-xl`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Estado del Sistema</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Operativo
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Modo de Operación</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                MVP
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Base de Datos</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Supabase
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Versión</span>
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                1.0.0-MVP
              </span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'companies' && <CompanyManagement />}
    </div>
  )
}