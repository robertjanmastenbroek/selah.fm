import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    setupFiles: [],
    envDir: path.resolve(__dirname, '.'),
    env: {
      // Ensure test defaults even if .env.test is missing
      NEXT_PUBLIC_URL: 'http://localhost:3000',
    },
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/*': path.resolve(__dirname, '*'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
