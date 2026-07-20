import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { AGENTSPACE_CLI_RUNNER } from '../../config/config.js'

const packageRoot = fileURLToPath(new URL('../../../', import.meta.url))
const domainRoot = path.resolve(packageRoot, '..')
const cliRoot = path.resolve(domainRoot, 'agentspace-cli')
const cliNodeEntry = path.resolve(cliRoot, 'dist', 'main.js')
const cliTsxEntry = path.resolve(cliRoot, 'src', 'main.ts')
const nodeRequire = createRequire(import.meta.url)
const tsxPkgEntry = nodeRequire.resolve('tsx/package.json')
const tsxCliEntry = path.resolve(path.dirname(tsxPkgEntry), 'dist', 'cli.mjs')

export const cliPackageVersion = String(
  JSON.parse(fs.readFileSync(path.resolve(cliRoot, 'package.json'), 'utf8')).version ?? '0.0.0',
)

function inferRepoDialect(repoUrl: string): 'pg' | 'sqlite' {
  const normalized = repoUrl.trim().toLowerCase()
  if (!normalized) return 'pg'
  if (normalized === ':memory:') return 'sqlite'
  if (normalized.startsWith('sqlite:') || normalized.startsWith('file:')) return 'sqlite'
  if (normalized.endsWith('.db') || normalized.endsWith('.sqlite') || normalized.endsWith('.sqlite3')) return 'sqlite'
  return 'pg'
}

function extractJsonPayload(raw: string): unknown {
  const normalized = raw.trim()
  if (!normalized || normalized === 'undefined' || normalized === 'null') {
    return undefined
  }

  const end = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'))
  if (end < 0) {
    return normalized
  }

  const stack: string[] = []
  let inString = false
  let escaped = false
  let start = -1

  for (let index = end; index >= 0; index -= 1) {
    const char = raw[index]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '}' || char === ']') {
      stack.push(char)
      continue
    }

    if (char === '{' || char === '[') {
      const expected = char === '{' ? '}' : ']'
      if (stack[stack.length - 1] !== expected) continue
      stack.pop()
      if (stack.length === 0) {
        start = index
        break
      }
    }
  }

  if (start < 0) {
    return normalized
  }

  return JSON.parse(raw.slice(start, end + 1).trim())
}

async function runAgentspaceCliInternal(
  args: string[],
  extraEnv: Record<string, string | undefined>,
  outputMode: 'json' | 'text',
): Promise<unknown> {
  return await new Promise((resolvePromise, rejectPromise) => {
    const command = process.execPath
    const commandArgs = AGENTSPACE_CLI_RUNNER === 'node'
      ? [cliNodeEntry, ...args]
      : [tsxCliEntry, cliTsxEntry, ...args]
    const child = spawn(command, commandArgs, {
      cwd: domainRoot,
      env: {
        ...process.env,
        DOTENV_CONFIG_QUIET: 'true',
        ...extraEnv,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.once('error', (error) => rejectPromise(error))
    child.once('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`agentspace_cli_failed:${args.join(' ')}\n${stdout}\n${stderr}`))
        return
      }
      if (outputMode === 'text') {
        resolvePromise(stdout.trim())
        return
      }
      try {
        resolvePromise(extractJsonPayload(stdout))
      } catch (error) {
        rejectPromise(error)
      }
    })
  })
}

export async function runAgentspaceCliWithEnv(
  args: string[],
  extraEnv: Record<string, string | undefined>,
): Promise<unknown> {
  return await runAgentspaceCliInternal(args, extraEnv, 'json')
}

export async function runAgentspaceCliTextWithEnv(
  args: string[],
  extraEnv: Record<string, string | undefined>,
): Promise<string> {
  return String(await runAgentspaceCliInternal(args, extraEnv, 'text'))
}

export async function runAgentspaceCli(args: string[], repoUrl: string): Promise<unknown> {
  const dialect = inferRepoDialect(repoUrl)
  return await runAgentspaceCliWithEnv(args, {
    AGENTSPACE_REPO_URL: repoUrl,
    AGENTSPACE_PG_URL: dialect === 'pg' ? repoUrl : '',
    AGENTSPACE_SQLITE_URL: dialect === 'sqlite' ? repoUrl : '',
    AOPS_PG_URL: dialect === 'pg' ? repoUrl : '',
    DEV_PG_URL: '',
    AGENTSPACE_WORKSPACE_ID: 'default',
  })
}

export async function runAgentspaceCliWithoutRepo(
  args: string[],
  extraEnv: Record<string, string | undefined> = {},
): Promise<unknown> {
  return await runAgentspaceCliWithEnv(args, {
    AGENTSPACE_REPO_URL: '',
    AGENTSPACE_PG_URL: '',
    AGENTSPACE_SQLITE_URL: '',
    AGENTSPACE_WORKSPACE_ID: '',
    AGENTSPACE_CLI_EXECUTION_MODE: '',
    TENANT_ID: '',
    LOG_LEVEL: '',
    AOPS_PG_URL: '',
    DEV_PG_URL: '',
    ...extraEnv,
  })
}

export async function runAgentspaceCliTextWithoutRepo(
  args: string[],
  extraEnv: Record<string, string | undefined> = {},
): Promise<string> {
  return String(await runAgentspaceCliInternal(args, {
    AGENTSPACE_REPO_URL: '',
    AGENTSPACE_PG_URL: '',
    AGENTSPACE_SQLITE_URL: '',
    AGENTSPACE_WORKSPACE_ID: '',
    AGENTSPACE_CLI_EXECUTION_MODE: '',
    TENANT_ID: '',
    LOG_LEVEL: '',
    AOPS_PG_URL: '',
    DEV_PG_URL: '',
    ...extraEnv,
  }, 'text'))
}

export function toItems(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>
  if (!value || typeof value !== 'object') return []
  const record = value as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items as Array<Record<string, unknown>>
  if (Array.isArray(record.data)) return record.data as Array<Record<string, unknown>>
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>
    if (Array.isArray(nested.items)) return nested.items as Array<Record<string, unknown>>
  }
  return []
}
