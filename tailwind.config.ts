import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // iOS-like color palette
                background: {
                    light: '#F5F5F7',
                    dark: '#000000',
                },
                surface: {
                    light: '#FFFFFF',
                    dark: '#1C1C1E',
                },
                primary: {
                    light: '#007AFF',
                    dark: '#0A84FF',
                },
                success: {
                    light: '#34C759',
                    dark: '#30D158',
                },
                warning: {
                    light: '#FF9500',
                    dark: '#FF9F0A',
                },
                danger: {
                    light: '#FF3B30',
                    dark: '#FF453A',
                },
                text: {
                    primary: {
                        light: '#1D1D1F',
                        dark: '#F5F5F7',
                    },
                    secondary: {
                        light: '#86868B',
                        dark: '#98989D',
                    },
                },
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'SF Pro Display',
                    'Segoe UI',
                    'Roboto',
                    'sans-serif',
                ],
            },
            borderRadius: {
                'ios': '16px',
            },
            boxShadow: {
                'ios': '0 2px 8px rgba(0, 0, 0, 0.08)',
                'ios-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
            },
            animation: {
                'fade-in': 'fadeIn 200ms ease-in',
                'slide-up': 'slideUp 300ms ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
