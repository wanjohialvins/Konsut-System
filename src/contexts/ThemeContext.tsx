import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';

import type { ThemeMode, UiDensity, AccentColor, ThemeContextType } from "../types/types";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeMode>('light');
    const [uiDensity, setUiDensityState] = useState<UiDensity>('spacious');
    const [accentColor, setAccentColorState] = useState<AccentColor>('electric');

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

                    applyDOMUpdates(prefs.theme || 'light', prefs.accentColor || 'electric', prefs.uiDensity || 'spacious');

                    // Sync to local storage for backup
                    localStorage.setItem('userPreferences', JSON.stringify(prefs));
                    return;
                }
            } catch {
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
                    applyDOMUpdates(prefs.theme || 'light', prefs.accentColor || 'electric', prefs.uiDensity || 'spacious');
                } else {
                    applyDOMUpdates('light', 'electric', 'spacious');
                }
            } catch (err) {
                console.error('Failed to load theme preferences:', err);
                applyDOMUpdates('light', 'electric', 'spacious');
            }
        };

        initTheme();
    }, []);

    const applyDOMUpdates = (themeMode: ThemeMode, color: AccentColor, density: UiDensity) => {
        const root = document.documentElement;

        // Theme
        const isDark = themeMode === 'dark' || (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');

        // Density
        if (density === 'compact') root.classList.add('density-compact');
        else root.classList.remove('density-compact');

        // Accent Color Palettes
        const palettes: Record<AccentColor, Record<string, string>> = {
            blue: {
                primary: '#2563eb',
                50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
                500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
            },
            indigo: {
                primary: '#4f46e5',
                50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
                500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81'
            },
            slate: {
                primary: '#475569',
                50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
                500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a'
            },
            emerald: {
                primary: '#10b981',
                50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
                500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b'
            },
            rose: {
                primary: '#f43f5e',
                50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af', 400: '#fb7185',
                500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239', 900: '#881337'
            },
            ocean: {
                primary: '#0ea5e9',
                50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
                500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e'
            },
            sky: {
                primary: '#0ea5e9',
                50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
                500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e'
            },
            electric: {
                primary: '#2563eb',
                50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
                500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
            },
            steel: {
                primary: '#64748b',
                50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
                500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a'
            },
            purple: {
                primary: '#a855f7',
                50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc',
                500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87'
            },
            green: {
                primary: '#22c55e',
                50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
                500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d'
            },
            orange: {
                primary: '#f97316',
                50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
                500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12'
            },
            red: {
                primary: '#ef4444',
                50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
                500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d'
            }
        };

        const palette = palettes[color] || palettes.blue;
        Object.entries(palette).forEach(([shade, hex]) => {
            root.style.setProperty(`--brand - ${shade} `, hex);
        });
        root.style.setProperty('--brand-primary', palette.primary);
    };

    const savePreferences = (newPrefs: Record<string, any>) => {
        try {
            const stored = localStorage.getItem('userPreferences');
            const current = stored ? JSON.parse(stored) : {};
            localStorage.setItem('userPreferences', JSON.stringify({ ...current, ...newPrefs }));
        } catch (err) {
            console.error('Failed to save preferences:', err);
        }
    };

    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        savePreferences({ theme: newTheme });

        // View Transition API check
        if (!document.startViewTransition) {
            applyDOMUpdates(newTheme, accentColor, uiDensity);
            return;
        }

        const transition = document.startViewTransition(() => {
            applyDOMUpdates(newTheme, accentColor, uiDensity);
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
            applyDOMUpdates(newTheme, accentColor, uiDensity);
        });
    };

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
    };

    const setUiDensity = (density: UiDensity) => {
        setUiDensityState(density);
        savePreferences({ uiDensity: density });
        applyDOMUpdates(theme, accentColor, density);
    };

    const setAccentColor = (color: AccentColor) => {
        setAccentColorState(color);
        savePreferences({ accentColor: color });
        applyDOMUpdates(theme, color, uiDensity);
    };

    // System theme listener
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'auto') {
                applyDOMUpdates('auto', accentColor, uiDensity);
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
