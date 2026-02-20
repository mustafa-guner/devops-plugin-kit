import { spawn } from "node:child_process";

/**
 * Runs npm install in the generated plugin directory.
 *
 * @param cwd - generated project directory path
 * @throws Error if npm install exits with a non-zero code
 */
export function runNpmInstall(cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["install"], { cwd, stdio: "inherit", shell: true });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`npm install failed with code ${code}`));
    });
  });
}
