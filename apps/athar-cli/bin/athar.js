#!/usr/bin/env node
import { parseArgs, flagBool } from "../lib/args.js";
import { dispatchPractice, printPracticeHelp } from "../lib/practice.js";

function printRootHelp() {
  console.log(`athar — Athar Al 'Ilm agent CLI

Usage:
  athar <resource> <verb> [flags]

Resources:
  practice    Quran listen/repeat correction (gateway → muaalem)

Examples:
  athar practice --help
  athar practice status --json
  athar practice correct --file ./001001.wav --surah 1 --ayah 1 --json
  athar practice smoke --surah 1 --ayah 1 --json
  athar practice up --dry-run
  athar practice down --yes
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const { _: positional, flags } = parseArgs(argv);
  const resource = positional[0];

  // Root help only when no resource (or explicit help). Keep `athar practice --help`
  // for the practice subcommand help — agents discover help layered.
  if (!resource || resource === "help") {
    printRootHelp();
    return;
  }
  if (flagBool(flags, "help") && positional.length === 0) {
    printRootHelp();
    return;
  }

  if (resource === "practice") {
    await dispatchPractice(argv.slice(1));
    return;
  }

  console.error(`Error: Unknown resource: ${resource}`);
  console.error("  athar practice --help");
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
