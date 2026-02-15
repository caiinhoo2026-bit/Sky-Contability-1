'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EntregaFormData, entregaSchema } from '@/lib/validations/schemas'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface EntregaFormProps {
    onSubmit: (data: EntregaFormData) => Promise<void>
    onCancel?: () => void
    initialData?: EntregaFormData
}

export function EntregaForm({ onSubmit, onCancel, initialData }: EntregaFormProps) {
    const form = useForm<EntregaFormData>({
        resolver: zodResolver(entregaSchema),
        defaultValues: initialData || {
            data: new Date().toISOString().split('T')[0],
            quantidade_pacotes: 0,
            km_inicial: 0,
            km_final: 0
        }
    })

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = form

    useEffect(() => {
        if (initialData) {
            reset(initialData)
        }
    }, [initialData, reset])

    const handleFormSubmit = async (data: EntregaFormData) => {
        await onSubmit(data)
        reset({
            data: new Date().toISOString().split('T')[0],
            quantidade_pacotes: 0,
            km_inicial: 0,
            km_final: 0
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? 'Editar Entrega' : 'Nova Entrega'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <Input
                        label="Data"
                        type="date"
                        {...register('data')}
                        error={errors.data?.message}
                    />

                    <Input
                        label="Quantidade de Pacotes"
                        type="number"
                        {...register('quantidade_pacotes', { valueAsNumber: true })}
                        error={errors.quantidade_pacotes?.message}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="KM Inicial"
                            type="number"
                            {...register('km_inicial', { valueAsNumber: true })}
                            error={errors.km_inicial?.message}
                        />
                        <Input
                            label="KM Final"
                            type="number"
                            {...register('km_final', { valueAsNumber: true })}
                            error={errors.km_final?.message}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Entrega'}
                        </Button>
                        {onCancel && (
                            <Button type="button" variant="ghost" onClick={onCancel}>
                                Cancelar
                            </Button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
