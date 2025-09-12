import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield, User, Database } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export function PermissionDiagnostics() {
  const { user } = useAuth()
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    const results: DiagnosticResult[] = []

    try {
      // Teste 1: Verificar autenticação
      if (!user) {
        results.push({
          test: 'Autenticação',
          status: 'error',
          message: 'Usuário não está autenticado'
        })
        setDiagnostics(results)
        setLoading(false)
        return
      }

      results.push({
        test: 'Autenticação',
        status: 'success',
        message: `Usuário autenticado: ${user.email}`,
        details: { userId: user.id }
      })

      // Teste 2: Verificar se usuário existe na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) {
        // Verificar se é erro de recursão
        if (userError.code === '42P17' || userError.message.includes('infinite recursion')) {
          results.push({
            test: 'Usuário na tabela users',
            status: 'error',
            message: '🚨 ERRO CRÍTICO: Recursão infinita detectada nas políticas RLS!',
            details: {
              error: userError,
              solution: 'Execute o script emergency-rls-fix.sql no Supabase'
            }
          })
        } else {
          results.push({
            test: 'Usuário na tabela users',
            status: 'error',
            message: `Usuário não encontrado na tabela users: ${userError.message}`,
            details: userError
          })
        }
      } else {
        results.push({
          test: 'Usuário na tabela users',
          status: 'success',
          message: `Usuário encontrado: ${userData.full_name}`,
          details: userData
        })

        // Teste 3: Verificar se é admin
        if (userData.role !== 'admin') {
          results.push({
            test: 'Permissão de Admin',
            status: 'error',
            message: `Usuário não é administrador. Role atual: ${userData.role}`,
            details: userData
          })
        } else {
          results.push({
            test: 'Permissão de Admin',
            status: 'success',
            message: 'Usuário é administrador',
            details: userData
          })
        }
      }

      // Teste 4: Verificar acesso à tabela books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('id, title')
        .limit(1)

      if (booksError) {
        results.push({
          test: 'Acesso à tabela books',
          status: 'error',
          message: `Erro ao acessar tabela books: ${booksError.message}`,
          details: booksError
        })
      } else {
        results.push({
          test: 'Acesso à tabela books',
          status: 'success',
          message: `Acesso permitido. ${booksData?.length || 0} livros encontrados`,
          details: booksData
        })
      }

      // Teste 5: Verificar acesso à tabela loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('id')
        .limit(1)

      if (loansError) {
        results.push({
          test: 'Acesso à tabela loans',
          status: 'error',
          message: `Erro ao acessar tabela loans: ${loansError.message}`,
          details: loansError
        })
      } else {
        results.push({
          test: 'Acesso à tabela loans',
          status: 'success',
          message: `Acesso permitido. ${loansData?.length || 0} empréstimos encontrados`,
          details: loansData
        })
      }

      // Teste 6: Verificar políticas RLS
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'loans' })
        .limit(1)

      if (policiesError) {
        results.push({
          test: 'Políticas RLS',
          status: 'warning',
          message: `Não foi possível verificar políticas RLS: ${policiesError.message}`,
          details: policiesError
        })
      } else {
        results.push({
          test: 'Políticas RLS',
          status: 'success',
          message: 'Políticas RLS configuradas',
          details: policiesData
        })
      }

      // Teste 7: Teste de criação de empréstimo (simulado)
      if (booksData && booksData.length > 0 && userData && userData.role === 'admin') {
        const { error: testLoanError } = await supabase
          .from('loans')
          .select('id')
          .eq('user_id', user.id)
          .eq('book_id', booksData[0].id)
          .limit(1)

        if (testLoanError && testLoanError.code !== 'PGRST116') {
          results.push({
            test: 'Teste de consulta de empréstimo',
            status: 'error',
            message: `Erro ao consultar empréstimos: ${testLoanError.message}`,
            details: testLoanError
          })
        } else {
          results.push({
            test: 'Teste de consulta de empréstimo',
            status: 'success',
            message: 'Consulta de empréstimos funcionando',
            details: testLoanError
          })
        }
      }

    } catch (error) {
      results.push({
        test: 'Erro geral',
        status: 'error',
        message: `Erro inesperado: ${error}`,
        details: error
      })
    }

    setDiagnostics(results)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      case 'warning':
        return <Badge variant="warning">Aviso</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Diagnóstico de Permissões
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testando...' : 'Executar Testes'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {diagnostics.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Clique em "Executar Testes" para iniciar o diagnóstico</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnostics.map((diagnostic, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(diagnostic.status)}
                    <h4 className="font-medium text-gray-900">{diagnostic.test}</h4>
                  </div>
                  {getStatusBadge(diagnostic.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{diagnostic.message}</p>
                {diagnostic.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Ver detalhes
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(diagnostic.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {diagnostics.some(d => d.status === 'error') && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-900 mb-2">⚠️ Ações Necessárias:</h4>
            {diagnostics.some(d => d.message.includes('Recursão infinita')) ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-100 border border-red-300 rounded">
                  <h5 className="font-medium text-red-900 mb-2">🚨 ERRO CRÍTICO DETECTADO:</h5>
                  <p className="text-sm text-red-800 mb-2">
                    As políticas RLS estão causando recursão infinita. Execute IMEDIATAMENTE:
                  </p>
                  <ol className="text-sm text-red-800 space-y-1 ml-4">
                    <li>1. Acesse o Supabase SQL Editor</li>
                    <li>2. Execute o arquivo <code className="bg-red-200 px-1 rounded">emergency-rls-fix.sql</code></li>
                    <li>3. Recarregue esta página</li>
                    <li>4. Execute os testes novamente</li>
                  </ol>
                </div>
              </div>
            ) : (
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Execute o script SQL no Supabase Dashboard</li>
                <li>• Verifique se você tem permissão de administrador</li>
                <li>• Recarregue a página após fazer as correções</li>
                <li>• Consulte o arquivo SUPABASE_SETUP.md para mais detalhes</li>
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
