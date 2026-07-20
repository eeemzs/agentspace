#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAgentspaceHostRegistrationManifest } from '../src/host-registration.js'

type ManifestCommand = 'print' | 'emit' | 'check'

type ParsedArgs = {
  command: ManifestCommand
  outDir: string
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const defaultOutDir = path.resolve(packageRoot, 'dist/manifests')

function parseArgs(argv: string[]): ParsedArgs {
  const [commandRaw, ...rest] = argv
  const command = (commandRaw ?? '').trim().toLowerCase()
  if (command !== 'print' && command !== 'emit' && command !== 'check') {
    throw new Error('invalid_command:expected_one_of(print|emit|check)')
  }

  let outDir = defaultOutDir
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (token !== '--out-dir') continue
    const value = rest[index + 1]
    if (!value || value.startsWith('--')) throw new Error('missing_out_dir_value')
    outDir = path.isAbsolute(value) ? value : path.resolve(packageRoot, value)
    index += 1
  }

  return { command, outDir }
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function buildOutputPath(outDir: string): string {
  return path.resolve(outDir, 'host-registration.json')
}

async function runPrint(): Promise<void> {
  process.stdout.write(serializeJson(buildAgentspaceHostRegistrationManifest()))
}

async function runEmit(outDir: string): Promise<void> {
  await fs.mkdir(outDir, { recursive: true })
  const outputPath = buildOutputPath(outDir)
  await fs.writeFile(outputPath, serializeJson(buildAgentspaceHostRegistrationManifest()), 'utf8')
  process.stderr.write(`[manifest] emitted host-registration -> ${outputPath}\n`)
}

async function runCheck(outDir: string): Promise<void> {
  const outputPath = buildOutputPath(outDir)
  const expected = serializeJson(buildAgentspaceHostRegistrationManifest())
  let actual: string
  try {
    actual = await fs.readFile(outputPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`manifest_missing:host-registration:${outputPath}`)
    }
    throw error
  }

  if (actual !== expected) {
    throw new Error(`manifest_outdated:host-registration:${outputPath}`)
  }
  process.stderr.write(`[manifest] up-to-date host-registration -> ${outputPath}\n`)
}

async function main(): Promise<void> {
  const { command, outDir } = parseArgs(process.argv.slice(2))
  if (command === 'print') return runPrint()
  if (command === 'emit') return runEmit(outDir)
  return runCheck(outDir)
}

await main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[manifest] failed: ${message}\n`)
  process.exitCode = 1
})
