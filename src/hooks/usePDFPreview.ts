import { useState } from 'react';
import type { Invoice } from '../types/types';
import { api } from '../services/api';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { useToast } from '../contexts/ToastContext';

export const usePDFPreview = () => {
    const { showToast } = useToast();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const previewPDF = async (id: string, type: string, currency: "Ksh" | "USD" = "Ksh") => {
        setIsLoading(true);
        showToast('info', 'Preparing PDF Preview...');
        try {
            const fullInvoice = await api.invoices.getOne(id);

            if (!fullInvoice) throw new Error('Invoice not found');
            if (!fullInvoice.items) fullInvoice.items = [];

            const docTypeLabel = type === 'quotation' ? 'QUOTATION' : type === 'proforma' ? 'PROFORMA' : 'INVOICE';

            // Cast strictly to match expected types if needed, but generateInvoicePDF handles it
            const url = await generateInvoicePDF(fullInvoice, docTypeLabel as any, { includeDescriptions: true, currency, returnBlob: true });

            if (url && typeof url === 'string') {
                setPreviewUrl(url);
                setPreviewTitle(`${docTypeLabel} ${id}`);
            } else {
                throw new Error('Failed to generate PDF URL');
            }
        } catch (error) {
            console.error(error);
            showToast('error', 'Failed to generate preview');
        } finally {
            setIsLoading(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewTitle('');
    };

    const previewInvoiceData = async (data: any, type: string, options: { includeDescriptions: boolean, currency: "Ksh" | "USD" }) => {
        setIsLoading(true);
        showToast('info', 'Generating Preview...');
        try {
            const docTypeLabel = type === 'quotation' ? 'QUOTATION' : type === 'proforma' ? 'PROFORMA' : 'INVOICE';
            const url = await generateInvoicePDF(data, docTypeLabel as any, {
                includeDescriptions: options.includeDescriptions,
                currency: options.currency,
                returnBlob: true
            });

            if (url && typeof url === 'string') {
                setPreviewUrl(url);
                setPreviewTitle(`${docTypeLabel} PREVIEW`);
            } else {
                throw new Error('Failed to generate PDF URL');
            }
        } catch (error) {
            console.error(error);
            showToast('error', 'Failed to generate preview');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        previewUrl,
        previewTitle,
        isLoading,
        previewPDF,
        previewInvoiceData,
        closePreview
    };
};
