import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.{spec.ts,rtl.spec.tsx}'],
    environmentMatchGlobs: [
      ['src/__tests__/**/*.rtl.spec.tsx', 'jsdom'],
    ],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
