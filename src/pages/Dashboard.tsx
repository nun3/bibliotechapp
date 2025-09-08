import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentLoans } from '@/components/dashboard/RecentLoans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { BookOpen, Users, Calendar, TrendingUp, Search, User } from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    activeLoans: 0,
    availableBooks: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Buscar estatísticas
      const [booksResult, usersResult, loansResult] = await Promise.all([
        supabase.from('books').select('total_copies, available_copies'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('loans').select('id', { count: 'exact' }).eq('status', 'active'),
      ])

      const totalBooks = booksResult.data?.reduce((sum, book) => sum + book.total_copies, 0) || 0
      const availableBooks = booksResult.data?.reduce((sum, book) => sum + book.available_copies, 0) || 0
      const totalUsers = usersResult.count || 0
      const activeLoans = loansResult.count || 0

      setStats({
        totalBooks,
        totalUsers,
        activeLoans,
        availableBooks,
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Funções de navegação para as ações rápidas
  const handleSearchBooks = () => {
    navigate('/catalog')
  }

  const handleMyLoans = () => {
    navigate('/loans')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-2">
          Visão geral da sua biblioteca digital
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Livros"
          value={stats.totalBooks}
          description="Livros no acervo"
          icon={BookOpen}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Usuários Ativos"
          value={stats.totalUsers}
          description="Membros cadastrados"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Empréstimos Ativos"
          value={stats.activeLoans}
          description="Livros emprestados"
          icon={Calendar}
          trend={{ value: -3, isPositive: false }}
        />
        <StatsCard
          title="Livros Disponíveis"
          value={stats.availableBooks}
          description="Prontos para empréstimo"
          icon={TrendingUp}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentLoans />
        
        <Card>
          <CardHeader>
            <CardTitle>Livros Populares</CardTitle>
            <CardDescription>Os livros mais emprestados este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien', loans: 15 },
                { title: '1984', author: 'George Orwell', loans: 12 },
                { title: 'Harry Potter', author: 'J.K. Rowling', loans: 10 },
                { title: 'Dom Casmurro', author: 'Machado de Assis', loans: 8 },
              ].map((book, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-900">{book.title}</p>
                    <p className="text-sm text-secondary-500">{book.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-600">{book.loans} empréstimos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={handleSearchBooks}
              className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors group"
            >
              <BookOpen className="h-8 w-8 text-primary-600 mb-2 group-hover:text-primary-700 transition-colors" />
              <h3 className="font-medium text-secondary-900 group-hover:text-secondary-800">Catálogo</h3>
              <p className="text-sm text-secondary-500">Explore e busque livros</p>
            </div>
            <div 
              onClick={handleMyLoans}
              className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors group"
            >
              <Calendar className="h-8 w-8 text-primary-600 mb-2 group-hover:text-primary-700 transition-colors" />
              <h3 className="font-medium text-secondary-900 group-hover:text-secondary-800">Meus Empréstimos</h3>
              <p className="text-sm text-secondary-500">Veja seus empréstimos ativos</p>
            </div>
            <div 
              onClick={handleProfile}
              className="p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors group"
            >
              <User className="h-8 w-8 text-primary-600 mb-2 group-hover:text-primary-700 transition-colors" />
              <h3 className="font-medium text-secondary-900 group-hover:text-secondary-800">Perfil</h3>
              <p className="text-sm text-secondary-500">Gerencie sua conta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
