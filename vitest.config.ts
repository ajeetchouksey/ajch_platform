import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    alias: { '@': new URL('./src', import.meta.url).pathname },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/shared/lib/**'],
      exclude: ['src/lib/auth.tsx'],
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
