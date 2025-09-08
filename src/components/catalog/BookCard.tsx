import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Book } from '@/lib/supabase'
import { BookOpen, Calendar, User } from 'lucide-react'

interface BookCardProps {
  book: Book
  onViewDetails?: (book: Book) => void
  onReserve?: (book: Book) => void
  showActions?: boolean
}

export function BookCard({ book, onViewDetails, onReserve, showActions = true }: BookCardProps) {
  const isAvailable = book.available_copies > 0

  return (
    <Card className="h-full flex flex-col">
      <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-secondary-100 rounded-t-xl flex items-center justify-center">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover rounded-t-xl"
          />
        ) : (
          <BookOpen className="h-16 w-16 text-primary-400" />
        )}
      </div>
      
      <CardContent className="flex-1 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-secondary-900 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-secondary-600 flex items-center">
            <User className="h-4 w-4 mr-1" />
            {book.author}
          </p>
          <p className="text-sm text-secondary-500 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {book.publication_year}
          </p>
          <Badge variant="secondary" className="text-xs">
            {book.genre}
          </Badge>
        </div>
        
        {book.description && (
          <p className="text-sm text-secondary-500 mt-3 line-clamp-3">
            {book.description}
          </p>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">
            {book.available_copies} de {book.total_copies} disponíveis
          </span>
          <Badge 
            variant={isAvailable ? 'success' : 'warning'}
            className="text-xs"
          >
            {isAvailable ? 'Disponível' : 'Indisponível'}
          </Badge>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="p-4 pt-0">
          <div className="flex space-x-2 w-full">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails?.(book)}
            >
              Ver Detalhes
            </Button>
            {!isAvailable && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onReserve?.(book)}
              >
                Reservar
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
