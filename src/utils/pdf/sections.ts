import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { type PdfLayoutConfig, drawBox, loadImageAsDataURL, generateBarcode } from "./layout";
import logo from "../../assets/logo.jpg";

export const drawHeader = async (doc: jsPDF, COMPANY: any, SETTINGS: any, config: PdfLayoutConfig) => {
    const headerY = config.margin;
    if (SETTINGS.includeHeader) {
        const logoInfo = await loadImageAsDataURL(logo);
        if (logoInfo) {
            const maxW = 60;
            const maxH = 35;
            const aspect = logoInfo.width / logoInfo.height;
            let imgW = maxW;
            let imgH = maxW / aspect;
            if (imgH > maxH) { imgH = maxH; imgW = maxH * aspect; }
            doc.addImage(logoInfo.data, "PNG", config.margin, headerY, imgW, imgH);
        }
    }

    if (SETTINGS.includeCompanyDetails) {
        const rightMargin = config.pageWidth - config.margin;
        let y = headerY + 5;
        doc.setFont(config.font, "bold");
        doc.setFontSize(20);
        doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
        doc.text(COMPANY.name, rightMargin, y, { align: "right" });
        y += 7;
        doc.setFont(config.font, "normal");
        doc.setFontSize(10);
        doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
        doc.text(COMPANY.address1, rightMargin, y, { align: "right" });
        y += 5;
        doc.text(COMPANY.address2, rightMargin, y, { align: "right" });
        y += 5;
        doc.text(`Phone: ${COMPANY.phone}`, rightMargin, y, { align: "right" });
        y += 5;
        doc.text(`Email: ${COMPANY.email}`, rightMargin, y, { align: "right" });
        y += 5;
        doc.text(`PIN: ${COMPANY.pin}`, rightMargin, y, { align: "right" });
    }
};

export const drawTitleBar = (doc: jsPDF, type: string, y: number, config: PdfLayoutConfig) => {
    doc.setFillColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
    doc.rect(config.margin, y, config.pageWidth - (config.margin * 2), 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(config.font, "bold");
    doc.setFontSize(14);
    doc.text(type, config.pageWidth / 2, y + 7, { align: "center" });
};

export const drawDetailsBoxes = (
    doc: jsPDF,
    invoice: any,
    documentType: string,
    y: number,
    SETTINGS: any,
    config: PdfLayoutConfig
) => {
    const boxWidth = (config.pageWidth - (config.margin * 2) - config.boxGap) / 2;
    const rightBoxX = config.margin + boxWidth + config.boxGap;

    // Billing Height
    let billToLines = 1; // Name
    if (invoice.customer.id) billToLines++;
    if (invoice.customer.phone && SETTINGS.includeClientPhone) billToLines++;
    if (invoice.customer.email && SETTINGS.includeClientEmail) billToLines++;
    if (invoice.customer.kraPin && SETTINGS.includeClientPIN) billToLines++;
    if (invoice.customer.address && SETTINGS.includeClientAddress) {
        const addrLines = doc.splitTextToSize(`Address: ${invoice.customer.address}`, boxWidth - 8);
        billToLines += addrLines.length;
    }
    const billToHeight = 7 + (billToLines * 4) + 4;

    // Details Height
    let detailLines = 2; // ID + Date
    if ((documentType === 'QUOTATION' && invoice.quotationValidUntil) || invoice.dueDate) detailLines++;
    const detailsHeight = 7 + (detailLines * 5) + 4 + 15;

    const maxHeight = Math.max(billToHeight, detailsHeight);

    // Box 1: Bill To
    if (SETTINGS.includeCustomerDetails) {
        drawBox(doc, config.margin, y, boxWidth, maxHeight, config, "Bill To:");
        let ty = y + 12;
        doc.setFont(config.font, "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        if (invoice.customer.id) { doc.text(`Customer ID: ${invoice.customer.id}`, config.margin + 4, ty); ty += 4; }
        doc.text(`Name: ${invoice.customer.name || "N/A"}`, config.margin + 4, ty); ty += 4;
        if (invoice.customer.phone && SETTINGS.includeClientPhone) { doc.text(`Phone: ${invoice.customer.phone}`, config.margin + 4, ty); ty += 4; }
        if (invoice.customer.email && SETTINGS.includeClientEmail) { doc.text(`Email: ${invoice.customer.email}`, config.margin + 4, ty); ty += 4; }
        if (invoice.customer.kraPin && SETTINGS.includeClientPIN) { doc.text(`KRA PIN: ${invoice.customer.kraPin}`, config.margin + 4, ty); ty += 4; }
        if (invoice.customer.address && SETTINGS.includeClientAddress) {
            const addrLines = doc.splitTextToSize(`Address: ${invoice.customer.address}`, boxWidth - 8);
            doc.text(addrLines, config.margin + 4, ty);
        }
    }

    // Box 2: Invoice Details
    const detailsHeader = documentType === 'QUOTATION' ? "Quotation Details:" : (documentType === 'PROFORMA' ? "Proforma Details:" : "Invoice Details:");
    drawBox(doc, rightBoxX, y, boxWidth, maxHeight, config, detailsHeader);

    let dy = y + 12;
    const labelX = rightBoxX + 4;
    const valX = rightBoxX + 45;

    const printRow = (label: string, value: string) => {
        doc.setTextColor(0, 0, 0);
        doc.setFont(config.font, "normal");
        doc.text(label, labelX, dy);
        doc.text(value, valX, dy);
        dy += 5;
    };

    printRow(documentType === 'INVOICE' ? "Invoice No:" : (documentType === 'QUOTATION' ? "Quotation No:" : "Proforma No:"), invoice.id);
    printRow("Issued Date:", invoice.issuedDate || new Date().toISOString().split('T')[0]);
    if (documentType === 'QUOTATION' && invoice.quotationValidUntil) printRow("Valid Until:", invoice.quotationValidUntil);
    else if (invoice.dueDate) printRow("Due Date:", invoice.dueDate);

    if (SETTINGS.includeBarcode) {
        try {
            const barcodeData = generateBarcode(invoice.id);
            const bW = 40, bH = 10;
            if (dy + 2 + bH < y + maxHeight) {
                doc.addImage(barcodeData, "PNG", rightBoxX + (boxWidth - bW) / 2, dy + 2, bW, bH);
            }
        } catch (e) { }
    }

    return maxHeight;
};

export const drawItemsTable = (
    doc: jsPDF,
    invoice: any,
    startY: number,
    SETTINGS: any,
    config: PdfLayoutConfig,
    formatCurrency: (v: number) => string,
    options: any
) => {
    const tableHeader = ["Description", "Qty", "Unit Price", "Total"];
    const tableBody = invoice.items.map((l: any) => [
        options.includeDescriptions && l.description ? `${l.name}\n${l.description}` : l.name,
        String(l.quantity),
        formatCurrency(l.unitPrice),
        formatCurrency(l.unitPrice * l.quantity),
    ]);

    autoTable(doc, {
        startY,
        head: [tableHeader],
        body: tableBody,
        theme: "grid",
        styles: { fontSize: SETTINGS.fontSize || 9, cellPadding: 3, font: config.font, textColor: [0, 0, 0], lineColor: [150, 150, 150], lineWidth: 0.1 },
        headStyles: { fillColor: config.primaryColor, textColor: 255, fontStyle: "bold", halign: "center" },
        columnStyles: { 0: { halign: "left" }, 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: config.margin, right: config.margin },
    });

    return (doc as any).lastAutoTable?.finalY || startY + 20;
};

export const drawFooterSummary = (
    doc: jsPDF,
    invoice: any,
    finalY: number,
    SETTINGS: any,
    config: PdfLayoutConfig,
    formatCurrency: (v: number) => string,
    currency: string
) => {
    const boxWidth = (config.pageWidth - (config.margin * 2) - config.boxGap) / 2;
    const rightBoxX = config.margin + boxWidth + config.boxGap;
    const footerTopY = finalY + 10;

    const bankDetails = [
        "Bank: I&M BANK",
        "Branch: RUIRU BRANCH",
        `Account No (KSH): 05507023236350`,
        `Account No (USD): 05507023231250`,
        "SWIFT CODE: IMBLKENA",
        "BANK CODE: 57 | BRANCH CODE: 055"
    ];
    const paymentHeight = 7 + (bankDetails.length * 4) + 4;
    const summaryHeight = 7 + 6 + 6 + 10 + 4;
    const maxHeight = Math.max(paymentHeight, summaryHeight);

    let topY = footerTopY;
    if (footerTopY + maxHeight > config.pageHeight - config.margin) {
        doc.addPage();
        topY = config.margin;
    }

    if (SETTINGS.includePaymentDetails) {
        drawBox(doc, config.margin, topY, boxWidth, maxHeight, config, "Payment Details");
        let py = topY + 12;
        doc.setFont(config.font, "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        bankDetails.forEach(line => { doc.text(line, config.margin + 4, py); py += 4; });
    }

    drawBox(doc, rightBoxX, topY, boxWidth, maxHeight, config, "Summary");
    let sy = topY + 14;
    const sumLabelX = rightBoxX + 4;
    const sumValX = config.pageWidth - config.margin - 4;

    const vatRate = SETTINGS.taxRate || 0.16;
    const includeTax = SETTINGS.includeTax !== false;
    const subtotal = invoice.subtotal;
    const vatAmount = includeTax ? (invoice.taxAmount || invoice.tax || (subtotal * vatRate)) : 0;
    const finalTotal = invoice.grandTotal || (subtotal + vatAmount);

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Subtotal", sumLabelX, sy);
    doc.text(`${currency} ${formatCurrency(subtotal)}`, sumValX, sy, { align: "right" });
    sy += 6;

    if (includeTax) {
        doc.text(`VAT (${(vatRate * 100).toFixed(0)}%)`, sumLabelX, sy);
        doc.text(`${currency} ${formatCurrency(vatAmount)}`, sumValX, sy, { align: "right" });
        sy += 6;
    }

    doc.setFillColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
    doc.rect(rightBoxX, sy - 4, boxWidth, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(config.font, "bold");
    doc.text("Grand Total", sumLabelX, sy + 2);
    doc.text(`${currency} ${formatCurrency(finalTotal)}`, sumValX, sy + 2, { align: "right" });

    return Math.max(sy + 10, topY + maxHeight);
};

export const drawCustomSections = (doc: jsPDF, invoice: any, startY: number, SETTINGS: any, config: PdfLayoutConfig) => {
    let cy = startY + 10;

    const printSection = (title: string, content: string) => {
        if (cy + 20 > config.pageHeight - 20) { doc.addPage(); cy = config.margin; }
        doc.setFont(config.font, "bold");
        doc.setFontSize(10);
        doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
        doc.text(title, config.margin, cy); cy += 5;
        doc.setFont(config.font, "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(content, config.pageWidth - (config.margin * 2));
        doc.text(lines, config.margin, cy);
        cy += (lines.length * 4) + 8;
    };

    if (invoice.clientResponsibilities && SETTINGS.includeClientResponsibilities !== false) {
        printSection("Client Responsibilities", invoice.clientResponsibilities);
    }
    if (invoice.termsAndConditions && SETTINGS.includeTerms) {
        printSection("Terms & Conditions", invoice.termsAndConditions);
    }

    return cy;
};

export const drawSignatures = (doc: jsPDF, y: number, SETTINGS: any, config: PdfLayoutConfig) => {
    if (!SETTINGS.includeSignature) return y;
    let sy = y;
    if (sy + 40 > config.pageHeight - 20) { doc.addPage(); sy = config.margin + 10; }
    else { sy += 10; }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(config.margin, sy + 20, config.margin + 60, sy + 20);
    doc.line(config.pageWidth - config.margin - 60, sy + 20, config.pageWidth - config.margin, sy + 20);

    doc.setFont(config.font, "bold");
    doc.setFontSize(8);
    doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
    doc.text("Authorized Signature", config.margin, sy + 25);
    doc.text("Customer Signature", config.pageWidth - config.margin, sy + 25, { align: "right" });

    return sy + 35;
};

export const drawFooter = (doc: jsPDF, SETTINGS: any, config: PdfLayoutConfig) => {
    if (SETTINGS.includeFooter) {
        const fy = config.pageHeight - 12;
        doc.setFont(config.font, "italic");
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        const text = SETTINGS.footerText || "If you have any questions, contact us: info@konsut.co.ke";
        doc.text(text, config.pageWidth / 2, fy - 5, { align: "center" });
    }

    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pages}`, config.pageWidth - config.margin, config.pageHeight - 5, { align: "right" });
    }
};
