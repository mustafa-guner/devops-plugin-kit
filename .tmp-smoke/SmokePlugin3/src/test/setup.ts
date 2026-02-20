import { vi } from "vitest";

    vi.mock("azure-devops-extension-sdk", () => ({
      default: {},
      init: vi.fn(),
      ready: vi.fn().mockResolvedValue(undefined)
    }));
