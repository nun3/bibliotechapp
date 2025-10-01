import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { supabase, User } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import { User as UserIcon, Mail, Phone, MapPin, CreditCard, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function Profile() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    fetchUserProfile()
  }, [authUser])

  const fetchUserProfile = async () => {
    try {
      if (!authUser) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error
      setUser(data)
      reset(data)
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      if (!authUser) return

      setSaving(true)
      const { error } = await supabase
        .from('users')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      fetchUserProfile()
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error(error.message || 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
        <p className="text-white/80 mt-2">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Nome Completo"
                  placeholder="Seu nome completo"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                  icon={<UserIcon className="h-4 w-4" />}
                />
                <Input
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  icon={<Mail className="h-4 w-4" />}
                />
                <Input
                  label="Telefone"
                  placeholder="(11) 99999-9999"
                  error={errors.phone?.message}
                  {...register('phone')}
                  icon={<Phone className="h-4 w-4" />}
                />
                <Input
                  label="Endereço"
                  placeholder="Seu endereço completo"
                  error={errors.address?.message}
                  {...register('address')}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <Button type="submit" loading={saving}>
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Library Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Carteirinha da Biblioteca
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg p-6">
                  <div className="text-2xl font-bold text-primary-800 mb-2">
                    {user?.library_card_number}
                  </div>
                  <p className="text-sm text-white/80">Número da Carteirinha</p>
                </div>
                <Badge variant={user?.is_active ? 'success' : 'destructive'}>
                  {user?.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-white/80">Membro desde</p>
                <p className="text-white">
                  {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Última atualização</p>
                <p className="text-white">
                  {user?.updated_at ? formatDate(user.updated_at) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-secondary-600">Empréstimos ativos</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Total de empréstimos</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Livros lidos</span>
                <span className="font-medium">0</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
