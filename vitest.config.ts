import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.tsx'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // Limit parallelism to prevent OOM kills
    maxConcurrency: 5,
    server: {
      deps: {
        inline: ['@pikoloo/darwin-ui'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      // Mock CSS imports from node_modules
      'react-day-picker/style.css': path.resolve(__dirname, './tests/mocks/empty.css'),
      '@uiw/react-md-editor/markdown-editor.css': path.resolve(__dirname, './tests/mocks/empty.css'),
    },
  },
});
