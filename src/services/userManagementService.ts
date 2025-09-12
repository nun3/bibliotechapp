import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  address?: string
  library_card_number: string
  role: 'user' | 'admin'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  phone?: string
  address?: string
  role?: 'user' | 'admin'
}

export interface UpdateUserData {
  full_name?: string
  phone?: string
  address?: string
  role?: 'user' | 'admin'
  is_active?: boolean
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  blockedUsers: number
  adminUsers: number
  newUsersThisMonth: number
}

export class UserManagementService {
  /**
   * Busca todos os usuários com paginação e filtros
   */
  static async getUsers(options: {
    page?: number
    limit?: number
    search?: string
    role?: 'user' | 'admin' | 'all'
    status?: 'active' | 'blocked' | 'all'
    sortBy?: 'created_at' | 'full_name' | 'email'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = 'all',
      status = 'all',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = options

    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })

    // Aplicar filtros
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,library_card_number.ilike.%${search}%`)
    }

    if (role !== 'all') {
      query = query.eq('role', role)
    }

    if (status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    // Aplicar ordenação
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Aplicar paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error('Erro ao buscar usuários')
    }

    return {
      users: data || [],
      total: count || 0
    }
  }

  /**
   * Busca um usuário específico por ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return null
    }

    return data
  }

  /**
   * Cria um novo usuário
   */
  static async createUser(userData: CreateUserData): Promise<{ user: User | null; error?: string }> {
    try {
      // Primeiro, criar o usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            address: userData.address,
            role: userData.role || 'user'
          }
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário no auth:', authError)
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Falha ao criar usuário' }
      }

      // Buscar o usuário criado na tabela users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.error('Erro ao buscar usuário criado:', userError)
        return { user: null, error: 'Usuário criado mas não foi possível recuperar dados' }
      }

      return { user }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      return { user: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Atualiza dados de um usuário
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Bloqueia ou desbloqueia um usuário
   */
  static async toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    return this.updateUser(userId, { is_active: isActive })
  }

  /**
   * Altera o role de um usuário
   */
  static async changeUserRole(userId: string, role: 'user' | 'admin'): Promise<{ success: boolean; error?: string }> {
    return this.updateUser(userId, { role })
  }

  /**
   * Remove um usuário (soft delete - marca como inativo)
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.toggleUserStatus(userId, false)
  }

  /**
   * Busca estatísticas dos usuários
   */
  static async getUserStats(): Promise<UserStats> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('role, is_active, created_at')

      if (error) {
        console.error('Erro ao buscar estatísticas de usuários:', error)
        throw new Error('Erro ao buscar estatísticas')
      }

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        blockedUsers: users.filter(u => !u.is_active).length,
        adminUsers: users.filter(u => u.role === 'admin').length,
        newUsersThisMonth: users.filter(u => 
          new Date(u.created_at) >= thisMonth
        ).length
      }

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error)
      throw new Error('Erro ao calcular estatísticas')
    }
  }

  /**
   * Busca usuários com empréstimos ativos
   */
  static async getUsersWithActiveLoans(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        loans!inner(status)
      `)
      .eq('loans.status', 'active')
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao buscar usuários com empréstimos:', error)
      return []
    }

    return data || []
  }

  /**
   * Busca usuários com empréstimos em atraso
   */
  static async getUsersWithOverdueLoans(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        loans!inner(status, due_date)
      `)
      .eq('loans.status', 'overdue')
      .eq('is_active', true)

    if (error) {
      console.error('Erro ao buscar usuários com empréstimos em atraso:', error)
      return []
    }

    return data || []
  }

  /**
   * Gera um novo número de carteirinha
   */
  static async generateLibraryCardNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_library_card_number')

    if (error) {
      console.error('Erro ao gerar número da carteirinha:', error)
      // Fallback: gerar número localmente
      const timestamp = Date.now().toString()
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      return `BC${timestamp}${random}`
    }

    return data || `BC${Date.now()}${Math.floor(Math.random() * 1000)}`
  }

  /**
   * Verifica se um email já está em uso
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    return !data && error?.code === 'PGRST116' // No rows returned
  }

  /**
   * Verifica se um número de carteirinha já está em uso
   */
  static async isLibraryCardNumberAvailable(cardNumber: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('library_card_number', cardNumber)
      .single()

    return !data && error?.code === 'PGRST116' // No rows returned
  }
}
