import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Shield, 
  BookOpen, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { User as UserType } from '@/services/userManagementService'
import { supabase } from '@/lib/supabase'

interface UserDetailsModalProps {
  user: UserType
  onClose: () => void
}

interface UserLoans {
  id: string
  book_title: string
  loan_date: string
  due_date: string
  return_date?: string
  status: string
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [loans, setLoans] = useState<UserLoans[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserLoans()
  }, [user.id])

  const loadUserLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          loan_date,
          due_date,
          return_date,
          status,
          books(title)
        `)
        .eq('user_id', user.id)
        .order('loan_date', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Erro ao carregar empréstimos:', error)
        return
      }

      const formattedLoans = data?.map(loan => ({
        id: loan.id,
        book_title: (loan.books as any)?.title || 'Título não disponível',
        loan_date: loan.loan_date,
        due_date: loan.due_date,
        return_date: loan.return_date,
        status: loan.status
      })) || []

      setLoans(formattedLoans)
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1"><Clock className="h-3 w-3" />Ativo</Badge>
      case 'returned':
        return <Badge variant="secondary" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Devolvido</Badge>
      case 'overdue':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Em Atraso</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Administrador
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <User className="h-3 w-3" />
        Usuário
      </Badge>
    )
  }

  const getStatusBadgeUser = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Ativo
      </Badge>
    ) : (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Bloqueado
      </Badge>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Detalhes do Usuário
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
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo</label>
                  <p className="text-sm text-gray-900 font-medium">{user.full_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </div>
                </div>

                {user.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900">{user.phone}</p>
                    </div>
                  </div>
                )}

                {user.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-900">{user.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Número da Carteirinha</label>
                  <p className="text-sm text-gray-900 font-mono font-medium">{user.library_card_number}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Usuário</label>
                  {getRoleBadge(user.role)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status da Conta</label>
                  {getStatusBadgeUser(user.is_active)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Membro desde</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Última atualização</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{formatDate(user.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Empréstimos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Histórico de Empréstimos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando empréstimos...</p>
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum empréstimo encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Livro
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data do Empréstimo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Vencimento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Devolução
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{loan.book_title}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(loan.loan_date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(loan.due_date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {loan.return_date ? formatDate(loan.return_date) : '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getStatusBadge(loan.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{loans.length}</p>
                  <p className="text-sm text-gray-600">Empréstimos Recentes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {loans.filter(loan => loan.status === 'returned').length}
                  </p>
                  <p className="text-sm text-gray-600">Devolvidos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {loans.filter(loan => loan.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {loans.filter(loan => loan.status === 'overdue').length}
                  </p>
                  <p className="text-sm text-gray-600">Em Atraso</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
