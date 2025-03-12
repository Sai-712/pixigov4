import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      'lucide-react': 'lucide-react/dist/esm/lucide-react'
    }
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
