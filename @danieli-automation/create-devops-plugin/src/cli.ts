#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { createPluginTemplate } from "./index.js";

type CliArgs = {
  pluginName: string;
  publisher: string;
  targetDir: string;
  extensionId?: string;
  installDependencies: boolean;
  force: boolean;
};

/**
 * Parses command line flags and positional arguments for scaffold execution.
 *
 * @param argv - raw process argv list
 * @throws Error when required options are missing or malformed
 */
function parseArgs(argv: string[]): CliArgs {
  const args = [...argv];
  const pluginName = args.shift();
  if (!pluginName) {
    throw new Error("Missing required argument: <plugin-name>");
  }

  let publisher = "";
  let targetDir = process.cwd();
  let extensionId: string | undefined;
  let installDependencies = true;
  let force = false;

  while (args.length > 0) {
    const token = args.shift();

    if (!token) {
      continue;
    }

    if (token === "--publisher" || token === "-p") {
      publisher = args.shift() ?? "";
      continue;
    }

    if (token === "--targetDir" || token === "--target-dir" || token === "-t") {
      targetDir = args.shift() ?? targetDir;
      continue;
    }

    if (token === "--extensionId" || token === "--extension-id" || token === "-e") {
      extensionId = args.shift();
      continue;
    }

    if (token === "--no-install") {
      installDependencies = false;
      continue;
    }

    if (token === "--force" || token === "-f") {
      force = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (!publisher) {
    throw new Error("Missing required option: --publisher <publisher-id>");
  }

  return {
    pluginName,
    publisher,
    targetDir,
    extensionId,
    installDependencies,
    force
  };
}

/**
 * Prints usage help for the create-devops-plugin CLI.
 */
function printHelp() {
  console.log(
    [
      "Usage:",
      "  create-devops-plugin <plugin-name> --publisher <publisher-id> [options]",
      "",
      "Options:",
      "  -p, --publisher <id>           Azure DevOps publisher id (required)",
      "  -t, --target-dir <path>        Parent folder (default: current directory)",
      "  -e, --extension-id <id>        Manifest extension id override",
      "      --no-install               Skip npm install in generated plugin",
      "  -f, --force                    Allow non-empty target directory",
      "  -h, --help                     Show help"
    ].join("\n")
  );
}

async function main() {
  try {
    const argv = process.argv.slice(2);
    if (argv.includes("--help") || argv.includes("-h")) {
      printHelp();
      return;
    }

    const parsed = parseArgs(argv);
    const outputDir = await createPluginTemplate({
      pluginName: parsed.pluginName,
      publisher: parsed.publisher,
      targetDir: path.resolve(parsed.targetDir),
      extensionId: parsed.extensionId,
      installDependencies: parsed.installDependencies,
      force: parsed.force
    });

    console.log(`Plugin created at: ${outputDir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`create-devops-plugin failed: ${message}`);
    printHelp();
    process.exit(1);
  }
}

void main();
