import React from 'react'
import { Header } from '../components/Layout/Header'
import { PlaylistsList } from '../components/Playlists/PlaylistsList'

export function PlaylistsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <PlaylistsList />
      </main>
    </div>
  )
}