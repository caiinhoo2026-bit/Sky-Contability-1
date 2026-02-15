import React from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'w-full px-4 py-2.5 rounded-ios',
                        'bg-surface-light dark:bg-surface-dark',
                        'border border-gray-200 dark:border-gray-700',
                        'text-text-primary-light dark:text-text-primary-dark',
                        'placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark',
                        'focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark',
                        'transition-all duration-200',
                        error && 'border-danger-light dark:border-danger-dark',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-danger-light dark:text-danger-dark">
                        {error}
                    </p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
