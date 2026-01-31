import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    title?: string;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({ isOpen, onClose, pdfUrl, title = 'Document Preview' }) => {
    if (!isOpen || !pdfUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white dark:bg-midnight-900 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-midnight-800">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-gray-50/50 dark:bg-midnight-950/50">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
                    <div className="flex items-center gap-3">
                        <a
                            href={pdfUrl}
                            download={`${title.replace(/\s+/g, '_')}.pdf`}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors shadow-lg shadow-brand-500/20"
                        >
                            <FaDownload /> Download
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-midnight-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-200 dark:bg-midnight-950 p-4">
                    <iframe
                        src={pdfUrl}
                        className="w-full h-full rounded-xl shadow-inner border border-gray-300 dark:border-midnight-800 bg-white"
                        title="PDF Preview"
                    />
                </div>
            </div>
        </div>
    );
};

export default PDFPreviewModal;
