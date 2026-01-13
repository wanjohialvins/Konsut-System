// src/utils/config.ts
/**
 * Configuration Utility
 * 
 * Provides centralized access to application settings.
 * Retreives values from localStorage or falls back to hardcoded defaults.
 * Used by 'NewInvoice.tsx' and 'pdfGenerator.ts' to ensure consistency.
 */

export const DEFAULT_COMPANY = {
    name: "KONSUT Ltd",
    address1: "P.O BOX 21162-00100",
    address2: "G.P.O NAIROBI",
    phone: "+254 700 420 897",
    email: "info@konsutltd.co.ke",
    pin: "P052435869T",
    logoPath: "/src/assets/logo.jpg",
};

export const DEFAULT_INVOICE_SETTINGS = {
    numberFormat: "comma",
    dateFormat: "DD/MM/YYYY",
    includeDescriptions: true,
    includeCustomerDetails: true,
    includeClientPhone: true,
    includeClientEmail: true,
    includeClientAddress: true,
    includeClientPIN: true,
    includePaymentDetails: true,
    includeCompanyDetails: true,
    includeTerms: true,
    includeWatermark: true,
    includeBarcode: true,
    includeHeader: true,
    includeFooter: true,
    defaultStatus: "Pending",
    currency: "Ksh",
    currencyRate: 130,
    taxRate: 0.16,
    includeTax: true,
    pageOrientation: "portrait",
    pageSize: "a4",
    fontSize: 10,
    fontFamily: "Helvetica",
    footerText: "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya",
};

export const getCompanySettings = () => {
    try {
        const stored = localStorage.getItem("company");
        const parsed = stored ? JSON.parse(stored) : {};
        return { ...DEFAULT_COMPANY, ...parsed };
    } catch (e) {
        return DEFAULT_COMPANY;
    }
};

export const getInvoiceSettings = () => {
    try {
        const stored = localStorage.getItem("invoiceSettings");
        const parsed = stored ? JSON.parse(stored) : {};
        return { ...DEFAULT_INVOICE_SETTINGS, ...parsed };
    } catch (e) {
        return DEFAULT_INVOICE_SETTINGS;
    }
};

export const getSystemSettings = () => {
    try {
        const stored = localStorage.getItem("systemSettings");
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};
