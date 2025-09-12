import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Shield, 
  ShieldOff, 
  UserX, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { UserManagementService, User, UserStats } from '@/services/userManagementService'
import { CreateUserModal } from './CreateUserModal'
import { EditUserModal } from './EditUserModal'
import { UserDetailsModal } from './UserDetailsModal'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    adminUsers: 0,
    newUsersThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'blocked'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'full_name' | 'email'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [currentPage, searchTerm, selectedRole, selectedStatus, sortBy, sortOrder])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { users: usersData, total } = await UserManagementService.getUsers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        role: selectedRole,
        status: selectedStatus,
        sortBy,
        sortOrder
      })

      setUsers(usersData)
      setTotalUsers(total)
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE))
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await UserManagementService.getUserStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreateUser = async (userData: any) => {
    try {
      const { user, error } = await UserManagementService.createUser(userData)
      
      if (error) {
        toast.error(error)
        return false
      }

      if (user) {
        toast.success('Usuário criado com sucesso!')
        setShowCreateModal(false)
        loadUsers()
        loadStats()
        return true
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error('Erro ao criar usuário')
      return false
    }
    return false
  }

  const handleEditUser = async (userId: string, updateData: any) => {
    try {
      const { success, error } = await UserManagementService.updateUser(userId, updateData)
      
      if (error) {
        toast.error(error)
        return false
      }

      if (success) {
        toast.success('Usuário atualizado com sucesso!')
        setShowEditModal(false)
        setSelectedUser(null)
        loadUsers()
        return true
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário')
      return false
    }
    return false
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.is_active
      const { success, error } = await UserManagementService.toggleUserStatus(user.id, newStatus)
      
      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success(`Usuário ${newStatus ? 'desbloqueado' : 'bloqueado'} com sucesso!`)
        loadUsers()
        loadStats()
      }
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const handleChangeRole = async (user: User) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin'
      const { success, error } = await UserManagementService.changeUserRole(user.id, newRole)
      
      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success(`Role alterado para ${newRole === 'admin' ? 'Administrador' : 'Usuário'}!`)
        loadUsers()
        loadStats()
      }
    } catch (error) {
      console.error('Erro ao alterar role:', error)
      toast.error('Erro ao alterar role')
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'role':
        setSelectedRole(value as 'all' | 'user' | 'admin')
        break
      case 'status':
        setSelectedStatus(value as 'all' | 'active' | 'blocked')
        break
      case 'sort':
        setSortBy(value as 'created_at' | 'full_name' | 'email')
        break
    }
    setCurrentPage(1)
  }

  const handleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    setCurrentPage(1)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const openDetailsModal = (user: User) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        Usuário
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-600 text-sm md:text-base">
            <span className="hidden sm:inline">Gerencie usuários, permissões e status da biblioteca</span>
            <span className="sm:hidden">Gerenciar usuários</span>
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 text-sm">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Usuários Bloqueados</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.blockedUsers}</p>
              </div>
              <XCircle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.adminUsers}</p>
              </div>
              <Shield className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Novos este Mês</p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.newUsersThisMonth}</p>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
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
                  placeholder="Buscar por nome, email ou carteirinha..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <select
                value={selectedRole}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os Roles</option>
                <option value="user">Usuários</option>
                <option value="admin">Administradores</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="blocked">Bloqueados</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="created_at">Data de Criação</option>
                <option value="full_name">Nome</option>
                <option value="email">Email</option>
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

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários ({totalUsers})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
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
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carteirinha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.phone && (
                            <div className="flex items-center gap-1 mb-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-xs">{user.address}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {user.library_card_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsModal(user)}
                            className="p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(user)}
                            className="p-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                            className="p-2"
                            title={user.is_active ? 'Bloquear usuário' : 'Desbloquear usuário'}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeRole(user)}
                            className="p-2"
                            title={user.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                          >
                            {user.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </Button>
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
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, totalUsers)} de {totalUsers} usuários
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
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreateUser={handleCreateUser}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onEditUser={handleEditUser}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}
