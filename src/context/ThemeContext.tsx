
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type FontSize = 'sm' | 'base' | 'lg';
const FONT_SIZES: FontSize[] = ['sm', 'base', 'lg'];

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
    resetFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [fontSize, setFontSizeState] = useState<FontSize>('base');

    useEffect(() => {
        // Theme initialization from localStorage or system preference
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (storedTheme) {
            setTheme(storedTheme);
        } else if (prefersDark) {
            setTheme('dark');
        }

        // Font size initialization from localStorage
        const storedFontSize = localStorage.getItem('fontSize') as FontSize | null;
        if (storedFontSize) {
            setFontSizeState(storedFontSize);
        }
    }, []);

    // Effect to apply theme class to <html> element
    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    // Effect to apply root font size for scaling
    useEffect(() => {
        const root = document.documentElement;
        if (fontSize === 'sm') {
            root.style.fontSize = '14px'; // ~87.5%
        } else if (fontSize === 'lg') {
            root.style.fontSize = '18px'; // ~112.5%
        } else { // 'base'
            root.style.fontSize = '16px'; // 100%
        }
    }, [fontSize]);

    const toggleTheme = () => {
        setTheme(prevTheme => {
            const newTheme = prevTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    };

    const setFontSize = (size: FontSize) => {
        localStorage.setItem('fontSize', size);
        setFontSizeState(size);
    };

    const increaseFontSize = () => {
        const currentIndex = FONT_SIZES.indexOf(fontSize);
        if (currentIndex < FONT_SIZES.length - 1) {
            setFontSize(FONT_SIZES[currentIndex + 1]);
        }
    };

    const decreaseFontSize = () => {
        const currentIndex = FONT_SIZES.indexOf(fontSize);
        if (currentIndex > 0) {
            setFontSize(FONT_SIZES[currentIndex - 1]);
        }
    };

    const resetFontSize = () => {
        setFontSize('base');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, fontSize, setFontSize, increaseFontSize, decreaseFontSize, resetFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
