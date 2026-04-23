import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    // Effect/Schema-based libs are sensitive to duplicate installs; dedupe avoids
    // runtime mismatches that manifest as undefined "ctor"/schema failures.
    // Midnight runtime types are also sensitive to duplicate instances (e.g. `ChargedState`
    // instanceof checks). Dedupe ensures all imports share the same class identity.
    dedupe: [
      'effect',
      '@effect/schema',
      '@effect/platform',
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/midnight-js-types',
      '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
    ],
    // Prefer ESM bundles for browser; prevents accidental CJS resolution
    // that can surface as `exports is not defined`.
    mainFields: ['module', 'browser', 'main'],
  },
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
    // Prebundle Midnight libs as ESM so dev runtime doesn't accidentally execute
    // CJS entrypoints (which can manifest as `exports is not defined`).
    include: [
      'object-inspect',
      '@midnight-ntwrk/compact-js',
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
      '@midnight-ntwrk/midnight-js-types',
      '@midnight-ntwrk/midnight-js-utils',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/wallet-sdk-address-format',
      'effect',
      '@effect/platform',
    ],
  },
  build: {
    target: 'es2022',
    commonjsOptions: {
      include: [/contracts\/node_modules/, /node_modules/]
    }
  }
});
