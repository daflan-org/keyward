import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'platform-web',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
