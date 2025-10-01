import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, Calendar, Clock, CheckCircle, AlertCircle, History, TrendingUp, BarChart3 } from 'lucide-react'
import { LoanReport } from '@/components/reports/LoanReport'
import { LoanHistory } from '@/components/loans/LoanHistory'
import toast from 'react-hot-toast'

interface Loan {
  id: string
  book_id: string
  user_id: string
  loan_date: string
  due_date: string
  return_date: string | null
  books: {
    id: string
    title: string
    author: string
    cover_url: string | null
    isbn: string
  }
}

export function MyLoans() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [returningLoan, setReturningLoan] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'returned' | 'overdue'>('all')
  const [showHistory, setShowHistory] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchMyLoans()
  }, [])

  const fetchMyLoans = async () => {
    try {
      setLoading(true)
      
      if (!user) {
        toast.error('Você precisa estar logado para ver seus empréstimos')
        return
      }

      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          book_id,
          user_id,
          loan_date,
          due_date,
          return_date,
          books (
            id,
            title,
            author,
            cover_url,
            isbn
          )
        `)
        .eq('user_id', user.id)
        .order('loan_date', { ascending: false })

      if (error) throw error

      setLoans(data || [])
    } catch (error: any) {
      console.error('Erro ao buscar empréstimos:', error)
      toast.error(`Erro ao buscar empréstimos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnBook = async (loanId: string, bookId: string) => {
    try {
      console.log('🔄 Iniciando devolução do livro:', { loanId, bookId })
      setReturningLoan(loanId)
      
      const returnDate = new Date().toISOString()
      console.log('📅 Data de devolução:', returnDate)
      
      // Primeiro, vamos verificar o empréstimo atual
      const { data: currentLoan, error: fetchError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar empréstimo:', fetchError)
        throw fetchError
      }

      console.log('📋 Empréstimo atual:', currentLoan)

      // Atualizar o empréstimo
      const { data: updatedLoan, error: returnError } = await supabase
        .from('loans')
        .update({ 
          return_date: returnDate,
          status: 'returned',
          updated_at: returnDate
        })
        .eq('id', loanId)
        .select()

      if (returnError) {
        console.error('❌ Erro ao atualizar empréstimo:', returnError)
        throw returnError
      }

      console.log('✅ Empréstimo atualizado:', updatedLoan)

      // Atualizar disponibilidade do livro
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_copies, total_copies, title')
        .eq('id', bookId)
        .single()

      if (bookError) {
        console.error('❌ Erro ao buscar livro:', bookError)
        throw bookError
      }

      console.log('📚 Livro encontrado:', book)

      if (book) {
        const newAvailableCopies = Math.min(book.available_copies + 1, book.total_copies)
        console.log('📊 Atualizando cópias disponíveis:', { 
          atual: book.available_copies, 
          nova: newAvailableCopies,
          total: book.total_copies 
        })

        const { data: updatedBook, error: updateError } = await supabase
          .from('books')
          .update({ 
            available_copies: newAvailableCopies,
            updated_at: returnDate
          })
          .eq('id', bookId)
          .select()

        if (updateError) {
          console.error('❌ Erro ao atualizar livro:', updateError)
          throw updateError
        }

        console.log('✅ Livro atualizado:', updatedBook)
      }

      toast.success(`Livro "${book?.title || 'desconhecido'}" devolvido com sucesso!`)
      console.log('🎉 Devolução concluída com sucesso!')
      
      // Recarregar a lista de empréstimos
      await fetchMyLoans()
    } catch (error: any) {
      console.error('❌ Erro completo ao devolver livro:', error)
      toast.error(`Erro ao devolver livro: ${error.message}`)
    } finally {
      setReturningLoan(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !loans.find(loan => loan.due_date === dueDate)?.return_date
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Funções de filtro e estatísticas
  const activeLoans = loans.filter(loan => !loan.return_date)
  const returnedLoans = loans.filter(loan => loan.return_date)
  const overdueLoans = loans.filter(loan => {
    if (loan.return_date) return false // Já devolvido
    return new Date(loan.due_date) < new Date()
  })

  const getFilteredLoans = () => {
    switch (filter) {
      case 'active':
        return activeLoans
      case 'returned':
        return returnedLoans
      case 'overdue':
        return overdueLoans
      default:
        return loans
    }
  }

  const getLoanStats = () => {
    return {
      total: loans.length,
      active: activeLoans.length,
      returned: returnedLoans.length,
      overdue: overdueLoans.length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-secondary-600">Carregando seus empréstimos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Meus Empréstimos</h1>
          <p className="text-white/80 mt-1 md:mt-2 text-sm md:text-base">
            <span className="hidden sm:inline">Gerencie seus livros emprestados</span>
            <span className="sm:hidden">Seus livros</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowReport(!showReport)}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {showReport ? 'Ocultar Relatório' : 'Ver Relatório'}
            </span>
            <span className="sm:hidden">Relatório</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Ver Histórico</span>
            <span className="sm:hidden">Histórico</span>
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
            <span className="text-xs md:text-sm font-medium text-white/80">Total</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">{getLoanStats().total}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
            <span className="text-xs md:text-sm font-medium text-white/80">Ativos</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-blue-300">{getLoanStats().active}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
            <span className="text-xs md:text-sm font-medium text-white/80">Devolvidos</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-green-300">{getLoanStats().returned}</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm p-3 md:p-4 rounded-lg border border-white/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
            <span className="text-xs md:text-sm font-medium text-white/80">Atrasados</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-red-300">{getLoanStats().overdue}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="text-xs sm:text-sm whitespace-nowrap"
        >
          <span className="hidden sm:inline">Todos</span>
          <span className="sm:hidden">T</span>
          ({getLoanStats().total})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
          className="text-xs sm:text-sm whitespace-nowrap"
        >
          <span className="hidden sm:inline">Ativos</span>
          <span className="sm:hidden">A</span>
          ({getLoanStats().active})
        </Button>
        <Button
          variant={filter === 'returned' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('returned')}
          className="text-xs sm:text-sm whitespace-nowrap"
        >
          <span className="hidden sm:inline">Devolvidos</span>
          <span className="sm:hidden">D</span>
          ({getLoanStats().returned})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
          className={`text-xs sm:text-sm whitespace-nowrap ${filter === 'overdue' ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          <span className="hidden sm:inline">Atrasados</span>
          <span className="sm:hidden">AT</span>
          ({getLoanStats().overdue})
        </Button>
      </div>

      {/* Relatório */}
      {showReport && (
        <div className="bg-white rounded-lg border border-secondary-200 p-6">
          <LoanReport />
        </div>
      )}

      {/* Lista de Empréstimos */}
      <div className="space-y-4">
        {getFilteredLoans().length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-white/60 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {filter === 'all' ? 'Nenhum empréstimo encontrado' : 
               filter === 'active' ? 'Nenhum empréstimo ativo' :
               filter === 'returned' ? 'Nenhum empréstimo devolvido' :
               'Nenhum empréstimo atrasado'}
            </h3>
            <p className="text-white/80">
              {filter === 'all' ? 'Você ainda não fez nenhum empréstimo.' :
               filter === 'active' ? 'Todos os seus empréstimos foram devolvidos.' :
               filter === 'returned' ? 'Você ainda não devolveu nenhum livro.' :
               'Parabéns! Você não tem empréstimos atrasados.'}
            </p>
          </div>
        ) : (
          getFilteredLoans().map((loan) => {
            const isActive = !loan.return_date
            const isOverdueLoan = isActive && isOverdue(loan.due_date)
            const daysUntilDue = isActive ? getDaysUntilDue(loan.due_date) : 0

            return (
              <Card key={loan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
                    {/* Capa do livro */}
                    <div className="flex-shrink-0 self-center sm:self-start">
                      {loan.books.cover_url ? (
                        <img
                          src={loan.books.cover_url}
                          alt={loan.books.title}
                          className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded-lg border border-secondary-200"
                        />
                      ) : (
                        <div className="w-12 h-16 sm:w-16 sm:h-20 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center justify-center">
                          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white/60" />
                        </div>
                      )}
                    </div>

                    {/* Informações do livro */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-semibold text-white truncate">
                        {loan.books.title}
                      </h3>
                      <p className="text-sm md:text-base text-white/80 mb-2">por {loan.books.author}</p>
                      
                      <div className="space-y-1 text-xs md:text-xs text-white/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Emprestado em: {formatDate(loan.loan_date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Vencimento: {formatDate(loan.due_date)}
                        </div>
                        {loan.return_date && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Devolvido em: {formatDate(loan.return_date)}
                          </div>
                        )}
                      </div>
                      
                      {/* Status e ações */}
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <>
                              {isOverdueLoan ? (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Atrasado
                                </Badge>
                              ) : daysUntilDue <= 3 ? (
                                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Ativo
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Devolvido
                            </Badge>
                          )}
                        </div>

                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleReturnBook(loan.id, loan.book_id)}
                            disabled={returningLoan === loan.id}
                            className="w-full sm:w-auto sm:ml-4 text-xs sm:text-sm"
                          >
                            {returningLoan === loan.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline">Devolvendo...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              'Devolver'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Modal de Histórico */}
      <LoanHistory 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
      />
    </div>
  )
}