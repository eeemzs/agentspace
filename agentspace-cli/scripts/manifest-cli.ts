#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAgentspaceAgentManifest,
  buildAgentspaceDomainCapabilityManifest,
} from '@aopslab/domain-tooling-agentspace'
import { buildAgentspaceHostRegistrationManifest } from '../src/host-registration.js'

function readOption(argv: readonly string[], key: string, fallback: string): string {
  const index = argv.indexOf(key)
  if (index === -1) return fallback
  const next = argv[index + 1]
  if (!next || next.startsWith('--')) return fallback
  return next
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function buildManifestFiles(): Readonly<Record<string, unknown>> {
  return {
    'agent.manifest.json': buildAgentspaceAgentManifest(),
    'domain-capability.manifest.json': buildAgentspaceDomainCapabilityManifest(),
    'host-registration.manifest.json': buildAgentspaceHostRegistrationManifest(),
  }
}

function emitManifestFiles(outDir: string, files: Readonly<Record<string, unknown>>): void {
  mkdirSync(outDir, { recursive: true })
  for (const [filename, payload] of Object.entries(files)) {
    writeFileSync(resolve(outDir, filename), stringifyJson(payload), 'utf8')
  }
}

function checkManifestFiles(outDir: string, files: Readonly<Record<string, unknown>>): void {
  for (const [filename, payload] of Object.entries(files)) {
    const filePath = resolve(outDir, filename)
    const actual = readFileSync(filePath, 'utf8')
    const expected = stringifyJson(payload)
    if (actual !== expected) {
      throw new Error(`manifest_out_of_sync:${filename}`)
    }
  }
}

const argv = process.argv.slice(2)
const command = argv[0] ?? 'print'
const outDir = resolve(process.cwd(), readOption(argv, '--out-dir', 'dist/manifests'))
const manifestFiles = buildManifestFiles()

if (command === 'print') {
  process.stdout.write(stringifyJson(manifestFiles))
} else if (command === 'emit') {
  emitManifestFiles(outDir, manifestFiles)
} else if (command === 'check') {
  checkManifestFiles(outDir, manifestFiles)
} else {
  throw new Error(`unsupported_manifest_command:${command}`)
}
