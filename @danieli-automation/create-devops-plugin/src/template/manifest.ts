import type { TemplateContext } from "./types.js";

/**
 * Creates production and development Azure DevOps manifest objects.
 *
 * @param context - normalized plugin metadata used for manifest generation
 */
export function createManifests(context: TemplateContext) {
  const manifest = {
    manifestVersion: 1,
    id: context.extensionId,
    publisher: context.publisher,
    version: "0.0.1",
    name: context.pluginName,
    description: `${context.pluginName} Azure DevOps extension`,
    public: false,
    targets: [{ id: "Microsoft.VisualStudio.Services" }],
    categories: ["Code"],
    files: [{ path: "dist", addressable: true }],
    contributions: [
      {
        id: `${context.extensionId}-hub`,
        type: "ms.vss-web.hub",
        description: `${context.pluginName} hub`,
        targets: ["ms.vss-code-web.code-hub-group"],
        properties: {
          name: context.pluginName,
          uri: "dist/index.html"
        }
      }
    ]
  };

  const devManifest = {
    ...manifest,
    baseUri: "https://localhost:3000"
  };

  return { manifest, devManifest };
}
