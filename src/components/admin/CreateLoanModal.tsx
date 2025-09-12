import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { X, User, Book, Search, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdminLoanService, CreateLoanData, Book as BookType, User as UserType } from '@/services/adminLoanService'

interface CreateLoanModalProps {
  onClose: () => void
  onCreateLoan: (loanData: CreateLoanData) => Promise<boolean>
}

export function CreateLoanModal({ onClose, onCreateLoan }: CreateLoanModalProps) {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null)
  const [loanPeriodDays, setLoanPeriodDays] = useState(14)
  const [userSearch, setUserSearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [users, setUsers] = useState<UserType[]>([])
  const [books, setBooks] = useState<BookType[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (userSearch.length >= 2) {
      loadUsers()
    } else {
      setUsers([])
    }
  }, [userSearch])

  useEffect(() => {
    if (bookSearch.length >= 2) {
      loadBooks()
    } else {
      setBooks([])
    }
  }, [bookSearch])

  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const usersData = await AdminLoanService.getActiveUsers(userSearch)
      setUsers(usersData)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadBooks = async () => {
    try {
      setLoadingBooks(true)
      const booksData = await AdminLoanService.getAvailableBooks(bookSearch)
      setBooks(booksData)
    } catch (error) {
      console.error('Erro ao carregar livros:', error)
      toast.error('Erro ao carregar livros')
    } finally {
      setLoadingBooks(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!selectedUser) {
      newErrors.user = 'Selecione um usuário'
    }

    if (!selectedBook) {
      newErrors.book = 'Selecione um livro'
    }

    if (loanPeriodDays < 1) {
      newErrors.loanPeriod = 'Período deve ser maior que 0 dias'
    }

    if (loanPeriodDays > 90) {
      newErrors.loanPeriod = 'Período não pode ser maior que 90 dias'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!selectedUser || !selectedBook) {
      return
    }

    setLoading(true)
    try {
      const success = await onCreateLoan({
        user_id: selectedUser.id,
        book_id: selectedBook.id,
        loan_period_days: loanPeriodDays
      })

      if (success) {
        // Resetar formulário
        setSelectedUser(null)
        setSelectedBook(null)
        setLoanPeriodDays(14)
        setUserSearch('')
        setBookSearch('')
        setUsers([])
        setBooks([])
        setErrors({})
      }
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error)
      toast.error('Erro interno do servidor')
    } finally {
      setLoading(false)
    }
  }

  const selectUser = (user: UserType) => {
    setSelectedUser(user)
    setUserSearch('')
    setUsers([])
  }

  const selectBook = (book: BookType) => {
    setSelectedBook(book)
    setBookSearch('')
    setBooks([])
  }

  const clearSelection = (type: 'user' | 'book') => {
    if (type === 'user') {
      setSelectedUser(null)
      setUserSearch('')
    } else {
      setSelectedBook(null)
      setBookSearch('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Novo Empréstimo
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Usuário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário *
              </label>
              
              {selectedUser ? (
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedUser.full_name}</p>
                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                        <p className="text-sm text-gray-500 font-mono">{selectedUser.library_card_number}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearSelection('user')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Buscar por nome, email ou carteirinha..."
                      className={`pl-10 ${errors.user ? 'border-red-500' : ''}`}
                    />
                  </div>
                  
                  {userSearch.length >= 2 && (
                    <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="p-3 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          Buscando usuários...
                        </div>
                      ) : users.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">
                          Nenhum usuário encontrado
                        </div>
                      ) : (
                        users.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => selectUser(user)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <p className="text-sm text-gray-500 font-mono">{user.library_card_number}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {errors.user && (
                <p className="text-red-500 text-sm mt-1">{errors.user}</p>
              )}
            </div>

            {/* Seleção de Livro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Livro *
              </label>
              
              {selectedBook ? (
                <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Book className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedBook.title}</p>
                        <p className="text-sm text-gray-500">{selectedBook.author}</p>
                        {selectedBook.isbn && (
                          <p className="text-sm text-gray-500 font-mono">ISBN: {selectedBook.isbn}</p>
                        )}
                        <Badge variant="secondary" className="mt-1">
                          {selectedBook.available_copies} disponível{selectedBook.available_copies !== 1 ? 'is' : ''}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearSelection('book')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder="Buscar por título, autor ou ISBN..."
                      className={`pl-10 ${errors.book ? 'border-red-500' : ''}`}
                    />
                  </div>
                  
                  {bookSearch.length >= 2 && (
                    <div className="border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                      {loadingBooks ? (
                        <div className="p-3 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          Buscando livros...
                        </div>
                      ) : books.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">
                          Nenhum livro disponível encontrado
                        </div>
                      ) : (
                        books.map((book) => (
                          <div
                            key={book.id}
                            onClick={() => selectBook(book)}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Book className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{book.title}</p>
                                  <p className="text-sm text-gray-500">{book.author}</p>
                                  {book.isbn && (
                                    <p className="text-sm text-gray-500 font-mono">ISBN: {book.isbn}</p>
                                  )}
                                </div>
                              </div>
                              <Badge variant="secondary">
                                {book.available_copies} disp.
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {errors.book && (
                <p className="text-red-500 text-sm mt-1">{errors.book}</p>
              )}
            </div>

            {/* Período de Empréstimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período de Empréstimo (dias) *
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={loanPeriodDays}
                  onChange={(e) => setLoanPeriodDays(Number(e.target.value))}
                  className={`w-24 ${errors.loanPeriod ? 'border-red-500' : ''}`}
                />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Vencimento: {new Date(Date.now() + loanPeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              {errors.loanPeriod && (
                <p className="text-red-500 text-sm mt-1">{errors.loanPeriod}</p>
              )}
            </div>

            {/* Informações de Resumo */}
            {selectedUser && selectedBook && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Resumo do Empréstimo
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Usuário:</strong> {selectedUser.full_name}</p>
                  <p><strong>Livro:</strong> {selectedBook.title}</p>
                  <p><strong>Autor:</strong> {selectedBook.author}</p>
                  <p><strong>Período:</strong> {loanPeriodDays} dias</p>
                  <p><strong>Vencimento:</strong> {new Date(Date.now() + loanPeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedUser || !selectedBook}
                className="flex-1"
              >
                {loading ? 'Criando...' : 'Criar Empréstimo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
