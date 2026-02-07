/**
 * Simple CSV Parser Utility
 */

export const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    // Robust CSV functions
    const parseLine = (line: string) => {
        const row: string[] = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            const next = line[i + 1];
            if (inQuote) {
                if (c === '"' && next === '"') {
                    cur += '"';
                    i++;
                } else if (c === '"') {
                    inQuote = false;
                } else {
                    cur += c;
                }
            } else {
                if (c === '"') {
                    inQuote = true;
                } else if (c === ',') {
                    row.push(cur.trim());
                    cur = '';
                } else {
                    cur += c;
                }
            }
        }
        row.push(cur.trim());
        return row;
    };

    // Parse headers
    const headers = parseLine(lines[0]).map(h => h.toLowerCase());

    const result: Record<string, string>[] = [];

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length === 0 || (row.length === 1 && !row[0])) continue;

        const obj: Record<string, string> = {};
        headers.forEach((h, index) => {
            const val = row[index] || '';
            obj[h] = val;
        });
        result.push(obj);
    }

    return result;
};

export const generateCSV = (data: Record<string, unknown>[], headers?: string[]): string => {
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
