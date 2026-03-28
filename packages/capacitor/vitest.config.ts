import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'capacitor',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
