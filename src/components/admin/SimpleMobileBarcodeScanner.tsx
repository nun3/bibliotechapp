import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Camera, X, AlertCircle, Loader2, Flashlight, FlashlightOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { NativeBarcodeService } from '@/services/nativeBarcodeService'

interface SimpleMobileBarcodeScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
  isOpen: boolean
}

export function SimpleMobileBarcodeScanner({ onScan, onClose, isOpen }: SimpleMobileBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(0)
  const [scanCount, setScanCount] = useState(0)
  const [isManualCapture, setIsManualCapture] = useState(false)
  const [isNativeSupported, setIsNativeSupported] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Debounce para evitar múltiplas detecções
  const SCAN_DEBOUNCE_MS = 2000

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
      setIsInitializing(true)
      setIsScanning(false)
      setScanCount(0)
      
      // Verificar suporte da API nativa
      const supported = await NativeBarcodeService.checkSupport()
      setIsNativeSupported(supported)
      
      if (supported) {
        console.log('Usando BarcodeDetector API nativa (mobile)')
      } else {
        console.log('BarcodeDetector API não suportada, usando captura manual (mobile)')
      }

      // Verificar se estamos em HTTPS (necessário para câmera)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('Acesso à câmera requer HTTPS. Por favor, acesse via HTTPS.')
      }

      // Verificar se o navegador suporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera. Tente usar Chrome ou Safari.')
      }

      // Solicitar permissão de câmera primeiro
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (permissionError: any) {
        if (permissionError.name === 'NotAllowedError') {
          throw new Error('Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.')
        } else if (permissionError.name === 'NotFoundError') {
          throw new Error('Nenhuma câmera encontrada no dispositivo.')
        } else if (permissionError.name === 'NotReadableError') {
          throw new Error('Câmera está sendo usada por outro aplicativo.')
        } else {
          throw new Error('Erro ao acessar a câmera: ' + permissionError.message)
        }
      }

      // Inicializar stream de vídeo otimizado para mobile
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira
          width: { ideal: 1280, min: 640, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsScanning(true)
      setIsInitializing(false)
      toast.success('Scanner móvel iniciado!')

      // Iniciar loop de detecção se a API nativa estiver disponível
      if (supported && videoRef.current) {
        startDetectionLoop()
      }

    } catch (err: any) {
      console.error('Erro ao inicializar scanner móvel:', err)
      setError(err.message)
      setIsInitializing(false)
      setIsScanning(false)
      
      handleScannerError(err)
    }
  }

  const startDetectionLoop = useCallback(async () => {
    if (!videoRef.current || !isScanning) return

    try {
      const results = await NativeBarcodeService.recognizeBarcode(videoRef.current, {
        useCanvasAnalysis: true
      })
      
      if (results && NativeBarcodeService.isValidISBNFormat(results.text)) {
        handleBarcodeDetected(results)
        return
      }
    } catch (error) {
      console.log('Detecção automática falhou:', error)
    }

    // Continuar o loop
    if (isScanning) {
      setTimeout(startDetectionLoop, 500) // Verificar a cada 500ms
    }
  }, [isScanning])

  const handleBarcodeDetected = useCallback((result: any) => {
    // Debounce para evitar múltiplas detecções
    const now = Date.now()
    if (now - lastScanTime < SCAN_DEBOUNCE_MS) {
      return
    }
    setLastScanTime(now)

    console.log('Código detectado (mobile):', result)
    
    if (NativeBarcodeService.isValidISBNFormat(result.text)) {
      toast.success(`ISBN escaneado: ${result.text}`)
      onScan(result.text)
      stopScanner()
    } else {
      setScanCount(prev => prev + 1)
      if (scanCount < 3) {
        toast.error('Código escaneado não é um ISBN válido')
      }
    }
  }, [lastScanTime, scanCount, onScan])

  const handleScannerError = (err: any) => {
    console.error('Erro no scanner móvel:', err)
    
    if (err.message.includes('HTTPS')) {
      toast.error('Acesso à câmera requer HTTPS. Use um navegador seguro.')
    } else if (err.message.includes('permissão')) {
      toast.error('Permissão de câmera negada. Verifique as configurações do navegador.')
    } else if (err.message.includes('câmera')) {
      toast.error('Problema com a câmera. Verifique se não está sendo usada por outro app.')
    } else if (err.message.includes('navegador')) {
      toast.error('Navegador não suportado. Use Chrome ou Safari.')
    } else {
      toast.error('Erro no scanner: ' + err.message)
    }
  }

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setIsInitializing(false)
    setError(null)
    setScanCount(0)
  }

  const handleRetry = () => {
    setError(null)
    setScanCount(0)
    initializeScanner()
  }

  const requestCameraPermission = async () => {
    try {
      setError(null)
      toast('Solicitando permissão de câmera...', { icon: 'ℹ️' })
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Parar o stream imediatamente após obter permissão
      stream.getTracks().forEach(track => track.stop())
      
      toast.success('Permissão concedida! Iniciando scanner...')
      setTimeout(() => {
        initializeScanner()
      }, 1000)
    } catch (error: any) {
      console.error('Erro ao solicitar permissão:', error)
      if (error.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador e tente novamente.')
      } else {
        setError('Erro ao solicitar permissão de câmera: ' + error.message)
      }
    }
  }

  const handleManualCapture = async () => {
    if (!videoRef.current || isManualCapture) return

    setIsManualCapture(true)
    
    try {
      console.log('Captura manual iniciada (mobile)...')
      
      // Capturar frame do vídeo
      const canvas = NativeBarcodeService.captureVideoFrame(videoRef.current)
      
      // Tentar reconhecimento com captura manual
      const result = await NativeBarcodeService.recognizeBarcode(canvas, {
        useCanvasAnalysis: true
      })

      if (result && NativeBarcodeService.isValidISBNFormat(result.text)) {
        console.log('Código reconhecido (captura manual mobile):', result.text, 'Método:', result.method)
        toast.success(`ISBN capturado: ${result.text}`)
        onScan(result.text)
        stopScanner()
      } else {
        toast.error('Não foi possível reconhecer o código. Tente reposicionar ou digite manualmente.')
      }
    } catch (error) {
      console.error('Erro na captura manual:', error)
      toast.error('Erro na captura manual')
    } finally {
      setIsManualCapture(false)
    }
  }

  const handleManualInput = () => {
    const isbn = prompt('Digite o ISBN do livro (10 ou 13 dígitos):')
    if (isbn && NativeBarcodeService.isValidISBNFormat(isbn)) {
      onScan(isbn)
      onClose()
    } else if (isbn) {
      toast.error('ISBN inválido. Digite um ISBN com 10 ou 13 dígitos.')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span className="font-medium">Escanear Código</span>
            {isNativeSupported && (
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                API Nativa
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2 border-white text-white hover:bg-white hover:text-black"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scanner Container */}
        <div className="flex-1 relative">
          {error ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center text-white max-w-sm">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-300 mb-4 text-sm">{error}</p>
                
                {/* Instruções específicas baseadas no erro */}
                {error.includes('HTTPS') && (
                  <div className="mb-4 p-3 bg-yellow-900 bg-opacity-50 rounded-lg">
                    <p className="text-yellow-200 text-xs">
                      <strong>Como resolver:</strong><br/>
                      1. Use um navegador seguro (Chrome, Safari)<br/>
                      2. Acesse via HTTPS se possível<br/>
                      3. Ou teste em localhost
                    </p>
                  </div>
                )}
                
                {error.includes('permissão') && (
                  <div className="mb-4 p-3 bg-blue-900 bg-opacity-50 rounded-lg">
                    <p className="text-blue-200 text-xs">
                      <strong>Como resolver:</strong><br/>
                      1. Clique no ícone de câmera na barra de endereço<br/>
                      2. Selecione "Permitir"<br/>
                      3. Ou vá em Configurações {'>'} Privacidade {'>'} Câmera
                    </p>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={requestCameraPermission} 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    Solicitar Permissão
                  </Button>
                  <Button 
                    onClick={handleRetry} 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    Tentar Novamente
                  </Button>
                  <Button 
                    onClick={handleManualInput} 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-black"
                  >
                    Digitar ISBN
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Overlay de escaneamento */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-48 border-2 border-white border-opacity-70 rounded-lg bg-black bg-opacity-20">
                    {/* Cantos destacados */}
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                    
                    {/* Linha central animada */}
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-green-400 bg-opacity-60 animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Indicador de inicialização */}
              {isInitializing && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-black bg-opacity-80 rounded-lg p-3 flex items-center gap-2 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Inicializando scanner...</span>
                  </div>
                </div>
              )}
              
              {/* Indicador de escaneamento */}
              {isScanning && !isInitializing && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-sm">
                  {isNativeSupported ? 'Detecção automática' : 'Aguardando captura'}
                </div>
              )}
              
              {/* Instruções */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
                <p className="text-white text-sm bg-black bg-opacity-70 px-4 py-2 rounded-lg backdrop-blur-sm">
                  Posicione o código de barras dentro da moldura
                </p>
              </div>
            </>
          )}
        </div>

        {/* Controles */}
        {!error && (
          <div className="bg-black p-4 flex justify-center gap-4">
            <Button
              variant={isManualCapture ? "primary" : "outline"}
              size="sm"
              onClick={handleManualCapture}
              disabled={isManualCapture}
              className="bg-black bg-opacity-70 text-white border-white hover:bg-opacity-90"
            >
              {isManualCapture ? 'Capturando...' : 'Capturar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualInput}
              className="bg-black bg-opacity-70 text-white border-white hover:bg-opacity-90"
            >
              Digitar ISBN
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-black bg-opacity-70 text-white border-white hover:bg-opacity-90"
            >
              {isFullscreen ? 'Sair' : 'Tela Cheia'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
