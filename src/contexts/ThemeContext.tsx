import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';

type ThemeMode = 'light' | 'dark' | 'auto';
type UiDensity = 'compact' | 'spacious';
type AccentColor = 'blue' | 'indigo' | 'slate' | 'emerald' | 'rose' | 'electric' | 'sky' | 'ocean' | 'steel';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
    uiDensity: UiDensity;
    setUiDensity: (density: UiDensity) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeMode>('light');
    const [uiDensity, setUiDensityState] = useState<UiDensity>('spacious');
    const [accentColor, setAccentColorState] = useState<AccentColor>('electric');

    // Load initial state
    // Load initial state
    useEffect(() => {
        const initTheme = async () => {
            try {
                // 1. Try to load from backend
                const settings = await api.settings.get();
                if (settings && settings.preferences) {
                    const prefs = settings.preferences;
                    if (prefs.theme) setThemeState(prefs.theme);
                    if (prefs.uiDensity) setUiDensityState(prefs.uiDensity);
                    if (prefs.accentColor) setAccentColorState(prefs.accentColor);

                    applyDOMUpdates(prefs.theme || 'light', prefs.accentColor || 'electric');

                    // Sync to local storage for backup
                    localStorage.setItem('userPreferences', JSON.stringify(prefs));
                    return;
                }
            } catch (e) {
                console.warn('Backend theme sync failed, falling back to local');
            }

            // 2. Fallback to localStorage
            try {
                const stored = localStorage.getItem('userPreferences');
                if (stored) {
                    const prefs = JSON.parse(stored);
                    if (prefs.theme) setThemeState(prefs.theme);
                    if (prefs.uiDensity) setUiDensityState(prefs.uiDensity);
                    if (prefs.accentColor) setAccentColorState(prefs.accentColor);
                    applyDOMUpdates(prefs.theme || 'light', prefs.accentColor || 'electric');
                } else {
                    applyDOMUpdates('light', 'electric');
                }
            } catch (e) {
                console.error('Failed to load theme preferences:', e);
                applyDOMUpdates('light', 'electric');
            }
        };

        initTheme();
    }, []);

    const applyDOMUpdates = (themeMode: ThemeMode, color: string) => {
        const root = document.documentElement;

        // Theme
        const isDark = themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');

        // Accent Color
        const mapping: Record<string, string> = {
            sky: "#0ea5e9",
            ocean: "#1e3a8a",
            electric: "#2563eb",
            steel: "#475569",
            blue: '#2563eb',
            indigo: '#4f46e5',
            slate: '#0f172a',
            emerald: '#10b981',
            rose: '#f43f5e'
        };
        const hex = mapping[color] || "#2563eb";
        root.style.setProperty('--brand-primary', hex);
        root.style.setProperty('--brand-600', hex);
    };

    const savePreferences = (newPrefs: any) => {
        try {
            const stored = localStorage.getItem('userPreferences');
            const current = stored ? JSON.parse(stored) : {};
            localStorage.setItem('userPreferences', JSON.stringify({ ...current, ...newPrefs }));
        } catch (e) {
            console.error('Failed to save preferences:', e);
        }
    };

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        savePreferences({ theme: newTheme });

        // View Transition API check
        if (!document.startViewTransition) {
            applyDOMUpdates(newTheme, accentColor);
            return;
        }

        const transition = document.startViewTransition(() => {
            applyDOMUpdates(newTheme, accentColor);
        });

        transition.ready.then(() => {
            document.documentElement.animate(
                {
                    clipPath: [
                        "inset(0 0 0 100%)",
                        "inset(0 0 0 0)"
                    ],
                },
                {
                    duration: 1500,
                    easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
                    pseudoElement: "::view-transition-new(root)",
                }
            );
        }).catch(() => {
            applyDOMUpdates(newTheme, accentColor);
        });
    };

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
    };

    const setUiDensity = (density: UiDensity) => {
        setUiDensityState(density);
        savePreferences({ uiDensity: density });
        // You would apply density classes here if implemented
    };

    const setAccentColor = (color: AccentColor) => {
        setAccentColorState(color);
        savePreferences({ accentColor: color });
        applyDOMUpdates(theme, color);
    };

    // System theme listener
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (theme === 'auto') {
                applyDOMUpdates('auto', accentColor);
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, accentColor]);

    return (
        <ThemeContext.Provider value={{
            theme,
            setTheme,
            toggleTheme,
            uiDensity,
            setUiDensity,
            accentColor,
            setAccentColor
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
