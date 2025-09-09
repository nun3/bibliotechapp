import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Camera, X, AlertCircle, Loader2, RotateCcw, Flashlight, FlashlightOff, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { AdvancedBarcodeService, BarcodeResult } from '@/services/advancedBarcodeService'

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
  const [, setHasPermission] = useState<boolean | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentCamera, setCurrentCamera] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [useAdvancedRecognition, setUseAdvancedRecognition] = useState(false)
  const [recognitionMethod, setRecognitionMethod] = useState<string>('')
  const [recognitionConfidence, setRecognitionConfidence] = useState<number>(0)

  useEffect(() => {
    // Detectar se é dispositivo móvel
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                            window.innerWidth < 768 ||
                            'ontouchstart' in window
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

      setAvailableCameras(videoDevices)
      
      // Para mobile, preferir câmera traseira (environment)
      let selectedCamera = null
      if (isMobile) {
        const backCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        selectedCamera = backCamera?.deviceId || videoDevices[0].deviceId
      } else {
        selectedCamera = videoDevices[0].deviceId
      }
      
      setCurrentCamera(selectedCamera)

      // Criar leitor de código de barras
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Tentar diferentes configurações de resolução
      const resolutionConfigs = [
        // Configuração ideal - alta resolução
        {
          width: { ideal: isMobile ? 1920 : 2560, min: 1280 },
          height: { ideal: isMobile ? 1080 : 1440, min: 720 },
          focusMode: 'continuous',
          exposureMode: 'continuous',
          whiteBalanceMode: 'continuous',
          iso: { ideal: 400, max: 800 }
        },
        // Configuração alternativa - resolução média
        {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          focusMode: 'continuous',
          exposureMode: 'continuous'
        },
        // Configuração básica - compatibilidade
        {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      ]

      let constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: isMobile ? 'environment' : 'user',
          ...resolutionConfigs[0] // Começar com a melhor configuração
        }
      }

      // Configurar hints para melhor detecção
      const hints = new Map()
      hints.set(1, ['EAN_13', 'CODE_128', 'CODE_39', 'EAN_8', 'UPC_A', 'UPC_E'])
      hints.set(2, 1) // Tentar apenas uma vez por frame para melhor performance

      // Iniciar leitura com configurações otimizadas
      await reader.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current!,
        async (result, error) => {
          if (result) {
            const isbn = result.getText()
            console.log('Código escaneado (ZXing):', isbn)
            
            // Validar se parece com um ISBN
            if (isValidISBNFormat(isbn)) {
              setRecognitionMethod('ZXing')
              setRecognitionConfidence(0.8)
              toast.success('ISBN escaneado com sucesso!')
              onScan(isbn)
              stopScanner()
            } else {
              // Tentar reconhecimento avançado se o básico falhar
              if (useAdvancedRecognition) {
                await tryAdvancedRecognition()
              } else {
                toast.error('Código escaneado não é um ISBN válido')
              }
            }
          } else {
            // Se ZXing falhar, tentar reconhecimento avançado
            if (useAdvancedRecognition && error?.name === 'NotFoundException') {
              await tryAdvancedRecognition()
            }
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Erro no scanner:', error)
          }
        },
        hints
      )

      setHasPermission(true)
    } catch (err: any) {
      console.error('Erro ao inicializar scanner:', err)
      setError(err.message)
      setHasPermission(false)
      setIsScanning(false)
      
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão de câmera negada. Por favor, permita o acesso à câmera.')
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

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return
    
    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentCamera)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex].deviceId
    
    setCurrentCamera(nextCamera)
    stopScanner()
    
    // Pequeno delay para garantir que a câmera anterior foi liberada
    setTimeout(() => {
      initializeScanner()
    }, 100)
  }

  const toggleFlashlight = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return
    
    try {
      const stream = videoRef.current.srcObject as MediaStream
      const track = stream.getVideoTracks()[0]
      
      if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities()
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn }]
          })
          setFlashlightOn(!flashlightOn)
        }
      }
    } catch (error) {
      console.error('Erro ao controlar flash:', error)
      toast.error('Flash não disponível neste dispositivo')
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

  const tryAdvancedRecognition = async () => {
    if (!videoRef.current) return

    try {
      console.log('Tentando reconhecimento avançado...')
      
      // Capturar frame do vídeo
      const canvas = AdvancedBarcodeService.captureVideoFrame(videoRef.current)
      
      // Tentar reconhecimento avançado
      const result = await AdvancedBarcodeService.recognizeBarcode(canvas, {
        useQuagga: true,
        useGoogleVision: false, // Desabilitado por enquanto (requer API key)
        minConfidence: 0.6
      })

      if (result && isValidISBNFormat(result.text)) {
        console.log('Código reconhecido (avançado):', result.text, 'Método:', result.method)
        setRecognitionMethod(result.method)
        setRecognitionConfidence(result.confidence)
        toast.success(`ISBN escaneado com sucesso! (${result.method})`)
        onScan(result.text)
        stopScanner()
      } else {
        console.log('Reconhecimento avançado falhou')
        toast.error('Não foi possível reconhecer o código de barras')
      }
    } catch (error) {
      console.error('Erro no reconhecimento avançado:', error)
      toast.error('Erro no reconhecimento avançado')
    }
  }

  const toggleAdvancedRecognition = () => {
    setUseAdvancedRecognition(!useAdvancedRecognition)
    toast.success(
      useAdvancedRecognition 
        ? 'Reconhecimento básico ativado' 
        : 'Reconhecimento avançado ativado'
    )
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black ${isMobile ? 'bg-opacity-90' : 'bg-opacity-50'} flex items-center justify-center z-50 ${isMobile ? 'p-0' : 'p-4'}`}>
      <Card className={`w-full ${isMobile ? 'h-full max-w-none rounded-none' : 'max-w-2xl'}`}>
        <CardHeader className={isMobile ? 'bg-black text-white' : ''}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear Código de Barras
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={useAdvancedRecognition ? "default" : "outline"}
                size="sm"
                onClick={toggleAdvancedRecognition}
                className="p-2"
                title={useAdvancedRecognition ? "Reconhecimento Avançado Ativo" : "Ativar Reconhecimento Avançado"}
              >
                <Zap className="h-4 w-4" />
              </Button>
              {isMobile && availableCameras.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  className="p-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`space-y-4 ${isMobile ? 'p-0 flex-1' : ''}`}>
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
              <div className={`relative ${isMobile ? 'flex-1' : ''}`}>
                <video
                  ref={videoRef}
                  className={`w-full ${isMobile ? 'h-full' : 'h-64'} bg-gray-100 ${isMobile ? 'object-cover' : 'rounded-lg object-cover'}`}
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Overlay de escaneamento para mobile */}
                {isMobile && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Moldura de escaneamento melhorada */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-72 h-40 border-2 border-white border-opacity-60 rounded-lg bg-black bg-opacity-10">
                        {/* Cantos destacados */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                        
                        {/* Linha central para guia */}
                        <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-green-400 bg-opacity-50"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-lg p-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Escaneando...</span>
                    </div>
                  </div>
                )}
                
                {/* Controles mobile */}
                {isMobile && !error && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFlashlight}
                      className="bg-black bg-opacity-70 text-white border-white hover:bg-opacity-90"
                    >
                      {flashlightOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
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
              
              {!isMobile && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Posicione o código de barras do livro dentro da área de escaneamento
                  </p>
                  <p className="text-xs text-gray-500">
                    O scanner detectará automaticamente códigos ISBN válidos
                  </p>
                  {useAdvancedRecognition && (
                    <p className="text-green-600 text-xs bg-green-50 px-3 py-1 rounded-lg">
                      ⚡ Reconhecimento Avançado Ativo - Melhor para códigos danificados
                    </p>
                  )}
                </div>
              )}
              
              {isMobile && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-70 px-4 py-2 rounded-lg backdrop-blur-sm">
                    Posicione o código de barras dentro da moldura
                  </p>
                  {useAdvancedRecognition && (
                    <p className="text-green-400 text-xs bg-black bg-opacity-70 px-3 py-1 rounded-lg mt-2">
                      ⚡ Reconhecimento Avançado Ativo
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          
          {!isMobile && (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
