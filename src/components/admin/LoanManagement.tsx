import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  BookOpen, 
  Users, 
  Search, 
  Filter, 
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Book,
  Eye,
  RotateCcw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminLoanService, Loan, LoanStats, Book as BookType, User as UserType } from '@/services/adminLoanService'
import { CreateLoanModal } from './CreateLoanModal'
import { LoanDetailsModal } from './LoanDetailsModal'
import { PermissionDiagnostics } from './PermissionDiagnostics'

export function LoanManagement() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [stats, setStats] = useState<LoanStats>({
    totalActiveLoans: 0,
    totalReturnedLoans: 0,
    overdueLoans: 0,
    loansToday: 0,
    popularBooks: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'returned' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'loan_date' | 'due_date' | 'created_at'>('loan_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLoans, setTotalLoans] = useState(0)
  
  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    loadLoans()
    loadStats()
  }, [currentPage, searchTerm, selectedStatus, sortBy, sortOrder])

  const loadLoans = async () => {
    try {
      setLoading(true)
      const { loans: loansData, total } = await AdminLoanService.getLoans({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        status: selectedStatus,
        sortBy,
        sortOrder
      })

      setLoans(loansData)
      setTotalLoans(total)
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE))
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error)
      toast.error('Erro ao carregar empréstimos')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await AdminLoanService.getLoanStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreateLoan = async (loanData: any) => {
    try {
      const { success, error, loan } = await AdminLoanService.createLoan(loanData)
      
      if (error) {
        toast.error(error)
        return false
      }

      if (success && loan) {
        toast.success('Empréstimo realizado com sucesso!')
        setShowCreateModal(false)
        loadLoans()
        loadStats()
        return true
      }
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error)
      toast.error('Erro ao criar empréstimo')
      return false
    }
    return false
  }

  const handleReturnLoan = async (loanId: string) => {
    try {
      const { success, error } = await AdminLoanService.returnLoan({
        loan_id: loanId
      })
      
      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success('Livro devolvido com sucesso!')
        loadLoans()
        loadStats()
      }
    } catch (error) {
      console.error('Erro ao devolver livro:', error)
      toast.error('Erro ao devolver livro')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'status':
        setSelectedStatus(value as 'all' | 'active' | 'returned' | 'overdue')
        break
      case 'sort':
        setSortBy(value as 'loan_date' | 'due_date' | 'created_at')
        break
    }
    setCurrentPage(1)
  }

  const handleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    setCurrentPage(1)
  }

  const openDetailsModal = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = status === 'active' && dueDate && new Date(dueDate) < new Date()
    
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Em Atraso
        </Badge>
      )
    }

    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Ativo
          </Badge>
        )
      case 'returned':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Devolvido
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Empréstimos</h1>
          <p className="text-gray-600">Realize empréstimos e devoluções para usuários da biblioteca</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDiagnostics(true)} 
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Diagnóstico
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Empréstimo
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Empréstimos Ativos</p>
                <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.totalActiveLoans}</p>
              </div>
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
              </div>
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Devolvidos</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.totalReturnedLoans}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Empréstimos Hoje</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.loansToday}</p>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Livros Populares</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.popularBooks.length}</p>
              </div>
              <Book className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por usuário, livro, autor..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="overdue">Em Atraso</option>
                <option value="returned">Devolvidos</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="loan_date">Data do Empréstimo</option>
                <option value="due_date">Data de Vencimento</option>
                <option value="created_at">Data de Criação</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSortOrder}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empréstimos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Empréstimos ({totalLoans})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando empréstimos...</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum empréstimo encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Livro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empréstimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className={`hover:bg-gray-50 ${isOverdue(loan.due_date) && loan.status === 'active' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {(loan.users as any)?.full_name || 'Usuário não encontrado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(loan.users as any)?.library_card_number || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Book className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {(loan.books as any)?.title || 'Livro não encontrado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(loan.books as any)?.author || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(loan.loan_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isOverdue(loan.due_date) && loan.status === 'active' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {formatDate(loan.due_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(loan.status, loan.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsModal(loan)}
                            className="p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {loan.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReturnLoan(loan.id)}
                              className="p-2"
                              title="Devolver livro"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalLoans)} de {totalLoans} empréstimos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="px-3 py-2 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modais */}
      {showCreateModal && (
        <CreateLoanModal
          onClose={() => setShowCreateModal(false)}
          onCreateLoan={handleCreateLoan}
        />
      )}

      {showDetailsModal && selectedLoan && (
        <LoanDetailsModal
          loan={selectedLoan}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedLoan(null)
          }}
          onReturnLoan={handleReturnLoan}
        />
      )}

      {showDiagnostics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PermissionDiagnostics />
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowDiagnostics(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
