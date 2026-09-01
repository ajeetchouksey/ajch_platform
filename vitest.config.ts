import { defineConfig, mergeConfig, configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // Playwright owns e2e/**/*.spec.ts — exclude it so Vitest doesn't try to
    // execute Playwright tests (test.describe() throws outside the PW runner).
    exclude: [...configDefaults.exclude, 'e2e/**'],
    setupFiles: ['./src/test/setup.ts'],
    alias: { '@': new URL('./src', import.meta.url).pathname },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/shared/lib/**'],
      exclude: ['src/lib/auth.tsx'],   // auth uses browser globals; E2E tests cover it
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
    environmentOptions: {
      jsdom: { url: 'http://localhost:5173' },
    },
  },
}));
