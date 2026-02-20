/**
 * Generates the azure-devops-extension-api mock index template entry.
 */
export function apiIndexMockFile(): [string, string] {
  return [
    "src/test/mocks/azure-devops-extension-api/index.ts",
    `export {};
`
  ];
}
