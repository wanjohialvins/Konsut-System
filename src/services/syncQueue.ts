// Avoid circular dependency by re-implementing base URL or hardcoding relative path for now
// Ideally, use a context or env var, but this is safe for this project structure
const getBaseUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}/public_html/api`;
};
const API_BASE_URL = getBaseUrl();
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface SyncSchema extends DBSchema {
    queue: {
        key: string;
        value: {
            id: string;
            timestamp: number;
            endpoint: string;
            method: string;
            payload: any;
            retries: number;
        };
        indexes: { 'by-timestamp': number };
    };
}

const DB_NAME = 'konsut_system_sync';
const STORE_NAME = 'queue';

let dbPromise: Promise<IDBPDatabase<SyncSchema>>;

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<SyncSchema>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }
    return dbPromise;
};

export const enqueueOperation = async (endpoint: string, method: string, payload: any) => {
    const db = await getDB();
    await db.add(STORE_NAME, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        endpoint,
        method,
        payload,
        retries: 0
    });
};

export const getQueueCount = async () => {
    const db = await getDB();
    return await db.count(STORE_NAME);
};

export const processQueue = async () => {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('by-timestamp');

    let cursor = await index.openCursor();

    while (cursor) {
        const op = cursor.value;

        try {
            // Re-import api to avoid circular dependency if possible, or use fetch directly
            // Using fetch directly to avoid recursion into api.ts offline logic
            const token = sessionStorage.getItem('konsut_system_auth');
            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            };

            if (token) {
                const user = JSON.parse(token);
                headers['X-User-Id'] = user.id;
                headers['X-User-Role'] = user.role;
                if (user.permissions) {
                    headers['X-User-Permissions'] = JSON.stringify(user.permissions);
                }
            }

            // Construct full URL using constant
            const url = `${API_BASE_URL}/${op.endpoint}`;

            const response = await fetch(url, {
                method: op.method,
                headers,
                body: op.payload ? JSON.stringify(op.payload) : undefined
            });

            if (!response.ok) {
                // If 5xx, maybe retry later. If 4xx, potentially fatal.
                // For now, if it's not a network error, we consider it "processed" but failed?
                // Or we leave it in queue? 
                // Simple strategy: remove if processed (even if failed 400), keep if network error (which fetch throws)
                // fetch only throws on network error.

                if (response.status >= 500) {
                    // Server error, keep in queue? Increment retry?
                    // For MVP, we delete to unblock queue, or log error.
                    console.error(`Sync failed for ${op.endpoint}: ${response.status}`);
                    // Choice: Delete to prevent blocking
                    await cursor.delete();
                } else {
                    // 4xx error (validation etc), delete it
                    await cursor.delete();
                }
            } else {
                // Success
                await cursor.delete();
            }

        } catch (e) {
            console.error("Network error during sync, stopping queue processing", e);
            // Stop processing if net fails again
            return;
        }

        cursor = await cursor.continue();
    }

    await tx.done;
};

// Auto-process on load if online
window.addEventListener('online', () => {
    processQueue();
});

// Also try once on boot
if (navigator.onLine) {
    setTimeout(() => processQueue(), 5000);
}
