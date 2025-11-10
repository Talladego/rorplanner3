import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group core React libs
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
            // Apollo client & related internals
            if (id.includes('@apollo/client') || id.includes('apollo')) return 'apollo';
            // GraphQL parsing & utilities
            if (id.includes('graphql')) return 'graphql';
            // State management
            if (id.includes('zustand')) return 'state';
            // Tooltip lib
            if (id.includes('react-tooltip')) return 'tooltip';
            return 'vendor';
          }
          // Generated GraphQL documents/types
          if (id.includes('/src/generated/')) return 'generated';
          return undefined;
        },
      },
    },
  },
  base: '/',
})
