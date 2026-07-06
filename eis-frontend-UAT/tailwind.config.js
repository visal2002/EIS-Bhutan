/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50:  '#edf7f2',
                    100: '#d9f0e8',
                    200: '#b0e0cf',
                    300: '#7dcaaf',
                    400: '#4aae8e',
                    500: '#2ec982',
                    600: '#1a4a3a',
                    700: '#163e30',
                    800: '#123328',
                    900: '#0e2920',
                    950: '#081510',
                },
                secondary: {
                    50:  '#faf8f2',
                    100: '#f5f0e3',
                    200: '#eaebcb',
                    300: '#dbd6a7',
                    400: '#c5b57f',
                    500: '#a8945b',
                    600: '#8c7746',
                    700: '#705d39',
                    800: '#5e4d32',
                    900: '#4e402c',
                    950: '#2b2216',
                },
                slate: {
                    850: '#1e293b',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}