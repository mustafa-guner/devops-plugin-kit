import path from "node:path";
import { createManifests } from "./template/manifest.js";
import { runNpmInstall } from "./template/npm.js";
import { createTemplateFiles } from "./template/files/index.js";
import { copyStaticFolder, ensureOutputDir, writeFiles } from "./template/fs.js";
import { normalizeId } from "./template/utils.js";
import type { CreatePluginTemplateInput } from "./template/types.js";

export type { CreatePluginTemplateInput } from "./template/types.js";

/**
 * Creates a development-ready Azure DevOps plugin project from templates.
 *
 * @param input - scaffold options for target path, naming, and install behavior
 * @throws Error if directory validation, file generation, or dependency install fails
 */
export async function createPluginTemplate(input: CreatePluginTemplateInput) {
  const context = {
    pluginName: input.pluginName,
    publisher: input.publisher,
    extensionId: normalizeId(input.extensionId ?? input.pluginName)
  };

  const outputDir = path.resolve(input.targetDir, input.pluginName);
  await ensureOutputDir(outputDir, Boolean(input.force));

  const { manifest, devManifest } = createManifests(context);
  const files = createTemplateFiles({ context, manifest, devManifest });
  await writeFiles(outputDir, files);
  await copyStaticFolder(outputDir);

  if (input.installDependencies ?? true) {
    await runNpmInstall(outputDir);
  }

  return outputDir;
}
