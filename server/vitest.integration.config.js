import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/integration/setup.js"],
    include: ["tests/integration/**/*.test.js"],
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
    },
  },
});