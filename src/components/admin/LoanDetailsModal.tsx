import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  X, 
  User, 
  Book, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Mail,
  Phone
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Loan } from '@/services/adminLoanService'

interface LoanDetailsModalProps {
  loan: Loan
  onClose: () => void
  onReturnLoan: (loanId: string) => Promise<void>
}

export function LoanDetailsModal({ loan, onClose, onReturnLoan }: LoanDetailsModalProps) {
  const [returning, setReturning] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
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

  const calculateDaysOverdue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const handleReturnLoan = async () => {
    if (!confirm('Confirmar devolução do livro?')) {
      return
    }

    setReturning(true)
    try {
      await onReturnLoan(loan.id)
      onClose()
    } catch (error) {
      console.error('Erro ao devolver livro:', error)
    } finally {
      setReturning(false)
    }
  }

  const user = loan.users as any
  const book = loan.books as any

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Detalhes do Empréstimo
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status e Informações Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(loan.status, loan.due_date)}
                    </div>
                  </div>
                  {loan.status === 'active' && isOverdue(loan.due_date) && (
                    <div className="text-right">
                      <p className="text-sm text-red-600 font-medium">
                        {calculateDaysOverdue(loan.due_date)} dias em atraso
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data do Empréstimo</p>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(loan.loan_date)}</p>
                  </div>
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data de Vencimento</p>
                    <p className={`text-sm font-medium ${isOverdue(loan.due_date) && loan.status === 'active' ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(loan.due_date)}
                    </p>
                  </div>
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações do Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo</label>
                  <p className="text-sm text-gray-900 font-medium">{user?.full_name || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Número da Carteirinha</label>
                  <p className="text-sm text-gray-900 font-mono">{user?.library_card_number || 'Não informado'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{user?.email || 'Não informado'}</p>
                  </div>
                </div>

                {user?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Livro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Book className="h-4 w-4" />
                Informações do Livro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
                  <p className="text-sm text-gray-900 font-medium">{book?.title || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Autor</label>
                  <p className="text-sm text-gray-900">{book?.author || 'Não informado'}</p>
                </div>

                {book?.isbn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">ISBN</label>
                    <p className="text-sm text-gray-900 font-mono">{book.isbn}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Cópias Disponíveis</label>
                  <p className="text-sm text-gray-900">
                    {book?.available_copies || 0} de {book?.total_copies || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Devolução */}
          {loan.status === 'returned' && loan.return_date && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Informações de Devolução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Data de Devolução</label>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(loan.return_date)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Horário de Devolução</label>
                    <p className="text-sm text-gray-900">{formatDateTime(loan.return_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aviso de Atraso */}
          {loan.status === 'active' && isOverdue(loan.due_date) && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Empréstimo em atraso há {calculateDaysOverdue(loan.due_date)} dias
                    </p>
                    <p className="text-sm text-red-700">
                      Data de vencimento: {formatDate(loan.due_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">ID do Empréstimo</label>
                  <p className="text-sm text-gray-900 font-mono">{loan.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Criado em</label>
                  <p className="text-sm text-gray-900">{formatDateTime(loan.created_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Última atualização</label>
                  <p className="text-sm text-gray-900">{formatDateTime(loan.updated_at)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Período do Empréstimo</label>
                  <p className="text-sm text-gray-900">
                    {Math.ceil((new Date(loan.due_date).getTime() - new Date(loan.loan_date).getTime()) / (1000 * 60 * 60 * 24))} dias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            
            {loan.status === 'active' && (
              <Button
                onClick={handleReturnLoan}
                disabled={returning}
                className="flex-1 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {returning ? 'Devolvendo...' : 'Devolver Livro'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
