import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white/90"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-400/50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-300">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-white/60">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'