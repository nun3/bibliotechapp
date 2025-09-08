import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Loan } from '@/lib/supabase'
import { formatDate, isOverdue, getDaysUntilDue } from '@/lib/utils'
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface LoanCardProps {
  loan: Loan
  onReturn?: (loan: Loan) => void
  showActions?: boolean
}

export function LoanCard({ loan, onReturn, showActions = true }: LoanCardProps) {
  const isOverdueLoan = isOverdue(loan.due_date)
  const daysUntilDue = getDaysUntilDue(loan.due_date)

  const getStatusBadge = () => {
    if (loan.status === 'returned') {
      return <Badge variant="success">Devolvido</Badge>
    }
    if (isOverdueLoan) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    return <Badge variant="default">Ativo</Badge>
  }

  const getStatusIcon = () => {
    if (loan.status === 'returned') {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    if (isOverdueLoan) {
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
    if (daysUntilDue <= 3) {
      return <Clock className="h-5 w-5 text-yellow-600" />
    }
    return <Calendar className="h-5 w-5 text-primary-600" />
  }

  const getStatusText = () => {
    if (loan.status === 'returned') {
      return 'Devolvido'
    }
    if (isOverdueLoan) {
      return 'Vencido'
    }
    if (daysUntilDue <= 3) {
      return `Vence em ${daysUntilDue} dia${daysUntilDue !== 1 ? 's' : ''}`
    }
    return `Vence em ${daysUntilDue} dias`
  }

  return (
    <Card className={`${isOverdueLoan ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="font-semibold text-secondary-900 mb-1">
                {loan.book?.title}
              </h3>
              <p className="text-sm text-secondary-600 mb-2">
                {loan.book?.author}
              </p>
              <div className="space-y-1 text-sm text-secondary-500">
                <p>Emprestado em: {formatDate(loan.loan_date)}</p>
                <p>Vencimento: {formatDate(loan.due_date)}</p>
                {loan.return_date && (
                  <p>Devolvido em: {formatDate(loan.return_date)}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge()}
            <p className={`text-sm font-medium ${
              isOverdueLoan ? 'text-red-600' : 
              daysUntilDue <= 3 ? 'text-yellow-600' : 
              'text-secondary-600'
            }`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        
        {showActions && loan.status === 'active' && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <Button
              size="sm"
              variant={isOverdueLoan ? 'destructive' : 'outline'}
              onClick={() => onReturn?.(loan)}
              className="w-full"
            >
              {isOverdueLoan ? 'Devolver (Vencido)' : 'Devolver Livro'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
