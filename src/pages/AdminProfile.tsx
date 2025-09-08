import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BookRegistrationForm } from '@/components/admin/BookRegistrationForm'
import { 
  Shield, 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings,
  Plus,
  BarChart3,
  UserCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminStats {
  totalBooks: number
  totalUsers: number
  activeLoans: number
  totalLoans: number
  availableBooks: number
  overdueLoans: number
}

export function AdminProfile() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalBooks: 0,
    totalUsers: 0,
    activeLoans: 0,
    totalLoans: 0,
    availableBooks: 0,
    overdueLoans: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'books' | 'users' | 'settings'>('overview')

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)

      const [
        booksResult,
        usersResult,
        activeLoansResult,
        totalLoansResult,
        overdueLoansResult
      ] = await Promise.all([
        supabase.from('books').select('total_copies, available_copies'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('loans').select('id', { count: 'exact' }).is('return_date', null),
        supabase.from('loans').select('id', { count: 'exact' }),
        supabase.from('loans').select('id', { count: 'exact' }).is('return_date', null).lt('due_date', new Date().toISOString())
      ])

      const totalBooks = booksResult.data?.reduce((sum, book) => sum + book.total_copies, 0) || 0
      const availableBooks = booksResult.data?.reduce((sum, book) => sum + book.available_copies, 0) || 0
      const totalUsers = usersResult.count || 0
      const activeLoans = activeLoansResult.count || 0
      const totalLoans = totalLoansResult.count || 0
      const overdueLoans = overdueLoansResult.count || 0

      setStats({
        totalBooks,
        totalUsers,
        activeLoans,
        totalLoans,
        availableBooks,
        overdueLoans
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'books', label: 'Gerenciar Livros', icon: BookOpen },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-secondary-600">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary-600" />
            Painel Administrativo
          </h1>
          <p className="text-secondary-600 mt-2">
            Gerencie a biblioteca digital
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary-100 text-primary-800 px-3 py-1">
          <UserCheck className="h-4 w-4 mr-1" />
          Administrador
        </Badge>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Total de Livros</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalBooks}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Usuários Cadastrados</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Empréstimos Ativos</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats.activeLoans}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Livros Disponíveis</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats.availableBooks}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Total de Empréstimos</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalLoans}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">Empréstimos Atrasados</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('books')}
                >
                  <Plus className="h-6 w-6 text-primary-600" />
                  <span className="font-medium">Cadastrar Livro</span>
                  <span className="text-xs text-secondary-500">Adicionar novo livro ao acervo</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('users')}
                >
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="font-medium">Gerenciar Usuários</span>
                  <span className="text-xs text-secondary-500">Ver e gerenciar usuários</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="h-6 w-6 text-gray-600" />
                  <span className="font-medium">Configurações</span>
                  <span className="text-xs text-secondary-500">Configurar sistema</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'books' && (
        <div className="space-y-6">
          <BookRegistrationForm />
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-secondary-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-secondary-300" />
              <p>Funcionalidade em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-secondary-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-secondary-300" />
              <p>Funcionalidade em desenvolvimento</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
