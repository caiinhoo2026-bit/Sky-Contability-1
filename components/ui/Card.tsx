import React from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-surface-light dark:bg-surface-dark',
                'rounded-ios shadow-ios',
                'p-6',
                'transition-all duration-200',
                'hover:shadow-ios-lg',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)} {...props}>
            {children}
        </div>
    )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode
}

export function CardTitle({ children, className, ...props }: CardTitleProps) {
    return (
        <h3
            className={cn(
                'text-xl font-semibold',
                'text-text-primary-light dark:text-text-primary-dark',
                className
            )}
            {...props}
        >
            {children}
        </h3>
    )
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode
}

export function CardDescription({
    children,
    className,
    ...props
}: CardDescriptionProps) {
    return (
        <p
            className={cn(
                'text-sm',
                'text-text-secondary-light dark:text-text-secondary-dark',
                className
            )}
            {...props}
        >
            {children}
        </p>
    )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function CardContent({ children, className, ...props }: CardContentProps) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    )
}
