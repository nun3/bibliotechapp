import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { LoanNotifications } from '@/components/notifications/LoanNotifications'
import { useMobileMenu } from '@/hooks/useMobileMenu'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isOpen, isMobile, toggle, close } = useMobileMenu()

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 left-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Sidebar 
        isOpen={isMobile ? isOpen : true} 
        onClose={close}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header onMenuToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <LoanNotifications />
    </div>
  )
}
