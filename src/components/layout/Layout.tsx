import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { LoanNotifications } from '@/components/notifications/LoanNotifications'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-secondary-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <LoanNotifications />
    </div>
  )
}
