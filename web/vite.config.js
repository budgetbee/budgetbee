import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths'

export default defineConfig ({

  plugins: [react(), jsconfigPaths()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: 'all',
  },
  preview: {
	port: 3000,
	allowedHosts: 'all',
  },
  css: {
    preprocessorOptions: {
      scss: {
    	additionalData: `@import "src/components/global.scss";`
      }
    }
  }
});