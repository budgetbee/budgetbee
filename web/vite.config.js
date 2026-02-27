import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import jsconfigPaths from "vite-jsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [tailwindcss(), react(), jsconfigPaths()],
    server: {
        host: true,
        port: 3000,
    },
    preview: {
        port: 3000,
    },
});
