import React from "react";
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
            <h1>SmokePluginStatic</h1>
            <p>Your Azure DevOps plugin template is ready.</p>
          </main>
        </React.StrictMode>
      );
    }

bootstrap().catch((error) => {
  console.error("Bootstrap failed", error);
});
