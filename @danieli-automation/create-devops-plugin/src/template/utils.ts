/**
 * Normalizes text into a lowercase kebab-case identifier.
 *
 * @param value - raw input text to normalize
 */
export function normalizeId(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

/**
 * Escapes special characters for safe HTML interpolation.
 *
 * @param value - raw string content
 */
export function escapeForHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
