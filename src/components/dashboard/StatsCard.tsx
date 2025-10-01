import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="group hover:scale-105 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/80">
          {title}
        </CardTitle>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg blur-sm opacity-60 group-hover:opacity-80 transition-opacity"></div>
          <Icon className="relative h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        {description && (
          <p className="text-xs text-white/60 mb-2">{description}</p>
        )}
        {trend && (
          <div className="flex items-center">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                trend.isPositive 
                  ? 'text-green-300 bg-green-500/20 border border-green-500/30' 
                  : 'text-red-300 bg-red-500/20 border border-red-500/30'
              }`}
            >
              {trend.isPositive ? '↗' : '↘'} {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-white/80 ml-2">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
