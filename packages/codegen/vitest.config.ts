import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'codegen',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
