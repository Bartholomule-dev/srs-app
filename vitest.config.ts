import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    server: {
      deps: {
        inline: ['@pikoloo/darwin-ui'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Mock CSS imports from node_modules
      'react-day-picker/style.css': path.resolve(__dirname, './tests/mocks/empty.css'),
      '@uiw/react-md-editor/markdown-editor.css': path.resolve(__dirname, './tests/mocks/empty.css'),
    },
  },
});
