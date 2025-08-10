import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/auth/AuthForm'
import { Sidebar } from './components/Layout/Sidebar'
import { DashboardPage } from './pages/DashboardPage'
import { ScreensPage } from './pages/ScreensPage'
import { ContentPage } from './pages/ContentPage'
import { PlaylistsPage } from './pages/PlaylistsPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { DisplayPage } from './pages/DisplayPage'
import { SettingsPage } from './pages/SettingsPage'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        <Routes>
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/display/:screenId" element={<DisplayPage />} />
          <Route 
            path="/*" 
            element={
              <div className="flex w-full">
                <Sidebar />
                <div className="flex-1">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/screens" element={<ScreensPage />} />
                    <Route path="/content" element={<ContentPage />} />
                    <Route path="/playlists" element={<PlaylistsPage />} />
                    <Route path="/schedules" element={<SchedulesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App