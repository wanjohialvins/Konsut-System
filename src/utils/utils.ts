
/**
 * Debounce function to limit the rate at which a function can fire.
 */
export function generateIdempotencyKey(): string {
    return 'idempotency-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: Parameters<T>) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Normalizes text to uppercase and trims whitespace.
 */
export const normalizeText = (text: string): string => {
    return text.trim().toUpperCase();
};

/**
 * Trims whitespace from text.
 */
export const trimText = (text: string): string => {
    return text.trim();
};
