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
    <div className="flex h-screen bg-secondary-50">
      <Sidebar 
        isOpen={isMobile ? isOpen : true} 
        onClose={close}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      <LoanNotifications />
    </div>
  )
}
