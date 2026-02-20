/**
 * Generates the vitest setup template entry.
 */
export function testSetupFile(): [string, string] {
  return [
    "src/test/setup.ts",
    `import { vi } from "vitest";

    vi.mock("azure-devops-extension-sdk", () => ({
      default: {},
      init: vi.fn(),
      ready: vi.fn().mockResolvedValue(undefined)
    }));
`
  ];
}
