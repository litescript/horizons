import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://horizons.litescript.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
