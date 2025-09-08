import React from 'react'
import { Book } from '@/lib/supabase'
import { X, Calendar, User, BookOpen, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface BookDetailsModalProps {
  book: Book | null
  isOpen: boolean
  onClose: () => void
  onLoan: (book: Book) => void
  isLoaning?: boolean
}

export function BookDetailsModal({ book, isOpen, onClose, onLoan, isLoaning = false }: BookDetailsModalProps) {
  if (!isOpen || !book) return null

  const handleLoan = () => {
    onLoan(book)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">{book.title}</h2>
              <p className="text-lg text-secondary-600 mb-1">por {book.author}</p>
              <div className="flex items-center gap-4 text-sm text-secondary-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {book.publication_year}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {book.genre}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {book.available_copies} de {book.total_copies} disponíveis
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Book Details */}
          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-secondary-900 mb-2">Sinopse</h3>
                <p className="text-secondary-700 leading-relaxed">
                  {book.description || 'Sinopse não disponível para este livro.'}
                </p>
              </CardContent>
            </Card>

            {/* Book Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-2">Informações do Livro</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">ISBN:</span>
                      <span className="text-secondary-900">{book.isbn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Editora:</span>
                      <span className="text-secondary-900">{book.publisher || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Páginas:</span>
                      <span className="text-secondary-900">{book.pages || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Idioma:</span>
                      <span className="text-secondary-900">{book.language || 'Português'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-2">Disponibilidade</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Total de exemplares:</span>
                      <span className="text-secondary-900">{book.total_copies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Disponíveis:</span>
                      <span className={`font-medium ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {book.available_copies}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Status:</span>
                      <span className={`font-medium ${book.available_copies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {book.available_copies > 0 ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loan Information */}
            {book.available_copies > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Informações do Empréstimo</h3>
                      <p className="text-blue-700 text-sm">
                        O empréstimo terá duração de <strong>14 dias</strong>. 
                        A data de devolução será calculada automaticamente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-secondary-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            {book.available_copies > 0 ? (
              <Button
                onClick={handleLoan}
                disabled={isLoaning}
                className="flex-1"
              >
                {isLoaning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Emprestando...
                  </>
                ) : (
                  'Emprestar Livro'
                )}
              </Button>
            ) : (
              <Button
                disabled
                className="flex-1 bg-secondary-300 text-secondary-500"
              >
                Livro Indisponível
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

