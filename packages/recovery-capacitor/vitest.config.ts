import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'recovery-capacitor',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
