// Vite 8 + React 19 + Tailwind 4 scaffold (ADR-0004: repo root IS the Vite app).
// Test contract (docs/engine-reference/web/VERSION.md + .claude/rules/test-standards.md):
// vitest must include tests/**/*_test.ts — the default *.test.ts glob misses the
// project's naming convention. CI (.github/workflows/tests.yml) runs
// `pnpm exec vitest run` and uploads test-results/, so the junit reporter
// always writes there.
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    include: ['tests/**/*_test.ts'],
    environment: 'node',
    reporters: ['default', 'junit'],
    outputFile: { junit: 'test-results/junit.xml' },
  },
});
