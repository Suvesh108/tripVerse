import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.VITE_GROQ_API_KEY': JSON.stringify(env.VITE_GROQ_API_KEY),
      'process.env.VITE_TAVILY_API_KEY': JSON.stringify(env.VITE_TAVILY_API_KEY),
      'process.env.VITE_EXCHANGERATE_API_KEY': JSON.stringify(env.VITE_EXCHANGERATE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Forward /api/* requests to the Express backend on port 3000
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
