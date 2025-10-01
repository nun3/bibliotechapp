import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Home,
  Search,
  User,
  Calendar,
  Settings,
  LogOut,
  Library,
  Shield,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { isAdmin } = useAdmin()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Catálogo', href: '/catalog', icon: BookOpen },
    { name: 'Meus Empréstimos', href: '/loans', icon: Calendar },
    { name: 'Perfil', href: '/profile', icon: User },
    { name: 'Configurações', href: '/settings', icon: Settings },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield }] : [])
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "flex h-full flex-col backdrop-blur-xl bg-white/10 border-r border-white/20 transition-transform duration-300 ease-in-out relative z-30",
        "md:relative md:translate-x-0 md:w-64",
        isOpen ? "fixed inset-y-0 left-0 w-64 z-50 translate-x-0" : "fixed inset-y-0 left-0 w-64 z-50 -translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg blur-sm opacity-60"></div>
              <Library className="relative h-8 w-8 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Bibliotech</span>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose} // Close mobile menu when navigating
                className={cn(
                  'group flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 transform hover:scale-[1.02]',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-white/20 shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-purple-300' : 'text-white/50 group-hover:text-white'
                  )}
                />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-white/20 p-4">
          <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm font-semibold text-white">{user?.user_metadata?.full_name || 'Usuário'}</p>
            <p className="text-xs text-white/60">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center rounded-lg px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 transform hover:scale-[1.02]"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </>
  )
}
