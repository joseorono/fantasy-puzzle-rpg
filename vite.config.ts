import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import electron from 'vite-plugin-electron';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron';

  return {
    base: isElectron ? './' : '/',
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      tailwindcss(),
      ...(isElectron
        ? [
            electron([
              {
                entry: 'electron/main.ts',
                onstart(args) {
                  args.startup();
                },
                vite: {
                  build: {
                    outDir: 'dist-electron',
                    rollupOptions: {
                      output: {
                        format: 'es',
                        entryFileNames: 'main.js',
                      },
                    },
                  },
                },
              },
              {
                entry: 'electron/preload.ts',
                onstart(args) {
                  args.reload();
                },
                vite: {
                  build: {
                    outDir: 'dist-electron',
                    rollupOptions: {
                      output: {
                        format: 'cjs',
                        entryFileNames: 'preload.cjs',
                      },
                    },
                  },
                },
              },
            ]),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
        '@': path.resolve(__dirname, './public'),
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
