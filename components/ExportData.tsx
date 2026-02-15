'use client'

import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'
import { entregasService } from '@/lib/services/entregas.service'
import { abastecimentosService } from '@/lib/services/abastecimentos.service'
import { manutencoesService } from '@/lib/services/manutencoes.service'

export function ExportData({ userId }: { userId: string }) {
    const exportCSV = async (type: 'entregas' | 'abastecimentos' | 'manutencoes') => {
        try {
            let data: any[] = []
            let filename = ''
            let headers: string[] = []

            if (type === 'entregas') {
                data = await entregasService.getAll(userId)
                filename = `entregas_${new Date().toISOString().split('T')[0]}.csv`
                headers = ['Data', 'Pacotes', 'KM Inicial', 'KM Final', 'KM Total', 'Receita']
            } else if (type === 'abastecimentos') {
                data = await abastecimentosService.getAll(userId)
                filename = `abastecimentos_${new Date().toISOString().split('T')[0]}.csv`
                headers = ['Data', 'Valor Pago']
            } else if (type === 'manutencoes') {
                data = await manutencoesService.getAll(userId)
                filename = `manutencoes_${new Date().toISOString().split('T')[0]}.csv`
                headers = ['Data', 'Tipo', 'Descrição', 'Valor', 'KM Troca', 'Vida Útil KM']
            }

            const csvContent = [
                headers.join(','),
                ...data.map((row: any) => {
                    if (type === 'entregas') {
                        return [row.data, row.quantidade_pacotes, row.km_inicial, row.km_final, row.km_total, row.receita].join(',')
                    } else if (type === 'abastecimentos') {
                        return [row.data, row.valor_pago].join(',')
                    } else if (type === 'manutencoes') {
                        return [row.data, row.tipo, `"${row.descricao || ''}"`, row.valor, row.km_troca, row.vida_util_km].join(',')
                    }
                    return ''
                })
            ].join('\n')

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)
            link.setAttribute('href', url)
            link.setAttribute('download', filename)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            console.error('Erro ao exportar:', err)
            alert('Erro ao exportar dados')
        }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => exportCSV('entregas')} className="flex items-center gap-2">
                <Download size={16} /> Entregas (CSV)
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportCSV('abastecimentos')} className="flex items-center gap-2">
                <Download size={16} /> Abastecimentos (CSV)
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportCSV('manutencoes')} className="flex items-center gap-2">
                <Download size={16} /> Manutenções (CSV)
            </Button>
        </div>
    )
}
