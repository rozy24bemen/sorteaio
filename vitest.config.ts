import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [],
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", ".next", "dist"],
    // Ensure test isolation by running files sequentially
    // Run tests in a single worker to avoid DB concurrency issues
    pool: "forks",
    maxWorkers: 1,
    minWorkers: 1,
    isolate: true,
    sequence: { concurrent: false },
  // threads option not available in this version; rely on sequence + pool settings
    // Vitest doesn't expose maxThreads/minThreads here; using forks implies non-threaded execution.
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
