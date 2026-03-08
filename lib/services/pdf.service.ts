import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const pdfService = {
    /**
     * Exporta um elemento HTML para PDF mantendo a fidelidade visual.
     * @param elementId ID do elemento HTML a ser capturado.
     * @param fileName Nome do arquivo PDF de saída.
     */
    async exportElementToPDF(elementId: string, fileName: string = 'documento.pdf') {
        const element = document.getElementById(elementId)
        if (!element) {
            console.error(`Elemento com ID "${elementId}" não encontrado.`)
            return
        }

        try {
            // Captura o elemento como um canvas
            const canvas = await html2canvas(element, {
                scale: 2, // Aumenta a qualidade
                useCORS: true,
                logging: false,
                backgroundColor: '#0a0a0a' // Fundo escuro padrão do app
            })

            const imgData = canvas.toDataURL('image/png')

            // PDF em modo retrato (P) ou paisagem (L)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            })

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
            pdf.save(fileName)
        } catch (error) {
            console.error('Erro ao gerar PDF:', error)
            throw error
        }
    }
}
