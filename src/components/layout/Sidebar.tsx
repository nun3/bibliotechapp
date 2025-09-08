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
  Shield
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'

export function Sidebar() {
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
    <div className="flex h-full w-64 flex-col bg-white border-r border-secondary-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-secondary-200">
        <div className="flex items-center space-x-2">
          <Library className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-secondary-900">Bibliotech</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-500' : 'text-secondary-400 group-hover:text-secondary-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User info and logout */}
      <div className="border-t border-secondary-200 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-secondary-900">{user?.user_metadata?.full_name || 'Usuário'}</p>
          <p className="text-xs text-secondary-500">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  )
}
