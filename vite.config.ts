import { defineConfig } from 'vite';

export default defineConfig({
  base: '/racegame/',
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
