#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

const root = process.cwd();
dotenv.config({ path: path.join(root, ".env"), quiet: true });
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });

const args = new Set(process.argv.slice(2));
const wantsHelp = args.has("--help") || args.has("-h");
const wantsSmoke = args.has("--smoke");
const wantsDemo = args.has("--demo");

async function main(): Promise<void> {
  if (wantsHelp) {
    const { printHelp } = await import("./batch.js");
    printHelp();
    return;
  }

  if (wantsSmoke) {
    const { runSmoke } = await import("./batch.js");
    process.exitCode = await runSmoke();
    return;
  }

  if (wantsDemo) {
    const { runGuidedDemoBatch } = await import("./batch.js");
    process.exitCode = await runGuidedDemoBatch();
    return;
  }

  if (!process.stdin.isTTY) {
    const { printHelp } = await import("./batch.js");
    console.error(
      "Interactive mode requires a TTY. In CI/IDE non-interactive runs, use --smoke or --demo.",
    );
    printHelp();
    process.exit(1);
  }

  const { startInteractive } = await import("./interactive.js");
  await startInteractive();
}

main().catch(async (error) => {
  const { j, fail } = await import("./shared.js");
  console.error(j(fail(error)));
  process.exit(1);
});
