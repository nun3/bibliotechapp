import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BookOpen, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

interface LoanStats {
  total_loans: number
  active_loans: number
  returned_loans: number
  overdue_loans: number
  avg_loan_duration: number
  most_borrowed_genre: string
  monthly_stats: {
    month: string
    loans: number
    returns: number
  }[]
}

export function LoanReport() {
  const [stats, setStats] = useState<LoanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchLoanStats()
    }
  }, [user])

  const fetchLoanStats = async () => {
    try {
      if (!user) return

      // Buscar todos os empréstimos do usuário
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          id,
          loan_date,
          due_date,
          return_date,
          books!inner (
            genre
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      // Calcular estatísticas
      const totalLoans = loans?.length || 0
      const activeLoans = loans?.filter(loan => !loan.return_date).length || 0
      const returnedLoans = loans?.filter(loan => loan.return_date).length || 0
      const overdueLoans = loans?.filter(loan => {
        if (loan.return_date) return false
        return new Date(loan.due_date) < new Date()
      }).length || 0

      // Calcular duração média dos empréstimos
      const returnedLoansWithDuration = loans?.filter(loan => loan.return_date) || []
      const avgDuration = returnedLoansWithDuration.length > 0 
        ? returnedLoansWithDuration.reduce((acc, loan) => {
            const duration = new Date(loan.return_date!).getTime() - new Date(loan.loan_date).getTime()
            return acc + (duration / (1000 * 60 * 60 * 24))
          }, 0) / returnedLoansWithDuration.length
        : 0

      // Gênero mais emprestado
      const genreCount: { [key: string]: number } = {}
      loans?.forEach(loan => {
        const genre = loan.books.genre
        genreCount[genre] = (genreCount[genre] || 0) + 1
      })
      const mostBorrowedGenre = Object.keys(genreCount).reduce((a, b) => 
        genreCount[a] > genreCount[b] ? a : b, 'N/A'
      )

      // Estatísticas mensais (últimos 6 meses)
      const monthlyStats = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        
        const monthLoans = loans?.filter(loan => {
          const loanDate = new Date(loan.loan_date)
          return loanDate.getMonth() === date.getMonth() && 
                 loanDate.getFullYear() === date.getFullYear()
        }).length || 0

        const monthReturns = loans?.filter(loan => {
          if (!loan.return_date) return false
          const returnDate = new Date(loan.return_date)
          return returnDate.getMonth() === date.getMonth() && 
                 returnDate.getFullYear() === date.getFullYear()
        }).length || 0

        monthlyStats.push({
          month,
          loans: monthLoans,
          returns: monthReturns
        })
      }

      setStats({
        total_loans: totalLoans,
        active_loans: activeLoans,
        returned_loans: returnedLoans,
        overdue_loans: overdueLoans,
        avg_loan_duration: Math.round(avgDuration),
        most_borrowed_genre: mostBorrowedGenre,
        monthly_stats: monthlyStats
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">Relatório de Empréstimos</h2>
        <p className="text-secondary-600">Estatísticas detalhadas dos seus empréstimos</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-500" />
              <span className="text-sm font-medium text-secondary-600">Total</span>
            </div>
            <p className="text-2xl font-bold text-secondary-900">{stats.total_loans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-secondary-600">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.active_loans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-secondary-600">Devolvidos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.returned_loans}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-secondary-600">Atrasados</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.overdue_loans}</p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas adicionais */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Duração média dos empréstimos:</span>
              <span className="font-semibold">{stats.avg_loan_duration} dias</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Gênero mais emprestado:</span>
              <span className="font-semibold">{stats.most_borrowed_genre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-600">Taxa de devolução:</span>
              <span className="font-semibold">
                {stats.total_loans > 0 ? Math.round((stats.returned_loans / stats.total_loans) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atividade Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthly_stats.map((month, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">{month.month}</span>
                  <div className="flex gap-4">
                    <span className="text-sm">
                      <span className="text-blue-600 font-medium">{month.loans}</span> empréstimos
                    </span>
                    <span className="text-sm">
                      <span className="text-green-600 font-medium">{month.returns}</span> devoluções
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

