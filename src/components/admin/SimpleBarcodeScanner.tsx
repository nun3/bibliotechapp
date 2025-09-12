import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Camera, X, AlertCircle, Loader2, RotateCcw, Flashlight, FlashlightOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { NativeBarcodeService } from '@/services/nativeBarcodeService'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

interface SimpleBarcodeScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
  isOpen: boolean
}

export function SimpleBarcodeScanner({ onScan, onClose, isOpen }: SimpleBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(0)
  const [scanCount, setScanCount] = useState(0)
  const [isManualCapture, setIsManualCapture] = useState(false)
  const [isNativeSupported, setIsNativeSupported] = useState(false)
  
  // Usar hook de detecção de dispositivo
  const { isMobile } = useDeviceDetection()

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
        console.log('Usando BarcodeDetector API nativa')
      } else {
        console.log('BarcodeDetector API não suportada, usando captura manual')
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

      // Inicializar stream de vídeo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile ? 'environment' : 'user',
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
      toast.success('Scanner iniciado com sucesso!')

      // Iniciar loop de detecção se a API nativa estiver disponível
      if (supported && videoRef.current) {
        startDetectionLoop()
      }

    } catch (err: any) {
      console.error('Erro ao inicializar scanner:', err)
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

    console.log('Código detectado:', result)
    
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
    console.error('Erro no scanner:', err)
    
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
      console.log('Captura manual iniciada...')
      
      // Capturar frame do vídeo
      const canvas = NativeBarcodeService.captureVideoFrame(videoRef.current)
      
      // Tentar reconhecimento com captura manual
      const result = await NativeBarcodeService.recognizeBarcode(canvas, {
        useCanvasAnalysis: true
      })

      if (result && NativeBarcodeService.isValidISBNFormat(result.text)) {
        console.log('Código reconhecido (captura manual):', result.text, 'Método:', result.method)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear Código de Barras
              {isNativeSupported && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  API Nativa
                </span>
              )}
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
              
              {/* Instruções específicas baseadas no erro */}
              {error.includes('HTTPS') && (
                <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Como resolver:</strong><br/>
                    1. Use um navegador seguro (Chrome, Safari)<br/>
                    2. Acesse via HTTPS se possível<br/>
                    3. Ou teste em localhost
                  </p>
                </div>
              )}
              
              {error.includes('permissão') && (
                <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Como resolver:</strong><br/>
                    1. Clique no ícone de câmera na barra de endereço<br/>
                    2. Selecione "Permitir"<br/>
                    3. Ou vá em Configurações {'>'} Privacidade {'>'} Câmera
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={requestCameraPermission} 
                  variant="outline"
                >
                  Solicitar Permissão
                </Button>
                <Button onClick={handleRetry}>
                  Tentar Novamente
                </Button>
                <Button onClick={handleManualInput} variant="outline">
                  Digitar Manualmente
                </Button>
              </div>
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
                
                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Inicializando scanner...</span>
                    </div>
                  </div>
                )}
                
                {isScanning && !isInitializing && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    {isNativeSupported ? 'Detecção automática ativa' : 'Aguardando captura manual'}
                  </div>
                )}

                {/* Canvas oculto para captura */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Posicione o código de barras do livro dentro da área de escaneamento
                </p>
                <p className="text-xs text-gray-500">
                  {isNativeSupported 
                    ? 'O scanner detectará automaticamente códigos ISBN válidos'
                    : 'Use o botão "Capturar" para tentar reconhecer o código'
                  }
                </p>
                <p className="text-blue-600 text-xs bg-blue-50 px-3 py-1 rounded-lg">
                  🚀 Scanner nativo - Mais estável e confiável
                </p>
              </div>
            </>
          )}
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={handleManualCapture} 
              disabled={isManualCapture}
              variant={isManualCapture ? "primary" : "outline"}
            >
              {isManualCapture ? 'Capturando...' : 'Capturar'}
            </Button>
            <Button onClick={handleManualInput} variant="outline">
              Digitar ISBN
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
