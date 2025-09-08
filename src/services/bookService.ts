interface BookData {
  title: string
  authors: string[]
  publisher: string
  publishedDate: string
  description: string
  imageLinks?: {
    thumbnail?: string
    smallThumbnail?: string
  }
  categories?: string[]
  pageCount?: number
  language: string
}

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: BookData
  }>
}

export class BookService {
  private static readonly GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

  static async searchByISBN(isbn: string): Promise<BookData | null> {
    try {
      // Limpar ISBN (remover hífens e espaços)
      const cleanISBN = isbn.replace(/[-\s]/g, '')
      
      // Buscar por ISBN
      const response = await fetch(`${this.GOOGLE_BOOKS_API}?q=isbn:${cleanISBN}`)
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data: GoogleBooksResponse = await response.json()

      if (!data.items || data.items.length === 0) {
        return null
      }

      const bookInfo = data.items[0].volumeInfo

      return {
        title: bookInfo.title || 'Título não encontrado',
        authors: bookInfo.authors || ['Autor desconhecido'],
        publisher: bookInfo.publisher || 'Editora não informada',
        publishedDate: bookInfo.publishedDate || '',
        description: bookInfo.description || 'Descrição não disponível',
        imageLinks: bookInfo.imageLinks,
        categories: bookInfo.categories,
        pageCount: bookInfo.pageCount,
        language: bookInfo.language || 'pt'
      }
    } catch (error) {
      console.error('Erro ao buscar livro por ISBN:', error)
      throw new Error('Erro ao buscar informações do livro')
    }
  }

  static async searchByTitle(title: string): Promise<BookData[]> {
    try {
      const response = await fetch(`${this.GOOGLE_BOOKS_API}?q=intitle:${encodeURIComponent(title)}&maxResults=10`)
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data: GoogleBooksResponse = await response.json()

      if (!data.items) {
        return []
      }

      return data.items.map(item => ({
        title: item.volumeInfo.title || 'Título não encontrado',
        authors: item.volumeInfo.authors || ['Autor desconhecido'],
        publisher: item.volumeInfo.publisher || 'Editora não informada',
        publishedDate: item.volumeInfo.publishedDate || '',
        description: item.volumeInfo.description || 'Descrição não disponível',
        imageLinks: item.volumeInfo.imageLinks,
        categories: item.volumeInfo.categories,
        pageCount: item.volumeInfo.pageCount,
        language: item.volumeInfo.language || 'pt'
      }))
    } catch (error) {
      console.error('Erro ao buscar livros por título:', error)
      throw new Error('Erro ao buscar livros')
    }
  }

  static formatISBN(isbn: string): string {
    // Remover caracteres não numéricos
    const cleanISBN = isbn.replace(/[^0-9X]/g, '')
    
    // Formatar ISBN-13
    if (cleanISBN.length === 13) {
      return `${cleanISBN.slice(0, 3)}-${cleanISBN.slice(3, 4)}-${cleanISBN.slice(4, 7)}-${cleanISBN.slice(7, 12)}-${cleanISBN.slice(12)}`
    }
    
    // Formatar ISBN-10
    if (cleanISBN.length === 10) {
      return `${cleanISBN.slice(0, 1)}-${cleanISBN.slice(1, 4)}-${cleanISBN.slice(4, 9)}-${cleanISBN.slice(9)}`
    }
    
    return cleanISBN
  }

  static validateISBN(isbn: string): boolean {
    const cleanISBN = isbn.replace(/[^0-9X]/g, '')
    
    if (cleanISBN.length === 10) {
      return this.validateISBN10(cleanISBN)
    } else if (cleanISBN.length === 13) {
      return this.validateISBN13(cleanISBN)
    }
    
    return false
  }

  private static validateISBN10(isbn: string): boolean {
    if (isbn.length !== 10) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn[i]) * (10 - i)
    }
    
    const checkDigit = isbn[9].toUpperCase()
    const calculatedCheck = (11 - (sum % 11)) % 11
    
    if (calculatedCheck === 10) {
      return checkDigit === 'X'
    }
    
    return checkDigit === calculatedCheck.toString()
  }

  private static validateISBN13(isbn: string): boolean {
    if (isbn.length !== 13) return false
    
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i])
      sum += digit * (i % 2 === 0 ? 1 : 3)
    }
    
    const checkDigit = parseInt(isbn[12])
    const calculatedCheck = (10 - (sum % 10)) % 10
    
    return checkDigit === calculatedCheck
  }
}
