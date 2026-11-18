import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    exclude: [
      'react-native',
      'react-native-web',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-svg',
      'expo',
      'expo-router',
      'expo-updates',
      'expo-constants',
      'expo-font',
      'expo-linking',
      'expo-status-bar',
      'expo-build-properties',
    ],
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'expo': fileURLToPath(new URL('./src/stubs/expo-stub.ts', import.meta.url)),
    },
  },
});
