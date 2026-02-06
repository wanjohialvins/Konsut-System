import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to automatically persist data to localStorage with debouncing.
 * 
 * @param key The localStorage key to use
 * @param data The data object to persist
 * @param delay Debounce delay in milliseconds (default 1000)
 * @param disabled If true, auto-save is paused
 * @returns boolean indicating if a save is pending
 */
export function useAutoSave(key: string, data: any, delay: number = 1000, disabled: boolean = false) {
    const [isSaving, setIsSaving] = useState(false);
    const firstRender = useRef(true);

    useEffect(() => {
        if (disabled) return;

        // Skip the first render to avoid redundant saves on load
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        setIsSaving(true);
        const handler = setTimeout(() => {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                setIsSaving(false);
            } catch (error) {
                console.error('Auto-save failed:', error);
                setIsSaving(false);
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [key, data, delay, disabled]);

    return isSaving;
}
