import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/integration/setup.js"],
    include: ["tests/integration/**/*.test.js"],
    fileParallelism: false,
    testTimeout: 10000,
    env: {
      NODE_ENV: "test",
    },
  },
});
