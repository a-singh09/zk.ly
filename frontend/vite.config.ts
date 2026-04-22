import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait()
  ],
  assetsInclude: ['**/*.prover', '**/*.verifier', '**/*.bzkir'],
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  optimizeDeps: {
    include: ['object-inspect']
  },
  build: {
    commonjsOptions: {
      include: [/contracts\/node_modules/, /node_modules/]
    }
  }
});
