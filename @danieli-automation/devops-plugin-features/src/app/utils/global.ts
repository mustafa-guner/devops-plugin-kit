/**
 * Extracts the first path segment as project name.
 */
export function extractProjectFromPath(pathValue: string | null | undefined): string {
  if (!pathValue) return "";
  const normalized = pathValue.replace(/\\/g, "/");
  const [project] = normalized.split("/");
  return project ?? "";
}