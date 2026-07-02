import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Updated to function-form to comply with Rolldown and Vite 8 requirements
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('matter-js')) {
              return 'physics';
            }
            if (id.includes('@tonconnect/ui-react')) {
              return 'ton';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['matter-js'],
  },
  define: {
    global: 'globalThis',
  },
});