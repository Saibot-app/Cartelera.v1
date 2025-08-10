import React from 'react'
import { Header } from '../components/Layout/Header'
import { ScreensList } from '../components/Screens/ScreensList'

export function ScreensPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <ScreensList />
      </main>
    </div>
  )
}