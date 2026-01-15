// src/types/theme.ts

export type ThemeMode = 'light' | 'dark' | 'auto';
export type UiDensity = 'compact' | 'spacious';
export type AccentColor = 'blue' | 'indigo' | 'slate' | 'emerald' | 'rose' | 'electric' | 'sky' | 'ocean' | 'steel';

export interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
    uiDensity: UiDensity;
    setUiDensity: (density: UiDensity) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}
