import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getCompanySettings, getInvoiceSettings } from "../config";
import { type PdfLayoutConfig, drawWatermark, drawBox } from "./layout";
import { drawHeader, drawFooter, drawTitleBar } from "./sections";

export interface ReportData {
    title: string;
    period: string;
    metrics: {
        label: string;
        value: string | number;
        trend?: number;
        type: 'currency' | 'number' | 'percentage';
    }[];
    chartData: any[];
    topClients?: { name: string; revenue: number; count: number }[];
    ledgerData?: any[];
    currency: 'Ksh' | 'USD';
}

export const generateReportPDF = async (data: ReportData) => {
    try {
        const SETTINGS = getInvoiceSettings();
        const doc = new jsPDF({
            unit: "mm",
            format: SETTINGS.pageSize || "a4",
            orientation: SETTINGS.pageOrientation || "portrait"
        });
        const COMPANY = getCompanySettings();

        const fontMapping: any = { "Helvetica": "helvetica", "Courier New": "courier", "Times New Roman": "times" };
        const font = fontMapping[SETTINGS.fontFamily] || "helvetica";

        const config: PdfLayoutConfig = {
            margin: 15,
            boxGap: 5,
            primaryColor: [0, 153, 255], // Brand Blue
            secondaryColor: [31, 41, 55],
            font,
            pageWidth: doc.internal.pageSize.getWidth(),
            pageHeight: doc.internal.pageSize.getHeight(),
        };

        if (SETTINGS.includeWatermark) drawWatermark(doc, COMPANY.name, config);

        // 1. Header
        await drawHeader(doc, COMPANY, SETTINGS, config);

        // 2. Title
        const titleY = config.margin + 35 + 10;
        drawTitleBar(doc, data.title.toUpperCase(), titleY, config);

        // 3. Subtitle (Period)
        doc.setFont(config.font, "bold");
        doc.setFontSize(10);
        doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
        doc.text(`REPORTING PERIOD: ${data.period.toUpperCase()}`, config.margin, titleY + 16);

        // 4. Metrics Grid (2x3 or 3x2)
        const metricsY = titleY + 22;
        const colCount = 3;
        const boxW = (config.pageWidth - (config.margin * 2) - (config.boxGap * (colCount - 1))) / colCount;
        const boxH = 20;

        data.metrics.forEach((m, i) => {
            const row = Math.floor(i / colCount);
            const col = i % colCount;
            const x = config.margin + (col * (boxW + config.boxGap));
            const y = metricsY + (row * (boxH + config.boxGap));

            drawBox(doc, x, y, boxW, boxH, config, m.label);

            doc.setFont(config.font, "bold");
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(String(m.value), x + 4, y + 15);

            if (m.trend !== undefined) {
                doc.setFontSize(8);
                const isPositive = m.trend >= 0;
                doc.setTextColor(isPositive ? [16, 185, 129] as any : [239, 68, 68] as any);
                const trendText = `${isPositive ? '↑' : '↓'} ${Math.abs(m.trend)}%`;
                doc.text(trendText, x + boxW - 4, y + 15, { align: "right" });
            }
        });

        let nextY = metricsY + (Math.ceil(data.metrics.length / colCount) * (boxH + config.boxGap)) + 10;

        // 5. Monthly Revenue Table (if chartData exists)
        if (data.chartData && data.chartData.length > 0) {
            doc.setFont(config.font, "bold");
            doc.setFontSize(11);
            doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
            doc.text("MONTHLY PERFORMANCE OVERVIEW", config.margin, nextY);
            nextY += 5;

            autoTable(doc, {
                startY: nextY,
                head: [["Month", "Revenue Value"]],
                body: data.chartData.map(d => [d.name, `${data.currency} ${d.value.toLocaleString()}`]),
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2, font: config.font },
                headStyles: { fillColor: config.primaryColor, textColor: 255 },
                margin: { left: config.margin, right: config.margin },
            });
            nextY = (doc as any).lastAutoTable.finalY + 15;
        }

        // 6. Top Clients
        if (data.topClients && data.topClients.length > 0) {
            if (nextY + 40 > config.pageHeight - config.margin) { doc.addPage(); nextY = config.margin; }
            doc.setFont(config.font, "bold");
            doc.setFontSize(11);
            doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
            doc.text("TOP VALUED ACCOUNTS", config.margin, nextY);
            nextY += 5;

            autoTable(doc, {
                startY: nextY,
                head: [["Client Entity", "Transaction Count", "Total Revenue"]],
                body: data.topClients.map(c => [c.name, c.count, `${data.currency} ${c.revenue.toLocaleString()}`]),
                theme: "grid",
                styles: { fontSize: 9, cellPadding: 2, font: config.font },
                headStyles: { fillColor: [75, 85, 99], textColor: 255 },
                margin: { left: config.margin, right: config.margin },
            });
            nextY = (doc as any).lastAutoTable.finalY + 15;
        }

        // 7. Ledger Table
        if (data.ledgerData && data.ledgerData.length > 0) {
            if (nextY + 40 > config.pageHeight - config.margin) { doc.addPage(); nextY = config.margin; }
            doc.setFont(config.font, "bold");
            doc.setFontSize(11);
            doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
            doc.text("TRANSACTIONAL LEDGER (DETAILED)", config.margin, nextY);
            nextY += 5;

            autoTable(doc, {
                startY: nextY,
                head: [["ID", "Date", "Entity", "Type", "Amount"]],
                body: data.ledgerData.map(item => [
                    `#${item.id}`,
                    item.date,
                    item.name,
                    item.type.toUpperCase(),
                    `${data.currency} ${item.value.toLocaleString()}`
                ]),
                theme: "striped",
                styles: { fontSize: 8, cellPadding: 2, font: config.font },
                headStyles: { fillColor: [31, 41, 55], textColor: 255 },
                columnStyles: { 4: { halign: 'right' } },
                margin: { left: config.margin, right: config.margin },
            });
        }

        // 8. Footer
        drawFooter(doc, SETTINGS, config);

        const filename = `Financial_Report_${data.period.replace(/ /g, '_')}.pdf`;
        doc.save(filename);
        return true;
    } catch (err) {
        console.error("Report PDF generation failed:", err);
        return false;
    }
};
