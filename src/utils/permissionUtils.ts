/**
 * Safely parses permissions from the backend response.
 * Handles:
 * - Arrays (pass through)
 * - JSON strings (parse)
 * - Null/Undefined (empty array)
 * - Invalid formats (empty array + error log)
 */
export const parsePermissions = (perms: unknown): string[] => {
    if (!perms) return [];
    if (Array.isArray(perms)) return perms;
    if (typeof perms === 'object' && perms !== null) return perms as unknown as string[];

    try {
        if (typeof perms === 'string') {
            const trimmed = perms.trim();
            if (trimmed === '') return [];
            // Handle potential double-encoding or non-array JSON
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [];
        }
    } catch (error) {
        console.warn("Failed to parse permissions:", error);
    }

    return [];
};
