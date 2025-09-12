import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { CheckCircle, XCircle, AlertTriangle, Camera, Shield, Globe } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  icon: React.ReactNode
}

export function CameraDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const results: DiagnosticResult[] = []

    // Teste 1: Suporte a getUserMedia
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
        results.push({
          test: 'Suporte a Câmera',
          status: 'pass',
          message: 'Navegador suporta acesso à câmera',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />
        })
      } else {
        results.push({
          test: 'Suporte a Câmera',
          status: 'fail',
          message: 'Navegador não suporta acesso à câmera',
          icon: <XCircle className="h-5 w-5 text-red-500" />
        })
      }
    } catch (error) {
      results.push({
        test: 'Suporte a Câmera',
        status: 'fail',
        message: 'Erro ao verificar suporte à câmera',
        icon: <XCircle className="h-5 w-5 text-red-500" />
      })
    }

    // Teste 2: HTTPS
    if (location.protocol === 'https:') {
      results.push({
        test: 'Conexão Segura',
        status: 'pass',
        message: 'Conexão HTTPS ativa',
        icon: <Shield className="h-5 w-5 text-green-500" />
      })
    } else if (location.hostname === 'localhost') {
      results.push({
        test: 'Conexão Segura',
        status: 'warning',
        message: 'Localhost (OK para desenvolvimento)',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      })
    } else {
      results.push({
        test: 'Conexão Segura',
        status: 'fail',
        message: 'HTTPS necessário para acesso à câmera',
        icon: <XCircle className="h-5 w-5 text-red-500" />
      })
    }

    // Teste 3: Dispositivos de vídeo
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length > 0) {
        results.push({
          test: 'Câmeras Disponíveis',
          status: 'pass',
          message: `${videoDevices.length} câmera(s) encontrada(s)`,
          icon: <Camera className="h-5 w-5 text-green-500" />
        })
      } else {
        results.push({
          test: 'Câmeras Disponíveis',
          status: 'fail',
          message: 'Nenhuma câmera encontrada',
          icon: <XCircle className="h-5 w-5 text-red-500" />
        })
      }
    } catch (error) {
      results.push({
        test: 'Câmeras Disponíveis',
        status: 'fail',
        message: 'Erro ao listar câmeras',
        icon: <XCircle className="h-5 w-5 text-red-500" />
      })
    }

    // Teste 4: Permissão de câmera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      
      results.push({
        test: 'Permissão de Câmera',
        status: 'pass',
        message: 'Permissão concedida',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      })
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        results.push({
          test: 'Permissão de Câmera',
          status: 'fail',
          message: 'Permissão negada pelo usuário',
          icon: <XCircle className="h-5 w-5 text-red-500" />
        })
      } else if (error.name === 'NotFoundError') {
        results.push({
          test: 'Permissão de Câmera',
          status: 'fail',
          message: 'Nenhuma câmera disponível',
          icon: <XCircle className="h-5 w-5 text-red-500" />
        })
      } else {
        results.push({
          test: 'Permissão de Câmera',
          status: 'fail',
          message: `Erro: ${error.message}`,
          icon: <XCircle className="h-5 w-5 text-red-500" />
        })
      }
    }

    // Teste 5: Navegador
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) {
      results.push({
        test: 'Navegador',
        status: 'pass',
        message: 'Chrome (recomendado)',
        icon: <Globe className="h-5 w-5 text-green-500" />
      })
    } else if (userAgent.includes('Safari')) {
      results.push({
        test: 'Navegador',
        status: 'pass',
        message: 'Safari (compatível)',
        icon: <Globe className="h-5 w-5 text-green-500" />
      })
    } else if (userAgent.includes('Firefox')) {
      results.push({
        test: 'Navegador',
        status: 'warning',
        message: 'Firefox (pode ter limitações)',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      })
    } else {
      results.push({
        test: 'Navegador',
        status: 'warning',
        message: 'Navegador não testado',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      })
    }

    setDiagnostics(results)
    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600'
      case 'fail': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-50 border-green-200'
      case 'fail': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-yellow-50 border-yellow-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Diagnóstico de Câmera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Verificando compatibilidade e configurações da câmera
          </p>
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? 'Verificando...' : 'Executar Diagnóstico'}
          </Button>
        </div>

        <div className="space-y-3">
          {diagnostics.map((diagnostic, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${getStatusBg(diagnostic.status)}`}
            >
              <div className="flex items-center gap-3">
                {diagnostic.icon}
                <div className="flex-1">
                  <h4 className={`font-medium ${getStatusColor(diagnostic.status)}`}>
                    {diagnostic.test}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {diagnostic.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instruções gerais */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Dicas para Resolver Problemas:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use Chrome ou Safari para melhor compatibilidade</li>
            <li>• Certifique-se de que a câmera não está sendo usada por outro app</li>
            <li>• Verifique as permissões de câmera nas configurações do navegador</li>
            <li>• Para produção, use sempre HTTPS</li>
            <li>• Reinicie o navegador se os problemas persistirem</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
