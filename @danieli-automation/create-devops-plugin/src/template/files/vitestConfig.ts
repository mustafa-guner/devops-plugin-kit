/**
 * Generates the vitest.config.ts template entry.
 */
export function vitestConfigFile(): [string, string] {
  return [
    "vitest.config.ts",
    `import path from "node:path";
     import { defineConfig } from "vitest/config";

      export default defineConfig({
        resolve: {
          alias: [
            {
              find: "azure-devops-extension-sdk",
              replacement: path.resolve(__dirname, "src/test/mocks/azure-devops-extension-sdk.ts")
            },
            {
              find: /^azure-devops-extension-api\\/(.*)$/,
              replacement: path.resolve(__dirname, "src/test/mocks/azure-devops-extension-api/$1.ts")
            },
            {
              find: /^azure-devops-extension-api$/,
              replacement: path.resolve(__dirname, "src/test/mocks/azure-devops-extension-api/index.ts")
            },
            { find: /^core\\/(.*)$/, replacement: path.resolve(__dirname, "src/core/$1") },
            { find: /^app\\/(.*)$/, replacement: path.resolve(__dirname, "src/app/$1") },
            { find: /^tabs\\/(.*)$/, replacement: path.resolve(__dirname, "src/app/tabs/$1") }
          ]
        },
        test: {
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          globals: true,
          restoreMocks: true,
          clearMocks: true,
          mockReset: true,
          coverage: {
            all: true,
            provider: "v8",
            reporter: ["text", "html", "lcov"],
            reportsDirectory: "./coverage",
            include: ["src/**/*.ts", "src/**/*.tsx"],
            exclude: [
              "**/node_modules/**",
              "**/dist/**",
              "**/coverage/**",
              "**/*.d.ts",
              "src/test/**",
              "src/**/__tests__/**",
              "src/**/__mocks__/**"
            ]
          }
        }
      });
`
  ];
}
