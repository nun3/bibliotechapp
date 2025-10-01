import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookGrid } from '@/components/catalog/BookGrid'
import { Book } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function Catalog() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Verificar se há parâmetro de busca na URL
    const queryParam = searchParams.get('q')
    if (queryParam) {
      // Aqui você pode adicionar lógica para pré-preencher a busca
      console.log('Busca recebida via URL:', queryParam)
    }
  }, [searchParams])

  const handleLoan = (book: Book) => {
    toast.success(`Livro "${book.title}" emprestado com sucesso!`)
  }

  const handleReserve = (book: Book) => {
    toast.success(`Livro "${book.title}" reservado com sucesso!`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Catálogo de Livros</h1>
        <p className="text-white/80 mt-2">
          Explore nossa coleção de livros e encontre sua próxima leitura
        </p>
      </div>

      {/* Book Grid */}
      <BookGrid onLoan={handleLoan} onReserve={handleReserve} />
    </div>
  )
}
