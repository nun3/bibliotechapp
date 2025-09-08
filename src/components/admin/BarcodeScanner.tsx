import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Camera, X, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BarcodeScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    if (isOpen) {
      initializeScanner()
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isOpen])

  const initializeScanner = async () => {
    try {
      setError(null)
      setIsScanning(true)
      
      // Verificar se há câmera disponível
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        throw new Error('Nenhuma câmera encontrada')
      }

      // Criar leitor de código de barras
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Configurar formatos suportados (ISBN geralmente usa EAN-13 ou Code-128)
      const hints = new Map()
      hints.set(1, ['EAN_13', 'CODE_128', 'CODE_39', 'EAN_8'])

      // Iniciar leitura
      await reader.decodeFromVideoDevice(
        null, // Usar câmera padrão
        videoRef.current!,
        (result, error) => {
          if (result) {
            const isbn = result.getText()
            console.log('Código escaneado:', isbn)
            
            // Validar se parece com um ISBN
            if (isValidISBNFormat(isbn)) {
              toast.success('ISBN escaneado com sucesso!')
              onScan(isbn)
              stopScanner()
            } else {
              toast.error('Código escaneado não é um ISBN válido')
            }
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Erro no scanner:', error)
          }
        }
      )

      setHasPermission(true)
    } catch (err: any) {
      console.error('Erro ao inicializar scanner:', err)
      setError(err.message)
      setHasPermission(false)
      setIsScanning(false)
      
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão de câmera negada')
      } else if (err.name === 'NotFoundError') {
        toast.error('Nenhuma câmera encontrada')
      } else {
        toast.error('Erro ao acessar a câmera')
      }
    }
  }

  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    setIsScanning(false)
    setError(null)
  }

  const isValidISBNFormat = (code: string): boolean => {
    // Remover caracteres não numéricos
    const cleanCode = code.replace(/[^0-9X]/g, '')
    
    // ISBN pode ter 10 ou 13 dígitos
    return cleanCode.length === 10 || cleanCode.length === 13
  }

  const handleRetry = () => {
    setError(null)
    initializeScanner()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear Código de Barras
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
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRetry} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-100 rounded-lg object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-lg p-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Escaneando...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Posicione o código de barras do livro dentro da área de escaneamento
                </p>
                <p className="text-xs text-gray-500">
                  O scanner detectará automaticamente códigos ISBN válidos
                </p>
              </div>
            </>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            {error && (
              <Button onClick={handleRetry}>
                Tentar Novamente
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
