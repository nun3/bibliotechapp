import { BrowserMultiFormatReader } from '@zxing/library'
import Quagga from 'quagga'

export interface BarcodeResult {
  text: string
  format: string
  confidence: number
  method: 'zxing' | 'quagga' | 'google-vision'
}

export interface AdvancedBarcodeOptions {
  useQuagga?: boolean
  useGoogleVision?: boolean
  googleVisionApiKey?: string
  minConfidence?: number
  retryAttempts?: number
}

export class AdvancedBarcodeService {
  private static readonly DEFAULT_OPTIONS: AdvancedBarcodeOptions = {
    useQuagga: true,
    useGoogleVision: false,
    minConfidence: 0.7,
    retryAttempts: 3
  }

  /**
   * Reconhece código de barras usando múltiplos métodos
   */
  static async recognizeBarcode(
    imageData: string | HTMLCanvasElement | HTMLVideoElement,
    options: AdvancedBarcodeOptions = {}
  ): Promise<BarcodeResult | null> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const results: BarcodeResult[] = []

    // Método 1: ZXing (atual)
    try {
      const zxingResult = await this.recognizeWithZXing(imageData)
      if (zxingResult) {
        results.push(zxingResult)
      }
    } catch (error) {
      console.warn('ZXing recognition failed:', error)
    }

    // Método 2: Quagga (para códigos danificados)
    if (opts.useQuagga) {
      try {
        const quaggaResult = await this.recognizeWithQuagga(imageData)
        if (quaggaResult) {
          results.push(quaggaResult)
        }
      } catch (error) {
        console.warn('Quagga recognition failed:', error)
      }
    }

    // Método 3: Google Vision API (para casos complexos)
    if (opts.useGoogleVision && opts.googleVisionApiKey) {
      try {
        const visionResult = await this.recognizeWithGoogleVision(imageData, opts.googleVisionApiKey)
        if (visionResult) {
          results.push(visionResult)
        }
      } catch (error) {
        console.warn('Google Vision recognition failed:', error)
      }
    }

    // Retornar o resultado com maior confiança
    if (results.length === 0) {
      return null
    }

    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    )

    return bestResult.confidence >= opts.minConfidence ? bestResult : null
  }

  /**
   * Reconhecimento com ZXing (método atual)
   */
  private static async recognizeWithZXing(
    imageData: string | HTMLCanvasElement | HTMLVideoElement
  ): Promise<BarcodeResult | null> {
    try {
      const reader = new BrowserMultiFormatReader()
      
      // Configurar hints para melhor detecção
      const hints = new Map()
      hints.set(1, ['EAN_13', 'CODE_128', 'CODE_39', 'EAN_8', 'UPC_A', 'UPC_E'])
      hints.set(2, 1)

      let result
      if (typeof imageData === 'string') {
        // Base64 ou URL
        result = await reader.decodeFromImageUrl(imageData)
      } else if (imageData instanceof HTMLCanvasElement) {
        // Canvas
        result = await reader.decodeFromCanvas(imageData)
      } else if (imageData instanceof HTMLVideoElement) {
        // Video element
        result = await reader.decodeFromVideoElement(imageData)
      } else {
        throw new Error('Unsupported image data type')
      }

      if (result) {
        return {
          text: result.getText(),
          format: result.getBarcodeFormat().toString(),
          confidence: 0.8, // ZXing não fornece confiança, assumimos 0.8
          method: 'zxing'
        }
      }
    } catch (error) {
      console.warn('ZXing recognition error:', error)
    }
    return null
  }

  /**
   * Reconhecimento com Quagga (para códigos danificados)
   */
  private static async recognizeWithQuagga(
    imageData: string | HTMLCanvasElement | HTMLVideoElement
  ): Promise<BarcodeResult | null> {
    return new Promise((resolve) => {
      try {
        // Configurar Quagga
        Quagga.init({
          inputStream: {
            type: 'ImageStream',
            size: 800,
            singleChannel: false
          },
          locator: {
            patchSize: 'medium',
            halfSample: true
          },
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
              'i2of5_reader'
            ]
          },
          locate: true,
          src: typeof imageData === 'string' ? imageData : undefined
        }, (err) => {
          if (err) {
            console.warn('Quagga initialization error:', err)
            resolve(null)
            return
          }

          Quagga.start()
        })

        // Configurar callback de resultado
        Quagga.onDetected((result) => {
          if (result && result.codeResult) {
            const codeResult = result.codeResult
            resolve({
              text: codeResult.code,
              format: codeResult.format,
              confidence: codeResult.decodedCodes ? 
                codeResult.decodedCodes.filter((code: any) => code.error === undefined).length / codeResult.decodedCodes.length : 0.7,
              method: 'quagga'
            })
          } else {
            resolve(null)
          }
        })

        // Timeout após 5 segundos
        setTimeout(() => {
          Quagga.stop()
          resolve(null)
        }, 5000)

      } catch (error) {
        console.warn('Quagga recognition error:', error)
        resolve(null)
      }
    })
  }

  /**
   * Reconhecimento com Google Vision API
   */
  private static async recognizeWithGoogleVision(
    imageData: string | HTMLCanvasElement | HTMLVideoElement,
    apiKey: string
  ): Promise<BarcodeResult | null> {
    try {
      let imageBase64: string

      if (typeof imageData === 'string') {
        // Se já é base64, usar diretamente
        imageBase64 = imageData.includes('data:image') ? 
          imageData.split(',')[1] : imageData
      } else if (imageData instanceof HTMLCanvasElement) {
        // Converter canvas para base64
        imageBase64 = imageData.toDataURL('image/jpeg', 0.8).split(',')[1]
      } else if (imageData instanceof HTMLVideoElement) {
        // Converter video frame para base64
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = imageData.videoWidth
        canvas.height = imageData.videoHeight
        ctx?.drawImage(imageData, 0, 0)
        imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      } else {
        throw new Error('Unsupported image data type for Google Vision')
      }

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageBase64
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 10
                  }
                ]
              }
            ]
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Google Vision API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.responses && data.responses[0] && data.responses[0].textAnnotations) {
        const textAnnotations = data.responses[0].textAnnotations
        
        // Procurar por códigos de barras (ISBN)
        for (const annotation of textAnnotations) {
          const text = annotation.description?.trim()
          if (text && this.isValidISBNFormat(text)) {
            return {
              text: text,
              format: 'ISBN',
              confidence: 0.9, // Google Vision tem alta confiança
              method: 'google-vision'
            }
          }
        }
      }

      return null
    } catch (error) {
      console.warn('Google Vision recognition error:', error)
      return null
    }
  }

  /**
   * Valida se o texto parece com um ISBN
   */
  private static isValidISBNFormat(text: string): boolean {
    const cleanText = text.replace(/[^0-9X]/g, '')
    return cleanText.length === 10 || cleanText.length === 13
  }

  /**
   * Captura frame do vídeo para análise
   */
  static captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    ctx?.drawImage(video, 0, 0)
    
    return canvas
  }

  /**
   * Converte canvas para base64
   */
  static canvasToBase64(canvas: HTMLCanvasElement, quality: number = 0.8): string {
    return canvas.toDataURL('image/jpeg', quality)
  }
}
