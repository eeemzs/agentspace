#!/usr/bin/env node

import { spawnSync } from "node:child_process"

const args = process.argv.slice(2)
const cliArgs = args.length ? args : ["status", "--verbose"]

const env = {
  ...process.env,
  // term-size package first checks these env values and skips vendor binary.
  COLUMNS: process.env.COLUMNS || "120",
  LINES: process.env.LINES || "40"
}

const result = spawnSync("pnpm", ["exec", "changeset", ...cliArgs], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32"
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
