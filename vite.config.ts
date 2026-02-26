import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/ui/popup.html'),
        options: resolve(__dirname, 'src/ui/options.html'),
        'content/content': resolve(__dirname, 'src/content/content.ts'),
        'background/serviceWorker': resolve(__dirname, 'src/background/serviceWorker.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
