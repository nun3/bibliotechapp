import React, { useEffect, useState, useRef, useCallback } from 'react'
import { BookCard } from './BookCard'
import { BookDetailsModal } from './BookDetailsModal'
import { Book } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Search, Filter, Grid, List, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface BookGridProps {
  onLoan?: (book: Book) => void
  onReserve?: (book: Book) => void
}

export function BookGrid({ onLoan, onReserve }: BookGridProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoaning, setIsLoaning] = useState(false)

  const fetchBooks = async (search = searchTerm, genre = selectedGenre, isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true)
      }
      setError(null)
      
      let query = supabase.from('books').select('*')

      if (search && search.trim()) {
        const searchTermLower = search.trim().toLowerCase()
        query = query.or(`title.ilike.%${searchTermLower}%,author.ilike.%${searchTermLower}%`)
      }

      if (genre && genre.trim()) {
        query = query.eq('genre', genre.trim())
      }

      const { data, error } = await query.order('title')

      if (error) {
        setError(`Erro na busca: ${error.message}`)
        setBooks([])
        return
      }
      
      setBooks(data || [])
    } catch (error: any) {
      setError(`Erro inesperado: ${error.message || 'Erro desconhecido'}`)
      setBooks([])
    } finally {
      if (isInitial) {
        setLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  // Carregar livros na inicialização
  useEffect(() => {
    fetchBooks('', '', true) // isInitial = true
  }, []) // Array vazio - executa apenas uma vez

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    fetchBooks()
  }

  // Executar busca automaticamente quando os filtros mudam
  useEffect(() => {
    // Não executar na primeira renderização
    if (isInitialLoad) return
    
    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      fetchBooks(searchTerm, selectedGenre, false) // isInitial = false
      setIsSearching(false)
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedGenre, isInitialLoad]) // Adicionado isInitialLoad

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedBook(null)
  }

  const handleLoan = async (book: Book) => {
    try {
      setIsLoaning(true)
      
      if (book.available_copies <= 0) {
        toast.error('Livro não disponível para empréstimo')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Você precisa estar logado para emprestar livros')
        return
      }

      // Verificar se o usuário já tem este livro emprestado
      const { data: existingLoan } = await supabase
        .from('loans')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', book.id)
        .is('return_date', null)
        .maybeSingle()

      if (existingLoan) {
        toast.error('Você já tem este livro emprestado')
        return
      }

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 14) // 14 dias de prazo

      const { error: loanError } = await supabase
        .from('loans')
        .insert({
          user_id: user.id,
          book_id: book.id,
          due_date: dueDate.toISOString(),
        })

      if (loanError) throw loanError

      // Atualizar disponibilidade do livro
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          available_copies: book.available_copies - 1 
        })
        .eq('id', book.id)

      if (updateError) throw updateError

      toast.success(`Livro "${book.title}" emprestado com sucesso!`)
      
      // Fechar modal e atualizar lista
      handleCloseModal()
      fetchBooks() // Atualizar lista
      onLoan?.(book)
    } catch (error: any) {
      console.error('Erro ao emprestar livro:', error)
      toast.error(error.message || 'Erro ao emprestar livro')
    } finally {
      setIsLoaning(false)
    }
  }

  const handleReserve = async (book: Book) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Você precisa estar logado para reservar livros')
        return
      }

      const { error } = await supabase
        .from('reservations')
        .insert({
          user_id: user.id,
          book_id: book.id,
        })

      if (error) throw error

      toast.success('Livro reservado com sucesso!')
      onReserve?.(book)
    } catch (error: any) {
      console.error('Erro ao reservar livro:', error)
      toast.error(error.message || 'Erro ao reservar livro')
    }
  }

  const genres = Array.from(new Set(books.map(book => book.genre))).filter(Boolean)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  // Se houver erro, mostrar mensagem simples
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar catálogo</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => {
                setError(null)
                setSearchTerm('')
                setSelectedGenre('')
                fetchBooks()
              }}
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                {isSearching ? (
                  <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" />
                )}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar por título ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex h-10 w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 pl-10 text-sm placeholder:text-secondary-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos os gêneros</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGenre('')
                }} 
                variant="outline"
                title="Limpar filtros"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex border border-secondary-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-secondary-500'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-secondary-500'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-secondary-600">
          {books.length} livro{books.length !== 1 ? 's' : ''} encontrado{books.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Books Grid/List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              Nenhum livro encontrado
            </h3>
            <p className="text-secondary-500 mb-4">
              {searchTerm || selectedGenre 
                ? 'Nenhum livro corresponde aos filtros aplicados'
                : 'Nenhum livro disponível no momento'
              }
            </p>
            {(searchTerm || selectedGenre) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedGenre('')
                  fetchBooks()
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetails={handleViewDetails}
              onReserve={handleReserve}
            />
          ))}
        </div>
      )}

      {/* Book Details Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onLoan={handleLoan}
        isLoaning={isLoaning}
      />
    </div>
  )
}
