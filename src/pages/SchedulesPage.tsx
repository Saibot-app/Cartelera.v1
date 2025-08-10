import React from 'react'
import { Header } from '../components/Layout/Header'
import { SchedulesList } from '../components/Schedules/SchedulesList'

export function SchedulesPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <main className="flex-1 p-6 bg-gray-50">
        <SchedulesList />
      </main>
    </div>
  )
}