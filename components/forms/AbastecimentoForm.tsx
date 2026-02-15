'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AbastecimentoFormData, abastecimentoSchema } from '@/lib/validations/schemas'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface AbastecimentoFormProps {
    onSubmit: (data: AbastecimentoFormData) => Promise<void>
    onCancel?: () => void
    initialData?: AbastecimentoFormData
}

export function AbastecimentoForm({ onSubmit, onCancel, initialData }: AbastecimentoFormProps) {
    const form = useForm<AbastecimentoFormData>({
        resolver: zodResolver(abastecimentoSchema),
        defaultValues: initialData || {
            data: new Date().toISOString().split('T')[0],
            valor_pago: 0
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

    const handleFormSubmit = async (data: AbastecimentoFormData) => {
        await onSubmit(data)
        reset({
            data: new Date().toISOString().split('T')[0],
            valor_pago: 0
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? 'Editar Abastecimento' : 'Novo Abastecimento'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div>
                        <Input
                            label="Data"
                            type="date"
                            {...register('data')}
                        />
                    </div>

                    <Input
                        label="Valor Gasto (R$)"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register('valor_pago', { valueAsNumber: true })}
                        error={errors.valor_pago?.message}
                    />

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" variant="warning" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Abastecimento'}
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
