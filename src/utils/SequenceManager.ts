import { DocumentEngine } from "./DocumentEngine";
import { api } from "../services/api";

export class SequenceManager {

    /**
     * Atomically gets the next number for a document type.
     * Increments the counter PERMANENTLY in the DB.
     * Use this only when actually saving/generating a final document.
     */
    static async getNextNumber(type: 'invoice' | 'quotation' | 'proforma'): Promise<string> {
        const res = await api.sequences.next(type);
        // Use backend formatted string if available, otherwise fallback to frontend logic
        return res.number || DocumentEngine.formatDocumentNumber(type, res.value);
    }

    /**
     * Peeks at what the next number WILL be without incrementing.
     * Useful for "New Quote #..." preview.
     */
    static async peekNextNumber(type: 'invoice' | 'quotation' | 'proforma'): Promise<string> {
        const res = await api.sequences.peek(type);
        return res.number || DocumentEngine.formatDocumentNumber(type, res.value);
    }
}
