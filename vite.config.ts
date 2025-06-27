import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    utils: ['fuse.js'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    server: {
        port: 3000,
        open: true
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
    },
})
