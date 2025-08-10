import React from 'react'
import { Bell, User, Crown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useGlobalAdmin } from '../../hooks/useGlobalAdmin'

export function Header() {
  const { user } = useAuth()
  const { isGlobalAdmin } = useGlobalAdmin()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-semibold text-gray-900">
              {isGlobalAdmin ? 'Super Admin Dashboard' : 'Dashboard'}
            </h2>
            {isGlobalAdmin && (
              <Crown className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <p className="text-gray-600">
            {isGlobalAdmin ? 'Gestión global del sistema' : 'Gestiona tu contenido digital'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
            isGlobalAdmin ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
          }`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              {isGlobalAdmin ? (
                <Crown className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-sm">
              <div className="flex items-center space-x-1">
                <p className="font-medium text-gray-900">
                  {user?.user_metadata?.full_name || 'Usuario'}
                </p>
                {isGlobalAdmin && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-1.5 py-0.5 rounded">
                    GLOBAL
                  </span>
                )}
              </div>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}