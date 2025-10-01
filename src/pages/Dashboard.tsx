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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-white/70 text-lg">
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
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
                  <div>
                    <p className="font-medium text-white">{book.title}</p>
                    <p className="text-sm text-white/60">{book.author}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-300">{book.loans} empréstimos</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={handleSearchBooks}
              className="p-6 border border-white/20 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <BookOpen className="relative h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-purple-200 transition-colors mb-2">Catálogo</h3>
              <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Explore e busque livros</p>
            </div>
            <div 
              onClick={handleMyLoans}
              className="p-6 border border-white/20 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <Calendar className="relative h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors mb-2">Meus Empréstimos</h3>
              <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Veja seus empréstimos ativos</p>
            </div>
            <div 
              onClick={handleProfile}
              className="p-6 border border-white/20 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group transform hover:scale-[1.02] hover:shadow-xl"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <User className="relative h-10 w-10 text-white" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-pink-200 transition-colors mb-2">Perfil</h3>
              <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Gerencie sua conta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
