import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Permite que la app funcione tanto en localhost como en GitHub Pages, Vercel o subcarpetas
  server: {
    host: true, // Expone el servidor a la red local (Wi-Fi)
    port: 5174,
  },
})
