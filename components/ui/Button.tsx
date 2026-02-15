import React from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    children: React.ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
}: ButtonProps) {
    const baseStyles =
        'inline-flex items-center justify-center rounded-ios font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary:
            'bg-primary-light dark:bg-primary-dark text-white hover:opacity-90 active:opacity-80',
        success:
            'bg-success-light dark:bg-success-dark text-white hover:opacity-90 active:opacity-80',
        warning:
            'bg-warning-light dark:bg-warning-dark text-white hover:opacity-90 active:opacity-80',
        danger:
            'bg-danger-light dark:bg-danger-dark text-white hover:opacity-90 active:opacity-80',
        ghost:
            'bg-transparent text-text-primary-light dark:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800',
        outline:
            'bg-transparent border border-gray-200 dark:border-gray-700 text-text-primary-light dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-900',
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        icon: 'p-2',
    }

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    )
}
