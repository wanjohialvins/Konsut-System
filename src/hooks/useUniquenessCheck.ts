import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useUniquenessCheck = (
    endpoint: 'clients' | 'stock',
    field: string,
    value: string,
    currentId?: string
) => {
    const [isUnique, setIsUnique] = useState<boolean>(true);
    const [isChecking, setIsChecking] = useState<boolean>(false);
    const [warning, setWarning] = useState<string | null>(null);

    const checkUniqueness = useCallback(async (val: string) => {
        if (!val || val.trim().length < 3) {
            setIsUnique(true);
            setWarning(null);
            return;
        }

        setIsChecking(true);
        try {
            let match = null;

            if (endpoint === 'clients') {
                const clients = await api.clients.getAll();
                match = clients.find((c: Record<string, any>) =>
                    c[field]?.toString().toLowerCase() === val.toLowerCase() &&
                    c.id !== currentId
                );
            } else if (endpoint === 'stock') {
                const stock = await api.stock.getAll();
                match = stock.find((s: Record<string, any>) =>
                    s[field]?.toString().toLowerCase() === val.toLowerCase() &&
                    s.id !== currentId
                );
            }

            if (match) {
                setIsUnique(false);
                const recordName = (match as Record<string, any>).name || (match as Record<string, any>).username || 'Record';
                setWarning(`Duplicate detected: ${recordName} already uses this ${field}.`);
            } else {
                setIsUnique(true);
                setWarning(null);
            }
        } catch (error) {
            console.error('Uniqueness check failed', error);
        } finally {
            setIsChecking(false);
        }
    }, [endpoint, field, currentId]);

    useEffect(() => {
        const handler = setTimeout(() => {
            checkUniqueness(value);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [value, checkUniqueness]);

    return { isUnique, isChecking, warning };
};
