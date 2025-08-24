import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// Production-specific Vite configuration
export default defineConfig({
  plugins: [react()],
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Build configuration for production
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate sourcemaps for debugging (set to false for smaller builds)
    sourcemap: false,
    
    // Minification
    minify: 'esbuild',
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name || '')) {
            return `assets/images/[name]-[hash][extname]`
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          
          if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`
          }
          
          return `assets/[name]-[hash][extname]`
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed file sizes
    reportCompressedSize: true,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Target browsers
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  
  // Preview configuration (for testing production build)
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Environment variables
  envPrefix: 'VITE_',
  
  // Server configuration (for development)
  server: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'react-hook-form',
      'zod',
    ],
    exclude: [
      // Exclude any problematic dependencies
    ],
  },
  
  // CSS configuration
  css: {
    // PostCSS configuration is handled by postcss.config.js
    postcss: {},
    
    // CSS modules configuration
    modules: {
      localsConvention: 'camelCase',
    },
    
    // Preprocessor options
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  
  // Experimental features
  experimental: {
    // Enable build optimizations
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    },
  },
})