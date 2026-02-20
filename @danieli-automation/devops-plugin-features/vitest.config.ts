import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "azure-devops-extension-api/Work",
        replacement: path.resolve(__dirname, "src/test/mocks/azure-devops-extension-api/Work.ts")
      },
      { find: /^features\/(.*)$/, replacement: path.resolve(__dirname, "src/features/$1") },
      { find: /^core\/(.*)$/, replacement: path.resolve(__dirname, "src/core/$1") },
      { find: /^app\/(.*)$/, replacement: path.resolve(__dirname, "src/app/$1") },
      { find: /^src\/(.*)$/, replacement: path.resolve(__dirname, "src/$1") }
    ]
  },
  test: {
    environment: "node",
    globals: true
  }
});
