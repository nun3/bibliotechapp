// Tipos para BarcodeDetector API nativa
interface BarcodeDetectorResult {
  format: string
  rawValue: string
  boundingBox: DOMRectReadOnly
  cornerPoints: Array<{ x: number; y: number }>
}

interface NativeBarcodeResult {
  text: string
  format: string
  confidence: number
  method: 'native-detector' | 'manual-capture' | 'canvas-analysis'
}

interface NativeBarcodeOptions {
  maxAttempts?: number
  timeout?: number
  useCanvasAnalysis?: boolean
  imageQuality?: number
}

export class NativeBarcodeService {
  private static readonly DEFAULT_OPTIONS: NativeBarcodeOptions = {
    maxAttempts: 3,
    timeout: 5000,
    useCanvasAnalysis: true,
    imageQuality: 0.8
  }

  private static barcodeDetector: any = null
  private static isSupported = false

  /**
   * Verifica se a BarcodeDetector API está disponível
   */
  static async checkSupport(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      // Verificar se a API está disponível
      if ('BarcodeDetector' in window) {
        this.isSupported = true
        this.barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
        })
        return true
      }
    } catch (error) {
      console.warn('BarcodeDetector API não suportada:', error)
    }
    
    this.isSupported = false
    return false
  }

  /**
   * Reconhece código de barras usando a API nativa
   */
  static async recognizeBarcode(
    imageData: string | HTMLCanvasElement | HTMLVideoElement,
    options: NativeBarcodeOptions = {}
  ): Promise<NativeBarcodeResult | null> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    
    // Verificar suporte
    const supported = await this.checkSupport()
    if (!supported) {
      // Fallback para análise de canvas
      if (opts.useCanvasAnalysis) {
        return this.analyzeWithCanvas(imageData, opts)
      }
      return null
    }

    // Tentar com a API nativa
    try {
      const result = await this.recognizeWithNativeAPI(imageData, opts)
      if (result && this.isValidISBNFormat(result.text)) {
        return result
      }
    } catch (error) {
      console.warn('API nativa falhou:', error)
    }

    // Fallback para análise de canvas
    if (opts.useCanvasAnalysis) {
      return this.analyzeWithCanvas(imageData, opts)
    }

    return null
  }

  /**
   * Reconhece usando a API nativa BarcodeDetector
   */
  private static async recognizeWithNativeAPI(
    imageData: string | HTMLCanvasElement | HTMLVideoElement,
    options: NativeBarcodeOptions
  ): Promise<NativeBarcodeResult | null> {
    if (!this.barcodeDetector) return null

    let imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement

    if (typeof imageData === 'string') {
      const img = new Image()
      img.src = imageData
      imageElement = img
    } else {
      imageElement = imageData
    }

    try {
      const results = await this.barcodeDetector.detect(imageElement)
      
      if (results && results.length > 0) {
        const result = results[0] as BarcodeDetectorResult
        return {
          text: result.rawValue,
          format: result.format,
          confidence: 0.9,
          method: 'native-detector'
        }
      }
    } catch (error) {
      console.error('Erro na detecção nativa:', error)
    }

    return null
  }

  /**
   * Análise usando canvas e algoritmos simples
   */
  private static async analyzeWithCanvas(
    imageData: string | HTMLCanvasElement | HTMLVideoElement,
    options: NativeBarcodeOptions
  ): Promise<NativeBarcodeResult | null> {
    try {
      // Criar canvas para análise
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null

      // Configurar canvas
      if (imageData instanceof HTMLCanvasElement) {
        canvas.width = imageData.width
        canvas.height = imageData.height
        ctx.drawImage(imageData, 0, 0)
      } else if (imageData instanceof HTMLVideoElement) {
        canvas.width = imageData.videoWidth
        canvas.height = imageData.videoHeight
        ctx.drawImage(imageData, 0, 0)
      } else if (typeof imageData === 'string') {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = imageData
        })
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
      }

      // Aplicar filtros para melhorar detecção
      const processedCanvas = this.processImageForDetection(canvas)
      
      // Análise simples de padrões (simulação básica)
      const analysisResult = this.simplePatternAnalysis(processedCanvas)
      
      if (analysisResult) {
        return {
          text: analysisResult,
          format: 'ean_13',
          confidence: 0.7,
          method: 'canvas-analysis'
        }
      }

    } catch (error) {
      console.error('Erro na análise de canvas:', error)
    }

    return null
  }

  /**
   * Processa imagem para melhorar detecção
   */
  private static processImageForDetection(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const processedCanvas = document.createElement('canvas')
    const ctx = processedCanvas.getContext('2d')
    
    if (!ctx) return canvas

    processedCanvas.width = canvas.width
    processedCanvas.height = canvas.height
    
    // Desenhar imagem original
    ctx.drawImage(canvas, 0, 0)
    
    // Aplicar filtros de melhoria
    const imageData = ctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      // Converter para escala de cinza
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      
      // Aplicar threshold para binarização
      const threshold = 128
      const binary = gray > threshold ? 255 : 0
      
      data[i] = binary     // R
      data[i + 1] = binary // G
      data[i + 2] = binary // B
      // data[i + 3] mantém o alpha
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    return processedCanvas
  }

  /**
   * Análise simples de padrões (placeholder para detecção básica)
   */
  private static simplePatternAnalysis(canvas: HTMLCanvasElement): string | null {
    // Esta é uma implementação simplificada
    // Em um cenário real, você usaria algoritmos mais sofisticados
    // ou integraria com uma biblioteca de detecção de códigos de barras
    
    try {
      // Análise básica de linhas verticais (simulação)
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Procurar por padrões de código de barras (simulação)
      let patternCount = 0
      for (let x = 0; x < canvas.width; x += 10) {
        let lineCount = 0
        for (let y = 0; y < canvas.height; y++) {
          const index = (y * canvas.width + x) * 4
          if (data[index] < 128) { // Pixel escuro
            lineCount++
          }
        }
        if (lineCount > canvas.height * 0.3) {
          patternCount++
        }
      }
      
      // Se encontrou padrões suficientes, simular um ISBN
      if (patternCount > 5) {
        // Retornar um ISBN de exemplo (em produção, você faria a leitura real)
        return null // Por enquanto, retorna null para forçar entrada manual
      }
      
    } catch (error) {
      console.error('Erro na análise de padrões:', error)
    }
    
    return null
  }

  /**
   * Captura frame do vídeo otimizado
   */
  static captureVideoFrame(video: HTMLVideoElement, quality: number = 0.8): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Usar resolução otimizada
    const scale = Math.min(1, 800 / video.videoWidth)
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale
    
    // Desenhar frame
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    return canvas
  }

  /**
   * Valida se o texto parece com um ISBN
   */
  static isValidISBNFormat(text: string): boolean {
    const cleanText = text.replace(/[^0-9X]/g, '')
    return cleanText.length === 10 || cleanText.length === 13
  }

  /**
   * Inicializa o scanner nativo
   */
  static async initializeNativeScanner(
    videoElement: HTMLVideoElement,
    onDetected: (result: NativeBarcodeResult) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    try {
      // Verificar suporte
      const supported = await this.checkSupport()
      if (!supported) {
        throw new Error('BarcodeDetector API não suportada neste navegador')
      }

      // Configurar stream de vídeo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      videoElement.srcObject = stream
      videoElement.play()

      // Configurar loop de detecção
      const detectLoop = async () => {
        try {
          if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
            const results = await this.recognizeBarcode(videoElement, {
              useCanvasAnalysis: true
            })
            
            if (results && this.isValidISBNFormat(results.text)) {
              onDetected(results)
              return // Parar o loop
            }
          }
          
          // Continuar o loop
          requestAnimationFrame(detectLoop)
        } catch (error) {
          if (onError) onError(error)
        }
      }

      videoElement.addEventListener('loadeddata', detectLoop)
      
      return true
    } catch (error) {
      console.error('Erro ao inicializar scanner nativo:', error)
      if (onError) onError(error)
      return false
    }
  }

  /**
   * Para o scanner nativo
   */
  static stopNativeScanner(videoElement: HTMLVideoElement): void {
    if (videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoElement.srcObject = null
    }
  }
}
