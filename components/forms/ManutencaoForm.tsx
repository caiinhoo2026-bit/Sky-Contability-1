'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ManutencaoFormData, manutencaoSchema } from '@/lib/validations/schemas'
import { VIDA_UTIL_PADRAO } from '@/lib/services/manutencoes.service'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils/cn'

interface ManutencaoFormProps {
    onSubmit: (data: ManutencaoFormData) => Promise<void>
    onCancel?: () => void
    initialData?: ManutencaoFormData
}

export function ManutencaoForm({ onSubmit, onCancel, initialData }: ManutencaoFormProps) {
    const form = useForm<ManutencaoFormData>({
        resolver: zodResolver(manutencaoSchema),
        defaultValues: initialData || {
            data: new Date().toISOString().split('T')[0],
            km_troca: 0
        }
    })

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
    } = form

    useEffect(() => {
        if (initialData) {
            reset(initialData)
        }
    }, [initialData, reset])

    const tipoSelecionado = watch('tipo')

    // Atualizar vida útil automaticamente quando tipo mudar
    const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const tipo = e.target.value as keyof typeof VIDA_UTIL_PADRAO
        if (tipo && VIDA_UTIL_PADRAO[tipo]) {
            setValue('vida_util_km', VIDA_UTIL_PADRAO[tipo])
        }
    }

    const handleFormSubmit = async (data: ManutencaoFormData) => {
        await onSubmit(data)
        reset({
            data: new Date().toISOString().split('T')[0],
            km_troca: 0
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? 'Editar Manutenção' : 'Nova Manutenção'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">
                            Tipo de Manutenção
                        </label>
                        <select
                            {...register('tipo')}
                            onChange={(e) => {
                                register('tipo').onChange(e)
                                handleTipoChange(e)
                            }}
                            className={cn(
                                'w-full px-4 py-2.5 rounded-ios',
                                'bg-surface-light dark:bg-surface-dark',
                                'border border-gray-200 dark:border-gray-700',
                                'text-text-primary-light dark:text-text-primary-dark',
                                'focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark',
                                'transition-all duration-200',
                                errors.tipo && 'border-danger-light dark:border-danger-dark'
                            )}
                        >
                            <option value="">Selecione...</option>
                            <option value="oleo">Óleo (1.000 km)</option>
                            <option value="pneus">Pneus (15.000 km)</option>
                            <option value="corrente">Corrente (10.000 km)</option>
                            <option value="pastilhas">Pastilhas de Freio (8.000 km)</option>
                            <option value="outro">Outro</option>
                        </select>
                        {errors.tipo && (
                            <p className="mt-1 text-sm text-danger-light dark:text-danger-dark">
                                {errors.tipo.message}
                            </p>
                        )}
                    </div>

                    {tipoSelecionado === 'oleo' ? (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary-light dark:text-text-primary-dark">
                                Marca do Óleo (20W50)
                            </label>
                            <select
                                {...register('descricao')}
                                className={cn(
                                    'w-full px-4 py-2.5 rounded-ios',
                                    'bg-surface-light dark:bg-surface-dark',
                                    'border border-gray-200 dark:border-gray-700',
                                    'text-text-primary-light dark:text-text-primary-dark',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark',
                                    'transition-all duration-200',
                                    errors.descricao && 'border-danger-light dark:border-danger-dark'
                                )}
                            >
                                <option value="">Selecione a marca...</option>
                                <option value="Yamalube 20W50">Yamalube</option>
                                <option value="Mobil 20W50">Mobil</option>
                                <option value="Castrol 20W50">Castrol</option>
                                <option value="Motul 20W50">Motul</option>
                                <option value="Shell Advance 20W50">Shell</option>
                                <option value="Ipiranga 20W50">Ipiranga</option>
                                <option value="Lubrax 20W50">Lubrax</option>
                                <option value="Havoline 20W50">Havoline</option>
                            </select>
                            {errors.descricao && (
                                <p className="mt-1 text-sm text-danger-light dark:text-danger-dark">
                                    {errors.descricao.message}
                                </p>
                            )}
                        </div>
                    ) : (
                        <Input
                            label="Descrição (opcional)"
                            type="text"
                            placeholder="Ex: Troca de pastilhas de freio"
                            {...register('descricao')}
                            error={errors.descricao?.message}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="Data"
                                type="date"
                                {...register('data')}
                            />
                        </div>

                        <Input
                            label="Valor (R$)"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...register('valor', { valueAsNumber: true })}
                            error={errors.valor?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label="Vida Útil (km)"
                            type="number"
                            {...register('vida_util_km', { valueAsNumber: true })}
                            error={errors.vida_util_km?.message}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" variant="success" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Manutenção'}
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
