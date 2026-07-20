#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildAgentspaceAgentManifest,
  buildAgentspaceDomainCapabilityManifest,
  buildAgentspaceHostRouteProjection,
  buildAgentspaceCliProjection,
  listAgentspaceToolingOperations,
} from '../src/index.js'

type ManifestCommand = 'print' | 'emit' | 'check'
type ManifestKind = 'dcm' | 'routes' | 'agent' | 'cli' | 'ops' | 'all'

type ParsedArgs = {
  command: ManifestCommand
  kind: ManifestKind
  outDir: string
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const defaultOutDir = path.resolve(packageRoot, 'dist/manifests')

function parseKind(value: string | undefined): ManifestKind {
  const normalized = (value ?? '').trim().toLowerCase()
  if (
    normalized === 'dcm' ||
    normalized === 'routes' ||
    normalized === 'agent' ||
    normalized === 'cli' ||
    normalized === 'ops' ||
    normalized === 'all'
  ) {
    return normalized
  }
  throw new Error('invalid_kind:expected_one_of(dcm|routes|agent|cli|ops|all)')
}

function parseArgs(argv: string[]): ParsedArgs {
  const [commandRaw, ...rest] = argv
  const command = (commandRaw ?? '').trim().toLowerCase()
  if (command !== 'print' && command !== 'emit' && command !== 'check') {
    throw new Error('invalid_command:expected_one_of(print|emit|check)')
  }

  let kind: ManifestKind = 'all'
  let outDir = defaultOutDir

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (token === '--kind') {
      const value = rest[index + 1]
      if (!value || value.startsWith('--')) throw new Error('missing_kind_value')
      kind = parseKind(value)
      index += 1
      continue
    }
    if (token === '--out-dir') {
      const value = rest[index + 1]
      if (!value || value.startsWith('--')) throw new Error('missing_out_dir_value')
      outDir = path.isAbsolute(value) ? value : path.resolve(packageRoot, value)
      index += 1
    }
  }

  return { command, kind, outDir }
}

async function readPackageVersion(): Promise<string> {
  const packageJsonPath = path.resolve(packageRoot, 'package.json')
  const raw = await fs.readFile(packageJsonPath, 'utf8')
  const parsed = JSON.parse(raw) as { version?: unknown }
  const version = typeof parsed.version === 'string' ? parsed.version.trim() : ''
  return version || '0.0.0'
}

function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function normalizeForCheck(kind: Exclude<ManifestKind, 'all'>, value: unknown): unknown {
  if (kind !== 'agent' && kind !== 'cli') return value
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return {
    ...(value as Record<string, unknown>),
    generatedAt: '<normalized>',
  }
}

type ManifestPayloads = {
  dcm: unknown
  routes: unknown
  agent: unknown
  cli: unknown
  ops: unknown
}

async function buildPayloads(): Promise<ManifestPayloads> {
  const domainVersion = await readPackageVersion()
  return {
    dcm: buildAgentspaceDomainCapabilityManifest({
      domainVersion,
      includeDocs: true,
      refresh: true,
    }),
    routes: buildAgentspaceHostRouteProjection({ refresh: true }),
    agent: buildAgentspaceAgentManifest({ refresh: true }),
    cli: buildAgentspaceCliProjection({ refresh: true }),
    ops: listAgentspaceToolingOperations({ refresh: true }),
  }
}

function resolveSelectedKinds(kind: ManifestKind): Array<Exclude<ManifestKind, 'all'>> {
  if (kind === 'all') return ['dcm', 'routes', 'agent', 'cli', 'ops']
  return [kind]
}

function buildOutputPath(outDir: string, kind: Exclude<ManifestKind, 'all'>): string {
  if (kind === 'dcm') return path.resolve(outDir, 'dcm.json')
  if (kind === 'routes') return path.resolve(outDir, 'host-routes.json')
  if (kind === 'agent') return path.resolve(outDir, 'agent-manifest.json')
  if (kind === 'cli') return path.resolve(outDir, 'cli-manifest.json')
  return path.resolve(outDir, 'operations.json')
}

async function runPrint(kind: ManifestKind): Promise<void> {
  const payloads = await buildPayloads()
  if (kind === 'all') {
    process.stdout.write(serializeJson(payloads))
    return
  }
  process.stdout.write(serializeJson(payloads[kind]))
}

async function runEmit(kind: ManifestKind, outDir: string): Promise<void> {
  const payloads = await buildPayloads()
  const kinds = resolveSelectedKinds(kind)
  await fs.mkdir(outDir, { recursive: true })
  for (const selectedKind of kinds) {
    const outFile = buildOutputPath(outDir, selectedKind)
    await fs.writeFile(outFile, serializeJson(payloads[selectedKind]), 'utf8')
    process.stderr.write(`[manifest] emitted ${selectedKind} -> ${outFile}\n`)
  }
}

async function runCheck(kind: ManifestKind, outDir: string): Promise<void> {
  const payloads = await buildPayloads()
  const kinds = resolveSelectedKinds(kind)

  for (const selectedKind of kinds) {
    const outFile = buildOutputPath(outDir, selectedKind)
    const expected = serializeJson(normalizeForCheck(selectedKind, payloads[selectedKind]))

    let actualRaw: string
    try {
      actualRaw = await fs.readFile(outFile, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`manifest_missing:${selectedKind}:${outFile}`)
      }
      throw error
    }

    const actual = serializeJson(normalizeForCheck(selectedKind, JSON.parse(actualRaw)))
    if (actual !== expected) {
      throw new Error(`manifest_outdated:${selectedKind}:${outFile}`)
    }
    process.stderr.write(`[manifest] up-to-date ${selectedKind} -> ${outFile}\n`)
  }
}

async function main(): Promise<void> {
  const { command, kind, outDir } = parseArgs(process.argv.slice(2))
  if (command === 'print') return runPrint(kind)
  if (command === 'emit') return runEmit(kind, outDir)
  return runCheck(kind, outDir)
}

await main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`[manifest] failed: ${message}\n`)
  process.exitCode = 1
})
