/** @type {import('tailwindcss').Config} */

const { nextui } = require("@nextui-org/react");

module.exports = {
    content: [
        "./index.html",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            backgroundColor: {
                primary: "var(--color-primary)",
                secundary: "var(--color-secundary)",
                success: "var(--color-success)",
                danger: "var(--color-danger)",
                default: "var(--color-default)",
                background: "var(--color-background)",
            },
            textColor: {
                "primary-foreground": "var(--text-color-primary)",
            }
        },
    },
    darkMode: "class",
    plugins: [nextui()],
};
