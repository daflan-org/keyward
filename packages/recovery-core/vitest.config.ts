import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'recovery-core',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
