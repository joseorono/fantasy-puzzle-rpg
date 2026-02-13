import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: path.resolve(__dirname, 'electron/main.ts'),
        preload: path.resolve(__dirname, 'electron/preload.ts'),
      },
      formats: ['cjs'],
    },
    outDir: 'dist/main',
    ssr: true,
    rollupOptions: {
      external: ['electron', 'fs', 'path'],
      output: {
        entryFileNames: '[name].cjs',
        format: 'cjs',
      },
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
});

