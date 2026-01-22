/* 
 * Utilitário de Exportação para PDF - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:10
 * @version 1.2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Production, Period } from '../types';
import { formatCurrency, formatDate, groupByType, PRODUCTION_TYPES } from './index';

interface ExportPDFOptions {
    period: Period;
    productions: Production[];
    clientName: string;
}

/**
 * Exporta relatório de período para PDF
 */
export function exportPeriodToPDF({ period, productions, clientName }: ExportPDFOptions): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cores do tema
    const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
    const textDark: [number, number, number] = [15, 23, 42]; // slate-900
    const textLight: [number, number, number] = [100, 116, 139]; // slate-500
    const successColor: [number, number, number] = [34, 197, 94]; // green-500

    let yPosition = 20;

    // ===== CABEÇALHO =====
    // Título
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Palma.PSD', 15, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Controle de Produção', 15, 26);

    // Data de geração
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 15, 18, { align: 'right' });
    doc.text('www.starmannweb.com.br', pageWidth - 15, 26, { align: 'right' });

    yPosition = 55;

    // ===== INFO DO RELATÓRIO =====
    doc.setTextColor(...textDark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Fechamento', 15, yPosition);

    yPosition += 12;

    // Info box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(15, yPosition, pageWidth - 30, 35, 3, 3, 'FD');

    doc.setTextColor(...textLight);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Cliente:', 25, yPosition + 12);
    doc.text('Período:', 25, yPosition + 22);
    doc.text('Status:', pageWidth / 2, yPosition + 12);
    doc.text('Total:', pageWidth / 2, yPosition + 22);

    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, 60, yPosition + 12);
    doc.text(period.nome_periodo, 60, yPosition + 22);

    // Status badge
    if (period.status === 'Fechado') {
        doc.setTextColor(220, 38, 38); // red-600
    } else {
        doc.setTextColor(...successColor);
    }
    doc.text(period.status, pageWidth / 2 + 25, yPosition + 12);

    doc.setTextColor(...successColor);
    doc.setFontSize(12);
    doc.text(formatCurrency(period.total_periodo), pageWidth / 2 + 25, yPosition + 22);

    yPosition += 50;

    // ===== RESUMO POR TIPO =====
    const totaisPorTipo = groupByType(productions);
    const tiposComValor = PRODUCTION_TYPES.filter(tipo => totaisPorTipo[tipo] > 0);

    if (tiposComValor.length > 0) {
        doc.setTextColor(...textDark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo por Tipo', 15, yPosition);

        yPosition += 8;

        autoTable(doc, {
            startY: yPosition,
            head: [['Tipo', 'Total']],
            body: tiposComValor.map(tipo => [tipo, formatCurrency(totaisPorTipo[tipo])]),
            foot: [['TOTAL GERAL', formatCurrency(period.total_periodo)]],
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textDark
            },
            footStyles: {
                fillColor: [241, 245, 249], // slate-100
                textColor: successColor,
                fontStyle: 'bold',
                fontSize: 10
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 50, halign: 'right' }
            },
            margin: { left: 15, right: 15 }
        });

        yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    }

    // ===== TABELA DE PRODUÇÕES =====
    doc.setTextColor(...textDark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento das Produções', 15, yPosition);

    yPosition += 8;

    if (productions.length === 0) {
        doc.setTextColor(...textLight);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Nenhuma produção registrada neste período.', 15, yPosition + 10);
    } else {
        autoTable(doc, {
            startY: yPosition,
            head: [['Data', 'Tipo', 'Produção', 'Qtd', 'Valor Unit.', 'Total']],
            body: productions.map(prod => [
                formatDate(prod.data),
                prod.tipo,
                prod.nome_producao.length > 25 ? prod.nome_producao.substring(0, 25) + '...' : prod.nome_producao,
                prod.quantidade.toString(),
                formatCurrency(prod.valor_unitario),
                formatCurrency(prod.total)
            ]),
            theme: 'striped',
            headStyles: {
                fillColor: primaryColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                textColor: textDark
            },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: 28 },
                2: { cellWidth: 65 },
                3: { cellWidth: 15, halign: 'center' },
                4: { cellWidth: 28, halign: 'right' },
                5: { cellWidth: 28, halign: 'right' }
            },
            margin: { left: 15, right: 15 },
            didParseCell: function (data) {
                // Destaca a coluna de total
                if (data.section === 'body' && data.column.index === 5) {
                    data.cell.styles.textColor = successColor;
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
    }

    // ===== RODAPÉ =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(...textLight);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.text(`Palma.PSD - Sistema de Controle de Produção | Desenvolvido por Starmannweb`, 15, footerY);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, footerY, { align: 'right' });
    }

    // Salvar arquivo
    const fileName = `${clientName.replace(/\s+/g, '_')}_${period.nome_periodo.replace(/\//g, '-').replace(/\s+/g, '')}.pdf`;
    doc.save(fileName);
}
