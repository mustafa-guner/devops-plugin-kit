/**
 * Generates the environment example file template entry.
 */
export function envExampleFile(): [string, string] {
  return [
    ".env.example",
    `ENV=dev
     PORT=8080
     SCOPE=User`
  ];
}
