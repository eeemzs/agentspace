import { config as dotenvConfig } from 'dotenv'
import { DEFAULT_TENANT_AS_UUID_STRING } from '@aopslab/xf-core'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import net from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const testRoot = fileURLToPath(new URL('../../', import.meta.url))
const domainRoot = resolve(testRoot, '..')
const envPaths = [
  resolve(testRoot, '..', '.env'),
  resolve(testRoot, '..', '..', '..', 'apps', 'aops', '.env'),
]

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenvConfig({ path: envPath, override: false, quiet: true })
  }
}

function normalizePathToFileUrl(pathValue: string): string {
  return `file:${pathValue.replace(/\\/g, '/')}`
}

function inferDrizzleDialectFromRepoUrl(repoUrl: string): 'pg' | 'sqlite' {
  const value = repoUrl.trim().toLowerCase()
  if (!value) return 'pg'
  if (value === ':memory:') return 'sqlite'
  if (value.startsWith('sqlite:') || value.startsWith('file:')) return 'sqlite'
  if (value.endsWith('.db') || value.endsWith('.sqlite') || value.endsWith('.sqlite3')) return 'sqlite'
  return 'pg'
}

function resolveSqliteFilename(repoUrl: string): string {
  const trimmed = repoUrl.trim()
  if (trimmed === ':memory:') return ':memory:'

  const stripScheme = (value: string, scheme: string): string =>
    value.startsWith(scheme) ? value.slice(scheme.length).replace(/^\/\//, '') : value

  const noSqlite = stripScheme(trimmed, 'sqlite:')
  const noFile = stripScheme(noSqlite, 'file:')
  return noFile || trimmed
}

const explicitAgentspaceRepoUrl = String(process.env.AGENTSPACE_REPO_URL ?? '').trim()
const explicitAgentspaceRepoDialect = explicitAgentspaceRepoUrl
  ? inferDrizzleDialectFromRepoUrl(explicitAgentspaceRepoUrl)
  : undefined

export const TEST_DB_POSTGRESQL_URI =
  process.env.AGENTSPACE_REPO_PG_URL ??
  process.env.AGENTSPACE_PG_URL ??
  (explicitAgentspaceRepoDialect === 'pg' ? explicitAgentspaceRepoUrl : undefined) ??
  process.env.AOPS_PG_URL ??
  process.env.DEV_PG_URL ??
  ''

const sqliteRunId = String(process.env.AGENTSPACE_TEST_RUN_ID ?? process.pid)
  .trim()
  .replace(/[^a-zA-Z0-9._-]+/g, '-')
const sqliteWorkerSuffix = process.env.VITEST_POOL_ID ?? process.env.VITEST_WORKER_ID ?? String(process.pid)
const defaultSqliteDbPathByWorker = resolve(
  domainRoot,
  '.tmp',
  `agentspace-tests-${sqliteRunId}-${sqliteWorkerSuffix}.sqlite`,
)

export const TEST_DB_SQLITE_URI =
  process.env.AGENTSPACE_REPO_SQLITE_URL ??
  process.env.AGENTSPACE_SQLITE_URL ??
  (explicitAgentspaceRepoDialect === 'sqlite' ? explicitAgentspaceRepoUrl : undefined) ??
  normalizePathToFileUrl(defaultSqliteDbPathByWorker)

export const TEST_TENANT_ID = process.env.TENANT_ID ?? DEFAULT_TENANT_AS_UUID_STRING
export const TEST_LOG_LEVEL = process.env.LOG_LEVEL ?? 'debug'

export type RepoVariantKey = 'drizzle' | 'drizzle-sqlite'
export type AgentspaceCliRunner = 'tsx' | 'node'
export type RepoVariant = {
  key: RepoVariantKey
  label: string
  url: string
  dialect: 'pg' | 'sqlite'
}

const repoVariantTokenMap: Record<string, RepoVariantKey> = {
  drizzle: 'drizzle',
  'drizzle-pg': 'drizzle',
  pg: 'drizzle',
  postgres: 'drizzle',
  postgresql: 'drizzle',
  sqlite: 'drizzle-sqlite',
  'drizzle-sqlite': 'drizzle-sqlite',
}

function parseRequestedRepoVariantKeys(raw: string | undefined): RepoVariantKey[] | undefined {
  if (raw === undefined) return undefined
  const tokens = raw
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean)

  if (tokens.length === 0) return []

  const selectedKeys = new Set<RepoVariantKey>()
  for (const token of tokens) {
    const mapped = repoVariantTokenMap[token]
    if (!mapped) {
      throw new Error(`invalid_repo_variant_token:${token}`)
    }
    selectedKeys.add(mapped)
  }
  return Array.from(selectedKeys)
}

function parseCliRunner(raw: string | undefined): AgentspaceCliRunner {
  const normalized = String(raw ?? 'node').trim().toLowerCase()
  if (normalized === 'tsx' || normalized === 'node') {
    return normalized
  }
  throw new Error(`invalid_cli_runner:${String(raw ?? '')}`)
}

function isTruthyEnv(raw: string | undefined): boolean {
  const normalized = String(raw ?? '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const variants: RepoVariant[] = []
if (TEST_DB_POSTGRESQL_URI) {
  variants.push({
    key: 'drizzle',
    label: 'drizzle-pg',
    url: TEST_DB_POSTGRESQL_URI,
    dialect: 'pg',
  })
}
variants.push({
  key: 'drizzle-sqlite',
  label: 'drizzle-sqlite',
  url: TEST_DB_SQLITE_URI,
  dialect: 'sqlite',
})

const availableVariantMap = new Map<RepoVariantKey, RepoVariant>(variants.map((variant) => [variant.key, variant]))
const requestedVariantKeys = parseRequestedRepoVariantKeys(
  process.env.AGENTSPACE_TEST_VARIANTS ?? process.env.AGENTSPACE_TEST_REPO_TYPES,
)

if (requestedVariantKeys && requestedVariantKeys.length === 0) {
  throw new Error('missing_repo_variant_selection:expected_at_least_one_of_pg,sqlite')
}

if (requestedVariantKeys) {
  for (const key of requestedVariantKeys) {
    if (!availableVariantMap.has(key)) {
      throw new Error(`repo_variant_not_available:${key}`)
    }
  }
}

export const repoVariants: RepoVariant[] = requestedVariantKeys
  ? requestedVariantKeys.map((key) => availableVariantMap.get(key) as RepoVariant)
  : variants

export const AGENTSPACE_CLI_RUNNER: AgentspaceCliRunner = parseCliRunner(process.env.AGENTSPACE_TEST_CLI_RUNNER)
const cliRuntimeBootstrapPromises = new Map<AgentspaceCliRunner, Promise<void>>()
const drizzleBootstrapPromises = new Map<string, Promise<void>>()

export async function canConnectTcp(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return await new Promise((resolvePromise) => {
    const socket = new net.Socket()
    const done = (ok: boolean) => {
      try {
        socket.destroy()
      } catch {}
      resolvePromise(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(port, host)
  })
}

export async function canConnectTcpFromUrl(url: string, fallbackPort: number): Promise<boolean> {
  if (inferDrizzleDialectFromRepoUrl(url) === 'sqlite') {
    return true
  }
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    const port = parsed.port ? Number(parsed.port) : fallbackPort
    return await canConnectTcp(host, port, 1000)
  } catch {
    return false
  }
}

export async function ensureVariantReady(variant: RepoVariant): Promise<void> {
  if (variant.dialect === 'pg') {
    const ok = await canConnectTcpFromUrl(variant.url, 5432)
    if (!ok) {
      throw new Error(`cannot reach database for ${variant.key}`)
    }
  }
  await ensureAgentspaceTables(variant.url, variant.dialect)
}

export async function ensureCliRuntimeReady(): Promise<void> {
  if (AGENTSPACE_CLI_RUNNER !== 'node') return

  const pending = cliRuntimeBootstrapPromises.get(AGENTSPACE_CLI_RUNNER)
  if (pending) {
    await pending
    return
  }

  const bootstrapPromise = (async () => {
    const cliDistEntry = resolve(domainRoot, 'agentspace-cli', 'dist', 'main.js')
    if (!existsSync(cliDistEntry) || isTruthyEnv(process.env.AGENTSPACE_TEST_FORCE_CLI_BUILD)) {
      await runCommand(
        'pnpm',
        ['--filter', '@aopslab/domain-cli-agentspace', 'run', 'build'],
        domainRoot,
        {
          ...process.env,
        },
      )
    }
  })()

  cliRuntimeBootstrapPromises.set(AGENTSPACE_CLI_RUNNER, bootstrapPromise)
  await bootstrapPromise
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.once('error', (error) => {
      rejectPromise(error)
    })

    child.once('close', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n')
      rejectPromise(new Error(`command_failed:${command} ${args.join(' ')}\n${output}`))
    })
  })
}

export async function ensureAgentspaceTables(repoUrl: string, dialectHint?: RepoVariant['dialect']): Promise<void> {
  const dialect = dialectHint ?? inferDrizzleDialectFromRepoUrl(repoUrl)
  const key = `${dialect}:${repoUrl}`

  const pending = drizzleBootstrapPromises.get(key)
  if (pending) {
    await pending
    return
  }

  const bootstrapPromise = (async () => {
    if (dialect === 'sqlite') {
      const filename = resolveSqliteFilename(repoUrl)
      if (filename && filename !== ':memory:') {
        mkdirSync(dirname(filename), { recursive: true })
        if (existsSync(filename)) {
          unlinkSync(filename)
        }
      }
      return
    }

    await runCommand(
      'pnpm',
      ['run', 'db:push'],
      domainRoot,
      {
        ...process.env,
        AGENTSPACE_DRIZZLE_DIALECT: 'postgresql',
        AGENTSPACE_REPO_URL: repoUrl,
        AGENTSPACE_PG_URL: repoUrl,
        AGENTSPACE_SQLITE_URL: '',
        AOPS_PG_URL: repoUrl,
        DEV_PG_URL: '',
      },
    )
  })()

  drizzleBootstrapPromises.set(key, bootstrapPromise)
  await bootstrapPromise
}
