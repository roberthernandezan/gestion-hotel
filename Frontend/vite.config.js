import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000", // Dirección del backend
        changeOrigin: true,
        secure: false, // Desactiva comprobación de HTTPS (solo para desarrollo)
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
