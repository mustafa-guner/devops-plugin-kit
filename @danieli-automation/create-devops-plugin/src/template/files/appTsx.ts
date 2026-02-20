import type { TemplateContext } from "../types.js";
import { escapeForHtml } from "../utils.js";

/**
 * Generates the main React entry component template entry.
 *
 * @param context - template metadata for UI text
 */
export function appTsxFile(context: TemplateContext): [string, string] {
  return [
    "src/app/App.tsx",
    `import React from "react";
     import { createRoot } from "react-dom/client";
     import * as SDK from "azure-devops-extension-sdk";
     import "./styles.css";

    async function bootstrap() {
      SDK.init();
      await SDK.ready();

      const root = document.getElementById("app-root");
      if (!root) {
        throw new Error("Root element not found");
      }

      createRoot(root).render(
        <React.StrictMode>
          <main className="app">
            <h1>${escapeForHtml(context.pluginName)}</h1>
            <p>Your Azure DevOps plugin template is ready.</p>
          </main>
        </React.StrictMode>
      );
    }

bootstrap().catch((error) => {
  console.error("Bootstrap failed", error);
});
`
  ];
}
