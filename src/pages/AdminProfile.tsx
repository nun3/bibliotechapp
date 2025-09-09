import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { BookRegistrationForm } from '@/components/admin/BookRegistrationForm'
import { SettingsService, LibrarySettings, ScheduleSettings, NotificationSettings, SecuritySettings } from '@/services/settingsService'
import { 
  Shield, 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings,
  Plus,
  Clock,
  Bell,
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
  
  // Estados para configurações
  const [librarySettings, setLibrarySettings] = useState<LibrarySettings>({
    library_name: 'Biblioteca Digital',
    loan_period_days: 14,
    max_books_per_user: 5,
    fine_per_day: 1.00
  })
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    opening_time: '08:00',
    closing_time: '18:00',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  })
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    notify_upcoming_due: true,
    notify_overdue: true,
    notify_new_books: true,
    notify_available_reservations: true
  })
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    require_email_confirmation: true,
    allow_self_registration: true,
    enable_activity_log: true
  })
  const [savingSettings, setSavingSettings] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings()
    }
  }, [activeTab])

  const loadSettings = async () => {
    try {
      const [library, schedule, notifications, security] = await Promise.all([
        SettingsService.getLibrarySettings(),
        SettingsService.getScheduleSettings(),
        SettingsService.getNotificationSettings(),
        SettingsService.getSecuritySettings()
      ])

      if (library) setLibrarySettings(library)
      if (schedule) setScheduleSettings(schedule)
      if (notifications) setNotificationSettings(notifications)
      if (security) setSecuritySettings(security)
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações')
    }
  }

  const saveLibrarySettings = async () => {
    try {
      setSavingSettings('library')
      await SettingsService.saveLibrarySettings(librarySettings)
      toast.success('Configurações da biblioteca salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações da biblioteca:', error)
      toast.error('Erro ao salvar configurações da biblioteca')
    } finally {
      setSavingSettings(null)
    }
  }

  const saveScheduleSettings = async () => {
    try {
      setSavingSettings('schedule')
      await SettingsService.saveScheduleSettings(scheduleSettings)
      toast.success('Configurações de horário salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações de horário:', error)
      toast.error('Erro ao salvar configurações de horário')
    } finally {
      setSavingSettings(null)
    }
  }

  const saveNotificationSettings = async () => {
    try {
      setSavingSettings('notifications')
      await SettingsService.saveNotificationSettings(notificationSettings)
      toast.success('Configurações de notificação salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error)
      toast.error('Erro ao salvar configurações de notificação')
    } finally {
      setSavingSettings(null)
    }
  }

  const saveSecuritySettings = async () => {
    try {
      setSavingSettings('security')
      await SettingsService.saveSecuritySettings(securitySettings)
      toast.success('Configurações de segurança salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error)
      toast.error('Erro ao salvar configurações de segurança')
    } finally {
      setSavingSettings(null)
    }
  }

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
        <div className="space-y-6">
          {/* Configurações da Biblioteca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações da Biblioteca
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nome da Biblioteca
                  </label>
                  <Input 
                    placeholder="Biblioteca Digital" 
                    value={librarySettings.library_name}
                    onChange={(e) => setLibrarySettings(prev => ({ ...prev, library_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Período de Empréstimo (dias)
                  </label>
                  <Input 
                    type="number" 
                    placeholder="14" 
                    value={librarySettings.loan_period_days}
                    onChange={(e) => setLibrarySettings(prev => ({ ...prev, loan_period_days: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Limite de Livros por Usuário
                  </label>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    value={librarySettings.max_books_per_user}
                    onChange={(e) => setLibrarySettings(prev => ({ ...prev, max_books_per_user: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Multa por Dia de Atraso (R$)
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="1.00" 
                    value={librarySettings.fine_per_day}
                    onChange={(e) => setLibrarySettings(prev => ({ ...prev, fine_per_day: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={saveLibrarySettings}
                  disabled={savingSettings === 'library'}
                >
                  {savingSettings === 'library' ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Horário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Horário de Abertura
                  </label>
                  <Input 
                    type="time" 
                    value={scheduleSettings.opening_time}
                    onChange={(e) => setScheduleSettings(prev => ({ ...prev, opening_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Horário de Fechamento
                  </label>
                  <Input 
                    type="time" 
                    value={scheduleSettings.closing_time}
                    onChange={(e) => setScheduleSettings(prev => ({ ...prev, closing_time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-secondary-700">
                  Dias de Funcionamento
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { pt: 'Segunda', en: 'monday' },
                    { pt: 'Terça', en: 'tuesday' },
                    { pt: 'Quarta', en: 'wednesday' },
                    { pt: 'Quinta', en: 'thursday' },
                    { pt: 'Sexta', en: 'friday' },
                    { pt: 'Sábado', en: 'saturday' },
                    { pt: 'Domingo', en: 'sunday' }
                  ].map((day) => (
                    <label key={day.en} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={scheduleSettings.working_days.includes(day.en)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScheduleSettings(prev => ({
                              ...prev,
                              working_days: [...prev.working_days, day.en]
                            }))
                          } else {
                            setScheduleSettings(prev => ({
                              ...prev,
                              working_days: prev.working_days.filter(d => d !== day.en)
                            }))
                          }
                        }}
                        className="rounded border-secondary-300"
                      />
                      <span className="text-sm">{day.pt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={saveScheduleSettings}
                  disabled={savingSettings === 'schedule'}
                >
                  {savingSettings === 'schedule' ? 'Salvando...' : 'Salvar Horários'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Notificar empréstimos próximos do vencimento
                  </span>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.notify_upcoming_due}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notify_upcoming_due: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Notificar livros em atraso
                  </span>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.notify_overdue}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notify_overdue: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Notificar novos livros cadastrados
                  </span>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.notify_new_books}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notify_new_books: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Notificar reservas disponíveis
                  </span>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.notify_available_reservations}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, notify_available_reservations: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={saveNotificationSettings}
                  disabled={savingSettings === 'notifications'}
                >
                  {savingSettings === 'notifications' ? 'Salvando...' : 'Salvar Notificações'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Exigir confirmação de email para novos usuários
                  </span>
                  <input 
                    type="checkbox" 
                    checked={securitySettings.require_email_confirmation}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, require_email_confirmation: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Permitir auto-registro de usuários
                  </span>
                  <input 
                    type="checkbox" 
                    checked={securitySettings.allow_self_registration}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, allow_self_registration: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">
                    Log de atividades do sistema
                  </span>
                  <input 
                    type="checkbox" 
                    checked={securitySettings.enable_activity_log}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, enable_activity_log: e.target.checked }))}
                    className="rounded border-secondary-300"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={saveSecuritySettings}
                  disabled={savingSettings === 'security'}
                >
                  {savingSettings === 'security' ? 'Salvando...' : 'Salvar Segurança'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
