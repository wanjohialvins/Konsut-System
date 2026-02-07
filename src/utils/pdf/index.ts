import { jsPDF } from "jspdf";
import { getCompanySettings, getInvoiceSettings } from "../config";
import { type PdfLayoutConfig, drawWatermark } from "./layout";
import { drawHeader, drawTitleBar, drawDetailsBoxes, drawItemsTable, drawFooterSummary, drawCustomSections, drawSignatures, drawFooter } from "./sections";
import type { Invoice as InvoiceData } from "../../types/types";

export const generateInvoicePDF = async (
    invoice: InvoiceData,
    documentType: "INVOICE" | "QUOTATION" | "PROFORMA" = "INVOICE",
    options: { includeDescriptions?: boolean; currency?: "Ksh" | "USD"; returnBlob?: boolean } = {}
) => {
    try {
        const SETTINGS = getInvoiceSettings();
        const doc = new jsPDF({
            unit: "mm",
            format: SETTINGS.pageSize || "a4",
            orientation: SETTINGS.pageOrientation || "portrait"
        });
        const COMPANY = getCompanySettings();
        const currency = options.currency || "Ksh";
        const rate = invoice.currencyRate || 1;

        // Font Mapping
        const fontMapping: any = { "Helvetica": "helvetica", "Courier New": "courier", "Times New Roman": "times" };
        const font = fontMapping[SETTINGS.fontFamily] || "helvetica";

        const config: PdfLayoutConfig = {
            margin: 15,
            boxGap: 5,
            primaryColor: [0, 153, 255], // Brand Blue
            secondaryColor: [31, 41, 55], // Original Gray
            font,
            pageWidth: doc.internal.pageSize.getWidth(),
            pageHeight: doc.internal.pageSize.getHeight(),
        };

        const formatCurrency = (val: number) => {
            if (val === undefined || val === null || isNaN(val)) return "0.00";
            const amount = currency === "USD" ? val / rate : val;
            return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        if (SETTINGS.includeWatermark) drawWatermark(doc, COMPANY.name, config);

        await drawHeader(doc, COMPANY, SETTINGS, config);

        // Dynamic spacing based on content
        const titleY = config.margin + 30 + 10;
        const typeLabel = documentType === 'INVOICE' ? 'TAX INVOICE' : (documentType === 'QUOTATION' ? 'PRICE QUOTATION' : 'PROFORMA INVOICE');
        drawTitleBar(doc, typeLabel, titleY, config);

        const detailsY = titleY + 12;
        const detailsHeight = drawDetailsBoxes(doc, invoice, documentType, detailsY, SETTINGS, config);

        const tableY = detailsY + detailsHeight + 10;
        const finalTableY = drawItemsTable(doc, invoice, tableY, SETTINGS, config, formatCurrency, options);

        const summaryY = drawFooterSummary(doc, invoice, finalTableY, SETTINGS, config, formatCurrency, currency);
        const customY = drawCustomSections(doc, invoice, summaryY, SETTINGS, config);
        const signatureY = drawSignatures(doc, customY, SETTINGS, config);
        drawFooter(doc, SETTINGS, config);

        const filename = `${documentType}_${invoice.id}.pdf`.replace(/[\\/:*?"<>|]/g, '_');
        if (options.returnBlob) {
            return URL.createObjectURL(doc.output("blob"));
        }
        doc.save(filename);
        return true;
    } catch (err) {
        console.error("PDF generation failed:", err);
        return false;
    }
};
