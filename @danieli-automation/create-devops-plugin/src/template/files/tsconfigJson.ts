/**
 * Generates the tsconfig.json template entry.
 */
export function tsconfigJsonFile(): [string, string] {
  return [
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          jsx: "react-jsx",
          moduleResolution: "Node",
          strict: true,
          skipLibCheck: true,
          sourceMap: true,
          baseUrl: ".",
          paths: {
            "core/*": ["src/core/*"],
            "app/*": ["src/app/*"],
          }
        },
        include: ["src", "vitest.config.ts"]
      },
      null,
      2
    )
  ];
}
