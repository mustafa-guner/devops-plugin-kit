/**
 * Generates the azure-devops-extension-sdk mock template entry.
 */
export function sdkMockFile(): [string, string] {
  return [
    "src/test/mocks/azure-devops-extension-sdk.ts",
    `export const init = () => undefined;
export const ready = async () => undefined;
`
  ];
}
