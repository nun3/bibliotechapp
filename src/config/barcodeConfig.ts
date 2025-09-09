// Configurações para APIs de reconhecimento de código de barras

export interface BarcodeConfig {
  googleVision: {
    enabled: boolean
    apiKey?: string
    endpoint: string
  }
  aspose: {
    enabled: boolean
    apiKey?: string
    endpoint: string
  }
  quagga: {
    enabled: boolean
    config: {
      inputStream: {
        type: string
        size: number
        singleChannel: boolean
      }
      locator: {
        patchSize: string
        halfSample: boolean
      }
      decoder: {
        readers: string[]
      }
    }
  }
}

export const defaultBarcodeConfig: BarcodeConfig = {
  googleVision: {
    enabled: false, // Desabilitado por padrão (requer API key)
    apiKey: process.env.VITE_GOOGLE_VISION_API_KEY,
    endpoint: 'https://vision.googleapis.com/v1/images:annotate'
  },
  aspose: {
    enabled: false, // Desabilitado por padrão (requer API key)
    apiKey: process.env.VITE_ASPOSE_API_KEY,
    endpoint: 'https://api.aspose.cloud/v3.0/barcode/recognize'
  },
  quagga: {
    enabled: true, // Habilitado por padrão (não requer API key)
    config: {
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
      }
    }
  }
}

// Função para obter configuração baseada no ambiente
export function getBarcodeConfig(): BarcodeConfig {
  return {
    ...defaultBarcodeConfig,
    googleVision: {
      ...defaultBarcodeConfig.googleVision,
      enabled: !!process.env.VITE_GOOGLE_VISION_API_KEY
    },
    aspose: {
      ...defaultBarcodeConfig.aspose,
      enabled: !!process.env.VITE_ASPOSE_API_KEY
    }
  }
}
