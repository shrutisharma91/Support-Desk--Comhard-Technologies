import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    poolOptions: {
      threads: { singleThread: true },
    },
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test-secret-at-least-16-chars',
      JWT_EXPIRES_IN: '8h',
      CORS_ORIGIN: 'http://localhost:3000',
      PORT: '4000',
      NODE_ENV: 'test',
    },
  },
});
