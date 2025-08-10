import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DisplayScreen } from '../components/Display/DisplayScreen'
import { ScreenSelector } from '../components/Display/ScreenSelector'

export function DisplayPage() {
  const { screenId } = useParams()
  const navigate = useNavigate()

  const handleSelectScreen = (selectedScreenId: string) => {
    if (selectedScreenId === 'generic') {
      // Para vista genérica, navegar a /display sin screenId
      navigate('/display/generic')
    } else {
      // Para pantalla específica, navegar a /display/:screenId
      navigate(`/display/${selectedScreenId}`)
    }
  }

  // Si hay screenId en la URL, mostrar la pantalla de display
  if (screenId) {
    return <DisplayScreen />
  }

  // Si no hay screenId, mostrar el selector de pantallas
  return <ScreenSelector onSelectScreen={handleSelectScreen} />
}