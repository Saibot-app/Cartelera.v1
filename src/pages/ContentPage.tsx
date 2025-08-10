import React from 'react'
import { Header } from '../components/Layout/Header'
import { ContentList } from '../components/Content/ContentList'

export function ContentPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <ContentList />
      </main>
    </div>
  )
}