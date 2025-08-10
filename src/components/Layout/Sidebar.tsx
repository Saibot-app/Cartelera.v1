import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Monitor, 
  FileText, 
  PlayCircle, 
  Calendar, 
  BarChart3, 
  Settings,
  Tv,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function Sidebar() {
  const location = useLocation()
  const { signOut } = useAuth()

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Monitor, label: 'Pantallas', path: '/screens' },
    { icon: FileText, label: 'Contenido', path: '/content' },
    { icon: PlayCircle, label: 'Playlists', path: '/playlists' },
    { icon: Calendar, label: 'Programación', path: '/schedules' },
    { icon: Tv, label: 'Vista Display', path: '/display' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">SignagePro</h1>
            <p className="text-gray-400 text-sm">Digital Signage</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-6 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}