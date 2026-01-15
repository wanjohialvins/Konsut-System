/**
 * Simple CSV Parser Utility
 */

export const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return [];

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const result = [];

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
        // Handle quotes simply (doesn't handle newlines in quotes, but sufficient for simple data)
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');

        if (row.length === 0) continue;

        const obj: Record<string, string> = {};
        headers.forEach((h, index) => {
            let val = row[index] ? row[index].trim().replace(/^"|"$/g, '') : '';
            // Try convert to number if looks like one
            if (!isNaN(Number(val)) && val !== '') {
                // Keep phone numbers as strings? For stock, they are usually numbers.
                // But for SKU/ID it might be mixed.
                // We'll trust the consumer to cast.
            }
            obj[h] = val;
        });

        result.push(obj);
    }

    return result;
};

export const generateCSV = (data: Record<string, any>[], headers?: string[]): string => {
    if (!data.length) return '';
    const head = headers || Object.keys(data[0]);
    const rows = data.map(obj =>
        head.map(h => {
            const val = obj[h] === undefined || obj[h] === null ? '' : String(obj[h]);
            return `"${val.replace(/"/g, '""')}"`;
        }).join(',')
    );
    return [head.join(','), ...rows].join('\n');
};
