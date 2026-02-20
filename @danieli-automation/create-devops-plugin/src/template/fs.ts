import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Ensures the target output directory exists and respects overwrite rules.
 *
 * @param outputDir - absolute path of the scaffold destination
 * @param force - allows reuse of non-empty target directory when true
 * @throws Error if the target directory is non-empty and force is false
 */
export async function ensureOutputDir(outputDir: string, force: boolean) {
  try {
    const entries = await fs.readdir(outputDir);
    if (entries.length > 0 && !force) {
      throw new Error(`Target directory is not empty: ${outputDir}`);
    }
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code !== "ENOENT") {
      throw error;
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
}

/**
 * Writes all generated template files into the target directory.
 *
 * @param outputDir - absolute project output directory
 * @param files - map of relative file paths and file contents
 * @throws Error if any file or intermediate directory cannot be created
 */
export async function writeFiles(outputDir: string, files: Map<string, string>) {
  await Promise.all(
    Array.from(files.entries()).map(async ([filePath, content]) => {
      const fullPath = path.join(outputDir, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, "utf8");
    })
  );
}

/**
 * Copies the static folder from the template to the target directory. It checks multiple candidate locations for the source static folder to ensure it can be found regardless of how the package is installed or executed.
 *
 * @param targetDir - target directory where the static folder should be copied
 * @throws Error if the static source folder cannot be found in any of the expected locations
 */
export async function copyStaticFolder(targetDir: string) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const sourceStaticDir = await resolveStaticSourceDir(moduleDir);
  const destinationStaticDir = path.join(targetDir, "static");

  await fs.mkdir(destinationStaticDir, { recursive: true });
  await fs.cp(sourceStaticDir, destinationStaticDir, { recursive: true, force: true });
}

/**
 * Resolves the static template source directory from known candidate paths.
 *
 * @param moduleDir - directory of the current module file
 * @throws Error if no candidate static directory exists
 */
async function resolveStaticSourceDir(moduleDir: string) {
  const candidates = [
    path.resolve(moduleDir, "static"),
    path.resolve(process.cwd(), "@danieli-automation/create-devops-plugin/dist/template/static"),
    path.resolve(process.cwd(), "@danieli-automation/create-devops-plugin/src/template/static"),
    path.resolve(process.cwd(), "dist/template/static"),
    path.resolve(process.cwd(), "src/template/static")
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Static template folder not found. Checked: ${candidates.join(", ")}`);
}
