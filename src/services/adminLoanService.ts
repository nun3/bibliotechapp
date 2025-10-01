import { supabase } from '@/lib/supabase'

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  cover_url?: string
  available_copies: number
  total_copies: number
}

export interface User {
  id: string
  email: string
  full_name: string
  library_card_number: string
  role: 'user' | 'admin'
  is_active: boolean
}

export interface Loan {
  id: string
  user_id: string
  book_id: string
  loan_date: string
  due_date: string
  return_date?: string
  status: 'active' | 'returned' | 'overdue'
  created_at: string
  updated_at: string
  users?: User
  books?: Book
}

export interface CreateLoanData {
  user_id: string
  book_id: string
  loan_period_days?: number
}

export interface ReturnLoanData {
  loan_id: string
  return_date?: string
  notes?: string
}

export interface LoanStats {
  totalActiveLoans: number
  totalReturnedLoans: number
  overdueLoans: number
  loansToday: number
  popularBooks: Array<{ book_id: string; title: string; loan_count: number }>
}

export class AdminLoanService {
  /**
   * Busca livros disponíveis para empréstimo
   */
  static async getAvailableBooks(search?: string): Promise<Book[]> {
    let query = supabase
      .from('books')
      .select('*')
      .gt('available_copies', 0)
      .order('title')

    if (search) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar livros disponíveis:', error)
      throw new Error('Erro ao buscar livros disponíveis')
    }

    return data || []
  }

  /**
   * Busca usuários ativos
   */
  static async getActiveUsers(search?: string): Promise<User[]> {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq('role', 'user')
      .order('full_name')

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,library_card_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar usuários ativos:', error)
      throw new Error('Erro ao buscar usuários ativos')
    }

    return data || []
  }

  /**
   * Cria um novo empréstimo
   */
  static async createLoan(loanData: CreateLoanData): Promise<{ success: boolean; error?: string; loan?: Loan }> {
    try {
      // Verificar se o livro ainda está disponível
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_copies')
        .eq('id', loanData.book_id)
        .single()

      if (bookError) {
        console.error('Erro ao verificar livro:', bookError)
        if (bookError.code === 'PGRST301') {
          return { success: false, error: 'Livro não encontrado' }
        }
        return { success: false, error: 'Erro ao verificar disponibilidade do livro' }
      }

      if (!book) {
        return { success: false, error: 'Livro não encontrado' }
      }

      if (book.available_copies <= 0) {
        return { success: false, error: 'Livro não está disponível para empréstimo' }
      }

      // Verificar se o usuário já tem este livro emprestado
      const { data: existingLoan, error: existingError } = await supabase
        .from('loans')
        .select('id')
        .eq('user_id', loanData.user_id)
        .eq('book_id', loanData.book_id)
        .eq('status', 'active')
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Erro ao verificar empréstimo existente:', existingError)
        return { success: false, error: 'Erro ao verificar empréstimos existentes' }
      }

      if (existingLoan) {
        return { success: false, error: 'Usuário já possui este livro emprestado' }
      }

      // Calcular data de vencimento
      const loanPeriodDays = loanData.loan_period_days || 14
      const loanDate = new Date()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + loanPeriodDays)

      // Criar o empréstimo usando uma transação
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .insert({
          user_id: loanData.user_id,
          book_id: loanData.book_id,
          loan_date: loanDate.toISOString(),
          due_date: dueDate.toISOString(),
          status: 'active'
        })
        .select()
        .single()

      if (loanError) {
        console.error('Erro ao criar empréstimo:', loanError)
        
        // Tratamento específico de erros
        if (loanError.code === '42501') {
          return { success: false, error: 'Permissão negada. Verifique se você tem permissão de administrador.' }
        }
        if (loanError.code === '23505') {
          return { success: false, error: 'Empréstimo duplicado detectado' }
        }
        if (loanError.code === '23503') {
          return { success: false, error: 'Usuário ou livro não encontrado' }
        }
        
        return { success: false, error: `Erro ao criar empréstimo: ${loanError.message}` }
      }

      if (!loan) {
        return { success: false, error: 'Falha ao criar empréstimo' }
      }

      // Atualizar quantidade disponível do livro
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          available_copies: book.available_copies - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', loanData.book_id)

      if (updateError) {
        console.error('Erro ao atualizar quantidade do livro:', updateError)
        // Reverter o empréstimo se falhar ao atualizar o livro
        try {
          await supabase.from('loans').delete().eq('id', loan.id)
        } catch (revertError) {
          console.error('Erro ao reverter empréstimo:', revertError)
        }
        return { success: false, error: 'Erro ao atualizar quantidade do livro' }
      }

      // Buscar o empréstimo completo com relacionamentos
      const { data: fullLoan, error: fetchError } = await supabase
        .from('loans')
        .select(`
          id,
          user_id,
          book_id,
          loan_date,
          due_date,
          return_date,
          status,
          created_at,
          updated_at,
          users!user_id(
            id,
            email,
            full_name,
            library_card_number,
            role,
            is_active
          ),
          books!book_id(
            id,
            title,
            author,
            isbn,
            cover_url,
            available_copies,
            total_copies
          )
        `)
        .eq('id', loan.id)
        .single()

      if (fetchError) {
        console.error('Erro ao buscar empréstimo criado:', fetchError)
        // O empréstimo foi criado, mas não conseguimos buscar os dados completos
        return { success: true, loan: loan as any }
      }

      return { success: true, loan: fullLoan }
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Busca empréstimos com filtros
   */
  static async getLoans(options: {
    page?: number
    limit?: number
    search?: string
    status?: 'active' | 'returned' | 'overdue' | 'all'
    userId?: string
    bookId?: string
    sortBy?: 'loan_date' | 'due_date' | 'created_at'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<{ loans: Loan[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status = 'all',
        userId,
        bookId,
        sortBy = 'loan_date',
        sortOrder = 'desc'
      } = options

      let query = supabase
        .from('loans')
        .select(`
          id,
          user_id,
          book_id,
          loan_date,
          due_date,
          return_date,
          status,
          created_at,
          updated_at,
          users!user_id(
            id,
            email,
            full_name,
            library_card_number,
            role,
            is_active
          ),
          books!book_id(
            id,
            title,
            author,
            isbn,
            cover_url,
            available_copies,
            total_copies
          )
        `, { count: 'exact' })

      // Aplicar filtros básicos
      if (status !== 'all') {
        if (status === 'overdue') {
          // Empréstimos em atraso (status ativo mas data de vencimento passou)
          query = query.eq('status', 'active').lt('due_date', new Date().toISOString())
        } else {
          query = query.eq('status', status)
        }
      }

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (bookId) {
        query = query.eq('book_id', bookId)
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao buscar empréstimos:', error)
        throw new Error('Erro ao buscar empréstimos')
      }

      let filteredData = data || []

      // Aplicar busca em memória (depois de carregar os dados)
      if (search) {
        const searchLower = search.toLowerCase()
        filteredData = filteredData.filter(loan => {
          const userName = (loan.users as any)?.full_name?.toLowerCase() || ''
          const userEmail = (loan.users as any)?.email?.toLowerCase() || ''
          const bookTitle = (loan.books as any)?.title?.toLowerCase() || ''
          const bookAuthor = (loan.books as any)?.author?.toLowerCase() || ''
          
          return userName.includes(searchLower) ||
                 userEmail.includes(searchLower) ||
                 bookTitle.includes(searchLower) ||
                 bookAuthor.includes(searchLower)
        })
      }

      // Aplicar paginação em memória
      const from = (page - 1) * limit
      const to = from + limit
      const paginatedData = filteredData.slice(from, to)

      return {
        loans: paginatedData,
        total: filteredData.length
      }
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error)
      return {
        loans: [],
        total: 0
      }
    }
  }

  /**
   * Registra a devolução de um livro
   */
  static async returnLoan(returnData: ReturnLoanData): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar o empréstimo
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
          id,
          user_id,
          book_id,
          loan_date,
          due_date,
          return_date,
          status,
          books!book_id(
            id,
            available_copies
          )
        `)
        .eq('id', returnData.loan_id)
        .single()

      if (loanError || !loan) {
        return { success: false, error: 'Empréstimo não encontrado' }
      }

      if (loan.status === 'returned') {
        return { success: false, error: 'Livro já foi devolvido' }
      }

      const returnDate = returnData.return_date ? new Date(returnData.return_date) : new Date()
      const isOverdue = returnDate > new Date(loan.due_date)

      // Atualizar o empréstimo
      const { error: updateError } = await supabase
        .from('loans')
        .update({
          return_date: returnDate.toISOString(),
          status: 'returned',
          updated_at: new Date().toISOString()
        })
        .eq('id', returnData.loan_id)

      if (updateError) {
        console.error('Erro ao atualizar empréstimo:', updateError)
        return { success: false, error: 'Erro ao registrar devolução' }
      }

      // Atualizar quantidade disponível do livro
      const { error: bookError } = await supabase
        .from('books')
        .update({ 
          available_copies: (loan.books as any).available_copies + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', loan.book_id)

      if (bookError) {
        console.error('Erro ao atualizar quantidade do livro:', bookError)
        return { success: false, error: 'Erro ao atualizar quantidade do livro' }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao devolver livro:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Busca estatísticas de empréstimos
   */
  static async getLoanStats(): Promise<LoanStats> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      const [activeLoans, returnedLoans, overdueLoans, todayLoans, popularBooks] = await Promise.all([
        // Empréstimos ativos
        supabase.from('loans').select('id', { count: 'exact' }).eq('status', 'active'),
        
        // Empréstimos devolvidos
        supabase.from('loans').select('id', { count: 'exact' }).eq('status', 'returned'),
        
        // Empréstimos em atraso
        supabase.from('loans').select('id', { count: 'exact' }).eq('status', 'active').lt('due_date', now),
        
        // Empréstimos de hoje
        supabase.from('loans').select('id', { count: 'exact' }).gte('loan_date', `${today}T00:00:00`).lte('loan_date', `${today}T23:59:59`),
        
        // Livros mais populares (últimos 30 dias)
        supabase
          .from('loans')
          .select('book_id, books!book_id(title)')
          .gte('loan_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .eq('status', 'active')
      ])

      // Contar livros populares
      const bookCounts: Record<string, { title: string; count: number }> = {}
      popularBooks.data?.forEach(loan => {
        const bookId = loan.book_id
        const title = (loan.books as any)?.title || 'Título não disponível'
        
        if (!bookCounts[bookId]) {
          bookCounts[bookId] = { title, count: 0 }
        }
        bookCounts[bookId].count++
      })

      const topBooks = Object.entries(bookCounts)
        .map(([book_id, data]) => ({ book_id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalActiveLoans: activeLoans.count || 0,
        totalReturnedLoans: returnedLoans.count || 0,
        overdueLoans: overdueLoans.count || 0,
        loansToday: todayLoans.count || 0,
        popularBooks: topBooks
      }
    } catch (error) {
      console.error('Erro ao calcular estatísticas de empréstimos:', error)
      throw new Error('Erro ao calcular estatísticas')
    }
  }

  /**
   * Busca empréstimos de um usuário específico
   */
  static async getUserLoans(userId: string, status?: 'active' | 'returned' | 'overdue'): Promise<Loan[]> {
    let query = supabase
      .from('loans')
      .select(`
        id,
        user_id,
        book_id,
        loan_date,
        due_date,
        return_date,
        status,
        created_at,
        updated_at,
        books!book_id(
          id,
          title,
          author,
          isbn,
          cover_url,
          available_copies,
          total_copies
        )
      `)
      .eq('user_id', userId)

    if (status) {
      if (status === 'overdue') {
        query = query.eq('status', 'active').lt('due_date', new Date().toISOString())
      } else {
        query = query.eq('status', status)
      }
    }

    query = query.order('loan_date', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar empréstimos do usuário:', error)
      return []
    }

    return data || []
  }

  /**
   * Verifica se um usuário pode fazer mais empréstimos
   */
  static async canUserBorrow(userId: string): Promise<{ canBorrow: boolean; currentLoans: number; maxLoans: number }> {
    try {
      // Buscar configurações da biblioteca
      const { data: settings } = await supabase
        .from('library_settings')
        .select('max_books_per_user')
        .single()

      const maxLoans = settings?.max_books_per_user || 5

      // Contar empréstimos ativos do usuário
      const { count } = await supabase
        .from('loans')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active')

      const currentLoans = count || 0

      return {
        canBorrow: currentLoans < maxLoans,
        currentLoans,
        maxLoans
      }
    } catch (error) {
      console.error('Erro ao verificar limite de empréstimos:', error)
      return {
        canBorrow: false,
        currentLoans: 0,
        maxLoans: 5
      }
    }
  }
}
