import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { type PdfLayoutConfig, drawBox, loadImageAsDataURL, generateBarcode } from "./layout";
import logo from "../../assets/logo.jpg";
import { resolveLogoPath } from "../../services/api";

export const drawHeader = async (doc: jsPDF, COMPANY: any, SETTINGS: any, config: PdfLayoutConfig) => {
    const headerY = config.margin;
    const rightMargin = config.pageWidth - config.margin;

    // 1. Logo Handling (Left Side)
    if (SETTINGS.includeHeader) {
        const logoPath = COMPANY.logo ? resolveLogoPath(COMPANY.logo) : logo;
        const logoInfo = await loadImageAsDataURL(logoPath).catch(() => null);
        
        // Final fallback if the uploaded logo fails to load (e.g. 404 from cPanel server)
        const finalLogoInfo = logoInfo || await loadImageAsDataURL(logo);

        if (finalLogoInfo) {
            const maxW = 55;
            const maxH = 30;
            const aspect = finalLogoInfo.width / finalLogoInfo.height;
            let imgW = maxW;
            let imgH = maxW / aspect;
            if (imgH > maxH) { imgH = maxH; imgW = maxH * aspect; }
            doc.addImage(finalLogoInfo.data, "PNG", config.margin, headerY, imgW, imgH);
        }
    }

    // 2. Company Details (Right Side)
    if (SETTINGS.includeCompanyDetails) {
        let y = headerY + 4;

        // Premium Company Name
        doc.setFont(config.font, "bold");
        doc.setFontSize(18);
        doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
        doc.text(COMPANY.name.toUpperCase(), rightMargin, y, { align: "right" });

        y += 8;
        doc.setFont(config.font, "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);

        // Vertically Stacked Address & Contact Info
        if (COMPANY.address1) { doc.text(COMPANY.address1, rightMargin, y, { align: "right" }); y += 5; }
        if (COMPANY.address2) { doc.text(COMPANY.address2, rightMargin, y, { align: "right" }); y += 5; }

        if (COMPANY.phone) { doc.text(`Phone: ${COMPANY.phone}`, rightMargin, y, { align: "right" }); y += 5; }
        if (COMPANY.email) { doc.text(`Email: ${COMPANY.email}`, rightMargin, y, { align: "right" }); y += 5; }

        if (COMPANY.pin) {
            doc.setFont(config.font, "bold");
            doc.text(`PIN: ${COMPANY.pin}`, rightMargin, y, { align: "right" });
        }
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

    // --- Dynamic Field Hiding & Height Calc ---
    const customerFields = [];
    if (invoice.customer.name) customerFields.push({ label: "Bill To", value: invoice.customer.name, isHeader: true });
    if (invoice.customer.company) customerFields.push({ label: "Company", value: invoice.customer.company });
    if (invoice.customer.phone && SETTINGS.includeClientPhone) customerFields.push({ label: "Phone", value: invoice.customer.phone });
    if (invoice.customer.email && SETTINGS.includeClientEmail) customerFields.push({ label: "Email", value: invoice.customer.email });
    if (invoice.customer.kraPin && SETTINGS.includeClientPIN) customerFields.push({ label: "KRA PIN", value: invoice.customer.kraPin });

    let addrLines: string[] = [];
    if (invoice.customer.address && SETTINGS.includeClientAddress) {
        addrLines = doc.splitTextToSize(invoice.customer.address, boxWidth - 8);
    }

    // Invoice Details
    const detailsFields = [
        { label: documentType === 'INVOICE' ? "Invoice No" : (documentType === 'QUOTATION' ? "Quotation No" : "Proforma No"), value: invoice.id },
        { label: "Date", value: invoice.issuedDate || new Date().toISOString().split('T')[0] }
    ];
    if (documentType === 'QUOTATION' && invoice.quotationValidUntil) detailsFields.push({ label: "Valid Until", value: invoice.quotationValidUntil });
    else if (invoice.dueDate) detailsFields.push({ label: "Due Date", value: invoice.dueDate });

    // Calculate Heights
    const billToHeight = 10 + (customerFields.length * 5) + (addrLines.length * 4) + 5;
    const detailsHeight = 10 + (detailsFields.length * 7) + 15; // + barcode room
    const maxHeight = Math.max(billToHeight, detailsHeight, 40);

    // Box 1: Customer info
    if (SETTINGS.includeCustomerDetails) {
        drawBox(doc, config.margin, y, boxWidth, maxHeight, config, "CLIENT INFORMATION");
        let ty = y + 12;
        customerFields.forEach(f => {
            if (f.isHeader) {
                doc.setFont(config.font, "bold");
                doc.setFontSize(10.5);
                doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
            } else {
                doc.setFont(config.font, "normal");
                doc.setFontSize(9);
                doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
                doc.text(`${f.label}: `, config.margin + 4, ty);
                doc.setTextColor(0, 0, 0);
            }
            doc.text(f.value, config.margin + (f.isHeader ? 4 : 20), ty);
            ty += 5;
        });

        if (addrLines.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
            doc.text("Address: ", config.margin + 4, ty);
            doc.setTextColor(0, 0, 0);
            doc.text(addrLines, config.margin + 20, ty);
        }
    }

    // Box 2: Document Details
    const detailsHeader = `${documentType} DETAILS`;
    drawBox(doc, rightBoxX, y, boxWidth, maxHeight, config, detailsHeader);

    let dy = y + 13;
    detailsFields.forEach(f => {
        doc.setFontSize(9);
        doc.setFont(config.font, "bold");
        doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
        doc.text(f.label, rightBoxX + 4, dy);

        doc.setFont(config.font, "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(f.value, rightBoxX + 40, dy);
        dy += 7;
    });

    if (SETTINGS.includeBarcode) {
        try {
            const barcodeData = generateBarcode(invoice.id);
            const bW = 45, bH = 10;
            const bx = rightBoxX + (boxWidth - bW) / 2;
            const by = y + maxHeight - bH - 4;
            doc.addImage(barcodeData, "PNG", bx, by, bW, bH);
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
    const hasDiscount = invoice.items.some((item: any) => item.discount && item.discount > 0);

    const tableHeader = hasDiscount
        ? ["Description", "Qty", "Unit Price", "Discount", "Total"]
        : ["Description", "Qty", "Unit Price", "Total"];

    const tableBody = invoice.items.map((l: any) => {
        const row = [
            options.includeDescriptions && l.description ? `${l.name}\n${l.description}` : l.name,
            String(l.quantity),
            formatCurrency(l.unitPrice),
        ];

        if (hasDiscount) {
            row.push(l.discount ? formatCurrency(l.discount) : "-");
        }

        row.push(formatCurrency(l.lineTotal || ((l.unitPrice * l.quantity) - (l.discount || 0))));
        return row;
    });

    const columnStyles: any = {
        0: { halign: "left" },
        1: { halign: "center" },
        2: { halign: "right" },
    };

    if (hasDiscount) {
        columnStyles[3] = { halign: "right", textColor: [220, 38, 38] };
        columnStyles[4] = { halign: "right" };
    } else {
        columnStyles[3] = { halign: "right" };
    }

    autoTable(doc, {
        startY,
        head: [tableHeader],
        body: tableBody,
        theme: "striped",
        styles: {
            fontSize: SETTINGS.fontSize || 8.5,
            cellPadding: 4,
            font: config.font,
            textColor: [31, 41, 55], // Slate 800
            lineColor: [226, 232, 240], // Slate 200
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: config.primaryColor,
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
            cellPadding: 5
        },
        columnStyles,
        alternateRowStyles: { fillColor: [248, 250, 255] }, // Very light blue tint matching brand
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

    const bankDetails = (SETTINGS.paymentDetails || "").split("\n").filter((l: string) => l.trim() !== "");
    const paymentHeight = 7 + (bankDetails.length * 4) + 4;
    const summaryHeight = 7 + 6 + 6 + 10 + 4;
    const maxHeight = Math.max(paymentHeight, summaryHeight);

    let topY = footerTopY;
    if (footerTopY + maxHeight > config.pageHeight - config.margin) {
        doc.addPage();
        topY = config.margin;
    }

    if (SETTINGS.includePaymentDetails) {
        drawBox(doc, config.margin, topY, boxWidth, maxHeight, config, "PAYMENT DETAILS");
        let py = topY + 12;
        doc.setFont(config.font, "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        bankDetails.forEach((line: string) => { doc.text(line, config.margin + 4, py); py += 4; });
    }

    drawBox(doc, rightBoxX, topY, boxWidth, maxHeight, config, "SUMMARY");
    let sy = topY + 14;
    const sumLabelX = rightBoxX + 6;
    const sumValX = config.pageWidth - config.margin - 6;

    const vatRate = Number(SETTINGS.taxRate) || 0.16;
    const includeTax = SETTINGS.includeTax !== false;
    const subtotal = Number(invoice.subtotal) || 0;

    // Calculate discount safely
    const totalDiscount = Number(invoice.totalDiscount) || invoice.items.reduce((acc: number, item: any) => {
        const d = Number(item.discount) || 0;
        return acc + d;
    }, 0);

    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const vatAmount = includeTax ? (taxableAmount * vatRate) : 0;
    const finalTotal = taxableAmount + vatAmount;

    doc.setFontSize(9);
    doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
    doc.setFont(config.font, "normal");

    const printSumRow = (label: string, value: string, isRed?: boolean) => {
        if (isRed) {
            doc.setTextColor(220, 38, 38);
        } else {
            doc.setTextColor(config.secondaryColor[0], config.secondaryColor[1], config.secondaryColor[2]);
        }
        doc.text(label, sumLabelX, sy);
        doc.setTextColor(0, 0, 0);
        doc.text(value, sumValX, sy, { align: "right" });
        sy += 6;
    };

    printSumRow("Gross Subtotal", `${currency} ${formatCurrency(subtotal)}`);
    if (totalDiscount > 0) {
        printSumRow("Total Discount", `- ${currency} ${formatCurrency(totalDiscount)}`, true);
    }
    if (includeTax) {
        printSumRow(`VAT (${(vatRate * 100).toFixed(0)}%)`, `${currency} ${formatCurrency(vatAmount)}`);
    }

    // High-impact Grand Total Bar
    sy += 2;
    doc.setFillColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
    doc.rect(rightBoxX, sy - 5, boxWidth, 11, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont(config.font, "bold");
    doc.setFontSize(11);
    doc.text("GRAND TOTAL", sumLabelX, sy + 2);
    doc.text(`${currency} ${formatCurrency(finalTotal)}`, sumValX, sy + 2, { align: "right" });

    return Math.max(sy + 12, topY + maxHeight);
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
