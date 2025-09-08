import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface OverdueLoan {
  id: string
  book_title: string
  due_date: string
  days_overdue: number
}

export function LoanNotifications() {
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      checkOverdueLoans()
    }
  }, [user])

  const checkOverdueLoans = async () => {
    try {
      if (!user) return

      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          due_date,
          books!inner (
            title
          )
        `)
        .eq('user_id', user.id)
        .is('return_date', null)
        .lt('due_date', new Date().toISOString())

      if (error) throw error

      const overdue = (data || []).map(loan => {
        const dueDate = new Date(loan.due_date)
        const today = new Date()
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: loan.id,
          book_title: loan.books.title,
          due_date: loan.due_date,
          days_overdue: daysOverdue
        }
      })

      setOverdueLoans(overdue)

      // Mostrar notificação se houver atrasos
      if (overdue.length > 0) {
        toast.error(
          `Você tem ${overdue.length} livro${overdue.length > 1 ? 's' : ''} em atraso!`,
          {
            duration: 5000,
            icon: '⚠️'
          }
        )
      }
    } catch (error) {
      console.error('Erro ao verificar empréstimos em atraso:', error)
    }
  }

  if (overdueLoans.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-red-900">Livros em Atraso</h3>
        </div>
        
        <div className="space-y-2">
          {overdueLoans.map(loan => (
            <div key={loan.id} className="text-sm text-red-800">
              <p className="font-medium">{loan.book_title}</p>
              <p className="text-red-600">
                {loan.days_overdue} dia{loan.days_overdue > 1 ? 's' : ''} de atraso
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-2 border-t border-red-200">
          <p className="text-xs text-red-600">
            Devolva os livros o quanto antes para evitar multas.
          </p>
        </div>
      </div>
    </div>
  )
}

