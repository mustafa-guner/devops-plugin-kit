import type { TemplateContext } from "../types.js";

/**
 * Generates the README template entry.
 *
 * @param context - template metadata for project title
 */
export function readmeFile(context: TemplateContext): [string, string] {
  return [
    "README.md",
    `# ${context.pluginName}

## Commands

- \`npm run dev\`: start webpack dev server
- \`npm run build\`: production build to \`dist\`
- \`npm run test\`: run unit tests with vitest
- \`npm run test:watch\`: run tests in watch mode
- \`npm run package\`: build and create VSIX using \`vss-extension.json\`
- \`npm run package:dev\`: create VSIX using \`vss-extension.dev.json\`

## Configuration Layout

- \`webpack.config.cjs\`: webpack entry point
- \`config/webpack/common.cjs\`: shared webpack rules and plugins
- \`config/webpack/app.cjs\`: app bundle configuration
- \`config/webpack/extensions.cjs\`: extensions bundle configuration
- \`vitest.config.ts\`: test and coverage setup
`
  ];
}
