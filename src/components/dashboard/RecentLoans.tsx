import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { supabase, Loan } from '@/lib/supabase'
import { formatDate, isOverdue } from '@/lib/utils'
import { Calendar, Clock, CheckCircle } from 'lucide-react'

export function RecentLoans() {
  const navigate = useNavigate()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentLoans()
  }, [])

  const fetchRecentLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          book:books(title, author),
          user:users(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setLoans(data || [])
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (loan: Loan) => {
    if (loan.status === 'returned') {
      return <Badge variant="success">Devolvido</Badge>
    }
    if (isOverdue(loan.due_date)) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    return <Badge variant="default">Ativo</Badge>
  }

  const getStatusIcon = (loan: Loan) => {
    if (loan.status === 'returned') {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    if (isOverdue(loan.due_date)) {
      return <Clock className="h-4 w-4 text-red-600" />
    }
    return <Calendar className="h-4 w-4 text-primary-600" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empréstimos Recentes</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Empréstimos Recentes</CardTitle>
        <CardDescription>Seus últimos empréstimos e devoluções</CardDescription>
      </CardHeader>
      <CardContent>
        {loans.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
            <p className="text-secondary-500">Nenhum empréstimo encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(loan)}
                  <div>
                    <p className="font-medium text-secondary-900">
                      {loan.book?.title}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {loan.book?.author}
                    </p>
                    <p className="text-xs text-secondary-400">
                      Vencimento: {formatDate(loan.due_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(loan)}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/loans')}
          >
            Ver Todos os Empréstimos
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/loans')}
            className="px-3"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
