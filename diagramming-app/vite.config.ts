import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['node_modules/zustand', 'node_modules/react', 'node_modules/react-dom'],
  },
})
