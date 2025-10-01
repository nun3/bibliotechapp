import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BookService } from '@/services/bookService'
import { BarcodeScanner } from './BarcodeScanner'
import { BookOpen, Search, Plus, AlertCircle, Loader2, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

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

export function BookRegistrationForm() {
  const [isbn, setIsbn] = useState('')
  const [bookData, setBookData] = useState<BookData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copies, setCopies] = useState(1)
  const [showScanner, setShowScanner] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [manualBookData, setManualBookData] = useState({
    title: '',
    author: '',
    publisher: '',
    publicationYear: '',
    genre: '',
    description: '',
    isbn: ''
  })

  const handleSearch = async (searchISBN?: string) => {
    const isbnToSearch = String(searchISBN || isbn || '').trim()
    
    if (!isbnToSearch) {
      toast.error('Por favor, digite um ISBN válido')
      return
    }

    if (!BookService.validateISBN(isbnToSearch)) {
      toast.error('ISBN inválido. Verifique o formato.')
      return
    }

    setLoading(true)
    try {
      const data = await BookService.searchByISBN(isbnToSearch)
      if (data) {
        setBookData(data)
        toast.success('Livro encontrado!')
      } else {
        toast.error('Livro não encontrado nas bases de dados (Google Books, BrasilAPI e Open Library). Verifique o ISBN ou tente outro.')
        setBookData(null)
      }
    } catch (error: any) {
      toast.error(`Erro ao buscar livro: ${error.message}`)
      setBookData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!bookData) return

    setSaving(true)
    try {
      const cleanISBN = isbn.replace(/[^0-9X]/g, '')
      const formattedISBN = BookService.formatISBN(cleanISBN)
      
      const { error } = await supabase
        .from('books')
        .insert({
          title: bookData.title,
          author: bookData.authors.join(', '),
          isbn: formattedISBN,
          publisher: bookData.publisher,
          publication_year: bookData.publishedDate ? parseInt(bookData.publishedDate.split('-')[0]) : null,
          genre: bookData.categories?.[0] || 'Geral',
          description: bookData.description,
          cover_url: bookData.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          total_copies: copies,
          available_copies: copies
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('Este livro já está cadastrado no sistema')
        } else {
          throw error
        }
      } else {
        toast.success('Livro cadastrado com sucesso!')
        setIsbn('')
        setBookData(null)
        setCopies(1)
      }
    } catch (error: any) {
      console.error('Erro ao salvar livro:', error)
      toast.error(`Erro ao salvar livro: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveManual = async () => {
    if (!manualBookData.title.trim() || !manualBookData.author.trim()) {
      toast.error('Título e autor são obrigatórios')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('books')
        .insert({
          title: manualBookData.title,
          author: manualBookData.author,
          isbn: manualBookData.isbn || null,
          publisher: manualBookData.publisher || null,
          publication_year: manualBookData.publicationYear ? parseInt(manualBookData.publicationYear) : null,
          genre: manualBookData.genre || 'Geral',
          description: manualBookData.description || null,
          cover_url: null,
          total_copies: copies,
          available_copies: copies
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('Este livro já está cadastrado no sistema')
        } else {
          throw error
        }
      } else {
        toast.success('Livro cadastrado com sucesso!')
        setManualBookData({
          title: '',
          author: '',
          publisher: '',
          publicationYear: '',
          genre: '',
          description: '',
          isbn: ''
        })
        setCopies(1)
      }
    } catch (error: any) {
      console.error('Erro ao salvar livro:', error)
      toast.error(`Erro ao salvar livro: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    setIsbn('')
    setBookData(null)
    setCopies(1)
    setManualBookData({
      title: '',
      author: '',
      publisher: '',
      publicationYear: '',
      genre: '',
      description: '',
      isbn: ''
    })
  }

  const handleBarcodeScan = useCallback((scannedISBN: string) => {
    setIsbn(scannedISBN)
    setShowScanner(false)
    // Automaticamente buscar o livro após escanear, passando o ISBN diretamente
    // Usar requestAnimationFrame para garantir que o estado foi atualizado
    requestAnimationFrame(() => {
      handleSearch(scannedISBN)
    })
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {manualMode ? 'Cadastro Manual de Livros' : 'Cadastro de Livros por ISBN'}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={!manualMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setManualMode(false)
                  handleClear()
                }}
              >
                Buscar por ISBN
              </Button>
              <Button
                variant={manualMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setManualMode(true)
                  handleClear()
                }}
              >
                Cadastrar Manualmente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!manualMode ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input
                    label="ISBN"
                    placeholder="Digite o ISBN do livro (10 ou 13 dígitos)"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:self-end">
                  <Button 
                    onClick={() => handleSearch()} 
                    disabled={loading || !String(isbn || '').trim()}
                    className="text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Buscando...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowScanner(true)}
                    title="Escanear código de barras"
                    className="text-sm"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Escanear
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Título *"
                  placeholder="Digite o título do livro"
                  value={manualBookData.title}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  label="Autor(es) *"
                  placeholder="Digite o nome do(s) autor(es)"
                  value={manualBookData.author}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, author: e.target.value }))}
                />
                <Input
                  label="Editora"
                  placeholder="Digite a editora"
                  value={manualBookData.publisher}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, publisher: e.target.value }))}
                />
                <Input
                  label="Ano de Publicação"
                  placeholder="Ex: 2023"
                  type="number"
                  min="1000"
                  max="2030"
                  value={manualBookData.publicationYear}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, publicationYear: e.target.value }))}
                />
                <Input
                  label="Gênero"
                  placeholder="Ex: Ficção, Romance, Técnico..."
                  value={manualBookData.genre}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, genre: e.target.value }))}
                />
                <Input
                  label="ISBN (opcional)"
                  placeholder="Digite o ISBN se disponível"
                  value={manualBookData.isbn}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, isbn: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Descrição
                </label>
                <textarea
                  placeholder="Digite uma breve descrição do livro"
                  value={manualBookData.description}
                  onChange={(e) => setManualBookData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="flex w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm placeholder:text-secondary-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary-700">
                    Número de cópias:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveManual} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Livro
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Limpar
                </Button>
              </div>
            </div>
          )}

          {bookData && (
            <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
              <div className="flex items-start gap-4">
                {bookData.imageLinks?.thumbnail && (
                  <img
                    src={bookData.imageLinks.thumbnail.replace('http:', 'https:')}
                    alt={bookData.title}
                    className="w-20 h-28 object-cover rounded border border-secondary-200"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-secondary-900 mb-2">
                    {bookData.title}
                  </h3>
                  <div className="space-y-1 text-sm text-secondary-600">
                    <p><strong>Autor(es):</strong> {bookData.authors.join(', ')}</p>
                    <p><strong>Editora:</strong> {bookData.publisher}</p>
                    <p><strong>Ano:</strong> {bookData.publishedDate ? bookData.publishedDate.split('-')[0] : 'Não informado'}</p>
                    <p><strong>Gênero:</strong> {bookData.categories?.[0] || 'Não informado'}</p>
                    {bookData.pageCount && (
                      <p><strong>Páginas:</strong> {bookData.pageCount}</p>
                    )}
                  </div>
                  <p className="text-sm text-secondary-600 mt-2 line-clamp-3">
                    {bookData.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary-700">
                    Número de cópias:
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={copies}
                    onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Livro
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Limpar
                </Button>
              </div>
            </div>
          )}

          {!bookData && !loading && !manualMode && (
            <div className="text-center py-8 text-secondary-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-secondary-300" />
              <p>Digite um ISBN válido para buscar informações do livro</p>
              <div className="mt-4 text-sm">
                <p className="font-medium mb-2">Exemplos de ISBNs para teste:</p>
                <div className="space-y-1 text-xs">
                  <p>• 9788561721305 (Campo de batalha da mente para crianças)</p>
                  <p>• 9788535914849 (1984 - George Orwell)</p>
                  <p>• 9788532523055 (O Pequeno Príncipe)</p>
                </div>
              </div>
            </div>
          )}

          {manualMode && (
            <div className="text-center py-4 text-secondary-500">
              <p className="text-sm">
                <strong>Dica:</strong> Campos marcados com * são obrigatórios. 
                O ISBN é opcional no cadastro manual.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scanner de Código de Barras */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowScanner(false)}
      />

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Como usar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-secondary-600">
            <p><strong>Modo Buscar por ISBN:</strong></p>
            <p>• <strong>Digite</strong> o ISBN do livro (10 ou 13 dígitos) no campo acima, ou</p>
            <p>• <strong>Escanee</strong> o código de barras do livro usando o botão "Escanear"</p>
            <p>• O sistema buscará automaticamente as informações do livro</p>
            <p>• Verifique os dados encontrados e ajuste se necessário</p>
            <p>• Defina o número de cópias disponíveis</p>
            <p>• Clique em "Cadastrar Livro" para adicionar ao acervo</p>
            
            <p className="mt-4"><strong>Modo Cadastro Manual:</strong></p>
            <p>• <strong>Preencha</strong> os campos obrigatórios (Título e Autor)</p>
            <p>• <strong>Adicione</strong> informações opcionais como editora, ano, gênero, ISBN</p>
            <p>• <strong>Defina</strong> o número de cópias disponíveis</p>
            <p>• <strong>Clique</strong> em "Cadastrar Livro" para adicionar ao acervo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
