import type { TemplateContext } from "../types.js";
import { escapeForHtml } from "../utils.js";

/**
 * Generates the main application HTML template entry.
 *
 * @param context - template metadata for document title
 */
export function appHtmlFile(context: TemplateContext): [string, string] {
  return [
    "src/app/App.html",
    `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${escapeForHtml(context.pluginName)}</title>
        </head>
        <body>
          <div id="app-root"></div>
        </body>
      </html>
`
  ];
}
