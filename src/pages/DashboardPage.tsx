import React from 'react'
import { Header } from '../components/Layout/Header'
import { DashboardOverview } from '../components/Dashboard/DashboardOverview'
import { GlobalAdminDashboard } from '../components/GlobalAdmin/GlobalAdminDashboard'
import { useGlobalAdmin } from '../hooks/useGlobalAdmin'
import { useAuth } from '../hooks/useAuth'
import { Crown } from 'lucide-react'

export function DashboardPage() {
  const { isGlobalAdmin, loading } = useGlobalAdmin()
  const { user } = useAuth()

  // Debug logging
  console.log('DashboardPage - User email:', user?.email)
  console.log('DashboardPage - Is global admin:', isGlobalAdmin)
  console.log('DashboardPage - Loading:', loading)

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-yellow-400 mr-2" />
            <div className="text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>Email: {user?.email}</p>
              <p>Is Global Admin: {isGlobalAdmin ? 'YES' : 'NO'}</p>
              <p>Expected: saibot.app@gmail.com</p>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 p-6 bg-gray-50">
        {isGlobalAdmin ? (
          <div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 flex items-center">
                <Crown className="w-4 h-4 mr-2" />
                Acceso de Super Administrador activo
              </p>
            </div>
          <GlobalAdminDashboard />
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                Vista de usuario normal - Para acceso de super admin, usar email: saibot.app@gmail.com
              </p>
            </div>
          <DashboardOverview />
          </div>
        )}
      </main>
    </div>
  )
}