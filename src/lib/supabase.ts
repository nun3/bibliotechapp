import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`
╔═══════════════════════════════════════════════════════════════════╗
║  ⚠️  ERRO: Variáveis de ambiente do Supabase não configuradas    ║
╠═══════════════════════════════════════════════════════════════════╣
║  Por favor, crie o arquivo .env.local na raiz do projeto com:     ║
║                                                                    ║
║  VITE_SUPABASE_URL=sua_url_do_supabase                            ║
║  VITE_SUPABASE_ANON_KEY=sua_chave_anonima                         ║
║                                                                    ║
║  Você pode copiar o arquivo env.example e renomeá-lo:             ║
║  $ cp env.example .env.local                                      ║
╚═══════════════════════════════════════════════════════════════════╝
  `)
  throw new Error('Missing Supabase environment variables. Please check console for details.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  publisher: string
  publication_year: number
  genre: string
  description: string
  cover_url?: string
  total_copies: number
  available_copies: number
  created_at: string
  updated_at: string
}

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
  user?: User
  book?: Book
}

export interface Reservation {
  id: string
  user_id: string
  book_id: string
  reservation_date: string
  status: 'pending' | 'fulfilled' | 'cancelled'
  created_at: string
  updated_at: string
  user?: User
  book?: Book
}
