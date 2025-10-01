import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, Calendar, Clock, CheckCircle, AlertCircle, X, Filter, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoanHistoryItem {
  id: string
  book_id: string
  user_id: string
  loan_date: string
  due_date: string
  return_date: string | null
  status: string
  books: {
    id: string
    title: string
    author: string
    cover_url: string | null
    isbn: string
    genre: string
  }
}

interface LoanHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function LoanHistory({ isOpen, onClose }: LoanHistoryProps) {
  const [loans, setLoans] = useState<LoanHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'returned' | 'overdue' | 'active'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'loan_date' | 'return_date' | 'due_date'>('loan_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchLoanHistory()
    }
  }, [isOpen, user, filter, sortBy, sortOrder])

  const fetchLoanHistory = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        toast.error('Você precisa estar logado para ver o histórico')
        return
      }

      let query = supabase
        .from('loans')
        .select(`
          id,
          book_id,
          user_id,
          loan_date,
          due_date,
          return_date,
          status,
          books (
            id,
            title,
            author,
            cover_url,
            isbn,
            genre
          )
        `)
        .eq('user_id', user.id)

      // Aplicar filtros
      if (filter === 'returned') {
        query = query.not('return_date', 'is', null)
      } else if (filter === 'active') {
        query = query.is('return_date', null)
      } else if (filter === 'overdue') {
        query = query.is('return_date', null).lt('due_date', new Date().toISOString())
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      let filteredLoans = data || []

      // Aplicar busca por texto
      if (searchTerm) {
        filteredLoans = filteredLoans.filter(loan =>
          loan.books.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.books.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.books.genre.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setLoans(filteredLoans)
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error)
      toast.error(`Erro ao buscar histórico: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (loan: LoanHistoryItem) => {
    if (loan.return_date) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Devolvido</Badge>
    }
    if (new Date(loan.due_date) < new Date()) {
      return <Badge variant="destructive">Atrasado</Badge>
    }
    return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Ativo</Badge>
  }

  const getStatusIcon = (loan: LoanHistoryItem) => {
    if (loan.return_date) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    if (new Date(loan.due_date) < new Date()) {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    return <Clock className="h-4 w-4 text-blue-600" />
  }

  const getLoanDuration = (loan: LoanHistoryItem) => {
    const startDate = new Date(loan.loan_date)
    const endDate = loan.return_date ? new Date(loan.return_date) : new Date()
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const clearFilters = () => {
    setFilter('all')
    setSearchTerm('')
    setSortBy('loan_date')
    setSortOrder('desc')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold text-white">Histórico de Empréstimos</h2>
            <p className="text-white/70">Todos os seus empréstimos e devoluções</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros e Busca */}
        <div className="p-6 border-b border-secondary-200 bg-secondary-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor ou gênero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="returned">Devolvidos</option>
                <option value="overdue">Atrasados</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="loan_date-desc">Data de Empréstimo (Mais Recente)</option>
                <option value="loan_date-asc">Data de Empréstimo (Mais Antigo)</option>
                <option value="return_date-desc">Data de Devolução (Mais Recente)</option>
                <option value="return_date-asc">Data de Devolução (Mais Antigo)</option>
                <option value="due_date-desc">Data de Vencimento (Mais Recente)</option>
                <option value="due_date-asc">Data de Vencimento (Mais Antigo)</option>
              </select>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-3 text-secondary-600">Carregando histórico...</span>
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Nenhum empréstimo encontrado
              </h3>
              <p className="text-secondary-600">
                {searchTerm || filter !== 'all' 
                  ? 'Tente ajustar os filtros ou termo de busca.'
                  : 'Você ainda não fez nenhum empréstimo.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <Card key={loan.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Capa do livro */}
                      <div className="flex-shrink-0">
                        {loan.books.cover_url ? (
                          <img
                            src={loan.books.cover_url}
                            alt={loan.books.title}
                            className="w-12 h-16 object-cover rounded border border-secondary-200"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-secondary-100 rounded border border-secondary-200 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-secondary-400" />
                          </div>
                        )}
                      </div>

                      {/* Informações do empréstimo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-secondary-900 truncate">
                              {loan.books.title}
                            </h3>
                            <p className="text-secondary-600 text-sm">{loan.books.author}</p>
                            <p className="text-secondary-500 text-xs">{loan.books.genre}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(loan)}
                            {getStatusBadge(loan)}
                          </div>
                        </div>

                        {/* Detalhes do empréstimo */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-secondary-500">
                          <div>
                            <span className="font-medium">Emprestado:</span>
                            <br />
                            {formatDate(loan.loan_date)}
                          </div>
                          <div>
                            <span className="font-medium">Vencimento:</span>
                            <br />
                            {formatDate(loan.due_date)}
                          </div>
                          {loan.return_date && (
                            <div>
                              <span className="font-medium">Devolvido:</span>
                              <br />
                              {formatDate(loan.return_date)}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Duração:</span>
                            <br />
                            {getLoanDuration(loan)} dia{getLoanDuration(loan) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer com estatísticas */}
        <div className="p-6 border-t border-secondary-200 bg-secondary-50">
          <div className="flex justify-between items-center text-sm text-secondary-600">
            <span>
              {loans.length} empréstimo{loans.length !== 1 ? 's' : ''} encontrado{loans.length !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-4">
              <span>Ativos: {loans.filter(l => !l.return_date).length}</span>
              <span>Devolvidos: {loans.filter(l => l.return_date).length}</span>
              <span>Atrasados: {loans.filter(l => !l.return_date && new Date(l.due_date) < new Date()).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
