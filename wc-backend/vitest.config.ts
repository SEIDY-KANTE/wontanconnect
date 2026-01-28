import { defineConfig } from 'vitest/config';

export default defineConfig(() => {
  const isIntegration = process.env.INTEGRATION_TESTS === 'true';

  return {
    test: {
      globals: true,
      environment: 'node',
      include: isIntegration
        ? ['tests/integration/**/*.test.ts']
        : ['src/**/*.test.ts', 'tests/**/*.test.ts'],
      exclude: isIntegration ? [] : ['tests/integration/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'dist/', 'prisma/'],
      },
      setupFiles: ['./tests/setup.ts'],
      testTimeout: 60000,
      hookTimeout: 60000,
      // Run tests sequentially to avoid database conflicts
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
    },
  };
});
