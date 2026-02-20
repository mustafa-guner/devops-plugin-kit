/**
 * Generates the .gitignore template entry.
 */
export function gitignoreFile(): [string, string] {
  return [
    ".gitignore",
    `node_modules
    dist
    *.vsix
    coverage
`
  ];
}
