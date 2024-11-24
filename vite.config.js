import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'pdfjs-dist/build/pdf.worker.js': resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js'),
      'lightgallery': resolve(__dirname, 'node_modules/lightgallery'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['lightgallery', 'lightgallery/react', 'lightgallery/plugins/video', 'lightgallery/plugins/thumbnail'],
  },
});
