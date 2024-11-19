import { defineConfig } from 'vite'

export default defineConfig({
  // Add the root directory where index.html is located
  root: 'src',
  publicDir: '../public',
  build: {
    sourcemap: true,
    assetsDir: 'assets',
    cssCodeSplit: true,
    outDir: '../dist',
    emptyOutDir: true,
  },
})