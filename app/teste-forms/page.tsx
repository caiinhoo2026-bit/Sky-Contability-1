'use client'

import { useState } from 'react'
import { EntregaForm } from '@/components/forms/EntregaForm'
import { AbastecimentoForm } from '@/components/forms/AbastecimentoForm'
import { ManutencaoForm } from '@/components/forms/ManutencaoForm'
import { EntregaFormData } from '@/lib/validations/schemas'
import { AbastecimentoFormData } from '@/lib/validations/schemas'
import { ManutencaoFormData } from '@/lib/validations/schemas'

export default function TesteForms() {
    const [activeForm, setActiveForm] = useState<'entrega' | 'abastecimento' | 'manutencao'>('entrega')

    const handleEntregaSubmit = async (data: EntregaFormData) => {
        console.log('Entrega:', data)
        alert('Entrega cadastrada! (Veja o console)')
    }

    const handleAbastecimentoSubmit = async (data: AbastecimentoFormData) => {
        console.log('Abastecimento:', data)
        alert('Abastecimento cadastrado! (Veja o console)')
    }

    const handleManutencaoSubmit = async (data: ManutencaoFormData) => {
        console.log('Manutenção:', data)
        alert('Manutenção cadastrada! (Veja o console)')
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                    Teste de Formulários
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveForm('entrega')}
                        className={`px-4 py-2 rounded-ios transition-all ${activeForm === 'entrega'
                                ? 'bg-primary-light dark:bg-primary-dark text-white'
                                : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark'
                            }`}
                    >
                        Entrega
                    </button>
                    <button
                        onClick={() => setActiveForm('abastecimento')}
                        className={`px-4 py-2 rounded-ios transition-all ${activeForm === 'abastecimento'
                                ? 'bg-warning-light dark:bg-warning-dark text-white'
                                : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark'
                            }`}
                    >
                        Abastecimento
                    </button>
                    <button
                        onClick={() => setActiveForm('manutencao')}
                        className={`px-4 py-2 rounded-ios transition-all ${activeForm === 'manutencao'
                                ? 'bg-success-light dark:bg-success-dark text-white'
                                : 'bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark'
                            }`}
                    >
                        Manutenção
                    </button>
                </div>

                {/* Forms */}
                {activeForm === 'entrega' && <EntregaForm onSubmit={handleEntregaSubmit} />}
                {activeForm === 'abastecimento' && <AbastecimentoForm onSubmit={handleAbastecimentoSubmit} />}
                {activeForm === 'manutencao' && <ManutencaoForm onSubmit={handleManutencaoSubmit} />}
            </div>
        </div>
    )
}
