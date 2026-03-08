#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv'
import {
  buildAgentspaceAgentManifest,
  buildAgentspaceDomainCapabilityManifest,
  getAgentspaceOperationSpecById,
  listAgentspaceToolingOperations,
  listAgentspaceToolingTools,
  resolveAgentspaceOperationIdByToolId,
  runAgentspaceOperationById,
  runAgentspaceToolById,
} from '@aopslab/domain-tooling-agentspace'
import { buildAgentspaceHostRegistrationManifest } from './host-registration.js'

type OptionValue = string | boolean

interface ParsedArgv {
  readonly positionals: readonly string[]
  readonly options: Readonly<Record<string, OptionValue>>
}

function parseArgv(argv: readonly string[]): ParsedArgv {
  const positionals: string[] = []
  const options: Record<string, OptionValue> = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--') continue

    if (!token.startsWith('--')) {
      positionals.push(token)
      continue
    }

    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      options[key] = true
      continue
    }

    options[key] = next
    index += 1
  }

  return { positionals, options }
}

function readStringOption(parsed: ParsedArgv, key: string): string | undefined {
  const value = parsed.options[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function parseJsonInput(raw: string | undefined): unknown {
  if (!raw) return undefined
  return JSON.parse(raw)
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function printHelp(): void {
  process.stdout.write(
    [
      'agentspace <command>',
      '',
      'commands:',
      '  tools',
      '  ops',
      '  manifest all',
      '  manifest host-registration',
      '  invoke <operationId> [--input <json>]',
      '  tool <toolId> [--input <json>]',
    ].join('\n'),
  )
  process.stdout.write('\n')
}

async function handleManifest(subcommand: string | undefined): Promise<void> {
  if (!subcommand || subcommand === 'all') {
    printJson({
      agentManifest: buildAgentspaceAgentManifest(),
      capabilityManifest: buildAgentspaceDomainCapabilityManifest(),
      hostRegistration: buildAgentspaceHostRegistrationManifest(),
    })
    return
  }

  if (subcommand === 'host-registration') {
    printJson(buildAgentspaceHostRegistrationManifest())
    return
  }

  throw new Error(`unsupported_manifest_subcommand:${subcommand}`)
}

async function main(): Promise<void> {
  dotenvConfig({ override: false, quiet: true })

  const parsed = parseArgv(process.argv.slice(2))
  const command = parsed.positionals[0] ?? 'help'

  if (command === 'help') {
    printHelp()
    return
  }

  if (command === 'tools') {
    printJson(listAgentspaceToolingTools())
    return
  }

  if (command === 'ops' || command === 'operations') {
    printJson(listAgentspaceToolingOperations())
    return
  }

  if (command === 'manifest') {
    await handleManifest(parsed.positionals[1])
    return
  }

  if (command === 'invoke') {
    const operationId = parsed.positionals[1] ?? readStringOption(parsed, 'operation-id')
    if (!operationId) {
      throw new Error('missing_operation_id')
    }

    printJson({
      operation: getAgentspaceOperationSpecById(operationId) ?? null,
      result: await runAgentspaceOperationById(operationId, parseJsonInput(readStringOption(parsed, 'input'))),
    })
    return
  }

  if (command === 'tool') {
    const toolId = parsed.positionals[1] ?? readStringOption(parsed, 'tool-id')
    if (!toolId) {
      throw new Error('missing_tool_id')
    }

    printJson({
      toolId,
      operationId: resolveAgentspaceOperationIdByToolId(toolId) ?? null,
      result: await runAgentspaceToolById(toolId, parseJsonInput(readStringOption(parsed, 'input'))),
    })
    return
  }

  printHelp()
  throw new Error(`unknown_command:${command}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
