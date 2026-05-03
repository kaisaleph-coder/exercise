import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/web/tests/**/*.test.ts"],
    globals: true,
    environment: "node"
  },
  resolve: {
    alias: {
      "@workout/shared": new URL("./packages/shared/src/index.ts", import.meta.url).pathname,
      "@workout/importer": new URL("./packages/importer/src/index.ts", import.meta.url).pathname,
      "@workout/analytics": new URL("./packages/analytics/src/index.ts", import.meta.url).pathname,
      "@workout/progression": new URL("./packages/progression/src/index.ts", import.meta.url).pathname,
      "@workout/sync": new URL("./packages/sync/src/index.ts", import.meta.url).pathname,
      "@workout/export": new URL("./packages/export/src/index.ts", import.meta.url).pathname
    }
  }
});
