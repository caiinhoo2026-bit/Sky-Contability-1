const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

async function generateReport() {
    try {
        const doc = new jsPDF();
        const artifactDir = 'C:\\Users\\Caiin\\.gemini\\antigravity\\brain\\5ebc22af-2d68-4082-9e68-4da4528730ee';
        const reportPath = path.join(artifactDir, 'relatorio_tecnico.md');
        const outputPath = path.join(artifactDir, 'relatorio_tecnico.pdf');

        if (!fs.existsSync(reportPath)) {
            console.error('Relatório markdown não encontrado em: ' + reportPath);
            return;
        }

        const content = fs.readFileSync(reportPath, 'utf8');
        const lines = content.split('\n');

        // Configuração de Estilo Inicial
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(59, 130, 246); // Azul Sky
        doc.text("SKY-CONTABILITY", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139);
        doc.text("Relatório Técnico de Sistema v1.0", 105, 28, { align: "center" });

        let y = 45;
        doc.setTextColor(30, 41, 59);

        lines.forEach((line) => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }

            if (line.startsWith('# ')) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.setTextColor(30, 41, 59);
                y += 10;
                doc.text(line.replace('# ', '').trim(), 10, y);
                y += 8;
            } else if (line.startsWith('## ')) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(14);
                doc.setTextColor(59, 130, 246);
                y += 8;
                doc.text(line.replace('## ', '').trim(), 10, y);
                y += 6;
            } else if (line.startsWith('### ')) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.setTextColor(30, 41, 59);
                y += 6;
                doc.text(line.replace('### ', '').trim(), 10, y);
                y += 5;
            } else if (line.trim() === '---') {
                doc.setDrawColor(226, 232, 240);
                doc.line(10, y, 200, y);
                y += 6;
            } else if (line.trim() !== '') {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                const text = line.replace(/^\* /, '• ').replace(/\*\*/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
                const wrappedText = doc.splitTextToSize(text, 185);
                doc.text(wrappedText, 10, y);
                y += (wrappedText.length * 5);
            }
        });

        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log('Sucesso: PDF gerado em ' + outputPath);
    } catch (e) {
        console.error('Erro ao gerar PDF:', e);
    }
}

generateReport();
