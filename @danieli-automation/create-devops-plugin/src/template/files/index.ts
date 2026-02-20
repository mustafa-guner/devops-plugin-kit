import type { TemplateContext } from "../types.js";
import { apiIndexMockFile } from "./apiIndexMock.js";
import { appHtmlFile } from "./appHtml.js";
import { appStylesFile } from "./appStyles.js";
import { appTsxFile } from "./appTsx.js";
import { envExampleFile } from "./envExample.js";
import { gitignoreFile } from "./gitignore.js";
import { packageJsonFile } from "./packageJson.js";
import { readmeFile } from "./readme.js";
import { sdkMockFile } from "./sdkMock.js";
import { testSetupFile } from "./testSetup.js";
import { tsconfigJsonFile } from "./tsconfigJson.js";
import { vitestConfigFile } from "./vitestConfig.js";
import { webpackAppConfigFile } from "./webpackAppConfig.js";
import { webpackCommonConfigFile } from "./webpackCommonConfig.js";
import { webpackConfigFile } from "./webpackConfig.js";
import { webpackExtensionsConfigFile } from "./webpackExtensionsConfig.js";

type Props = {
  context: TemplateContext;
  manifest: Record<string, unknown>;
  devManifest: Record<string, unknown>;
}

/**
 * Builds the full file map for project scaffolding.
 *
 * @param context - template metadata used in generated files
 * @param manifest - production manifest content
 * @param devManifest - development manifest content
 */
export function createTemplateFiles({ context, manifest, devManifest }: Props): Map<string, string> {
  return new Map<string, string>([
    packageJsonFile(context),
    tsconfigJsonFile(),
    webpackConfigFile(),
    webpackCommonConfigFile(),
    webpackAppConfigFile(),
    webpackExtensionsConfigFile(),
    vitestConfigFile(),
    appTsxFile(context),
    appHtmlFile(context),
    appStylesFile(),
    testSetupFile(),
    sdkMockFile(),
    apiIndexMockFile(),
    envExampleFile(),
    ["vss-extension.json", JSON.stringify(manifest, null, 2)],
    ["vss-extension.dev.json", JSON.stringify(devManifest, null, 2)],
    gitignoreFile(),
    readmeFile(context)
  ]);
}
