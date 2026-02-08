
import { useEffect, useRef } from 'react';

// Check every 60 seconds
const CHECK_INTERVAL = 60 * 1000;

export function useVersionCheck() {
    const localVersion = useRef<string | null>(null);

    useEffect(() => {
        // 1. Fetch initial version on mount
        const fetchVersion = async () => {
            try {
                const res = await fetch('/version.json?t=' + Date.now());
                if (!res.ok) return null;
                const data = await res.json();
                return data.version;
            } catch (error) {
                console.error("Failed to check version:", error);
                return null;
            }
        };

        const init = async () => {
            const version = await fetchVersion();
            if (version) {
                localVersion.current = version;
            }
        };

        init();

        // 2. Poll for updates
        const interval = setInterval(async () => {
            // Don't check if we haven't loaded initial version yet
            if (!localVersion.current) return;

            const serverVersion = await fetchVersion();

            if (serverVersion && serverVersion !== localVersion.current) {
                console.log(`New version detected: ${serverVersion} (Current: ${localVersion.current}). Reloading...`);
                // Optional: Show a toast or snackbar before reloading? 
                // For now, per requirements, we "hard refresh" automatically.
                // We use window.location.reload(true) to force cache bypass where supported, 
                // though modern browsers might ignore the boolean. 
                // The cache busting in index.html is the real key, but a reload fetches that new index.html.
                window.location.reload();
            }
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, []);
}
