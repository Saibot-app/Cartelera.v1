import React from 'react'
import { Header } from '../components/Layout/Header'
import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Configuración del Sistema</h3>
          <p className="text-gray-500">Funcionalidad en desarrollo</p>
        </div>
      </main>
    </div>
  )
}