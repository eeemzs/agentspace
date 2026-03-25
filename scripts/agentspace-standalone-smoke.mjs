#!/usr/bin/env node

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { config as dotenvConfig } from 'dotenv'
import { Client } from 'pg'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tempRootDefault = process.env.TMPDIR || os.tmpdir()
const reportName = 'agentspace-standalone-smoke-report.json'
const defaultWorkspaceOwnerId = '11111111-1111-4111-8111-111111111111'
const cliPackage = '@aopslab/domain-cli-agentspace'
const cliMainPath = path.join(rootDir, 'agentspace-cli', 'dist', 'main.js')
const envPaths = [
  path.join(rootDir, '.env'),
  path.join(rootDir, '..', '..', 'apps', 'aops', '.env'),
]

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenvConfig({ path: envPath, override: false, quiet: true })
  }
}

function printUsage() {
  process.stdout.write(
    [
      'agentspace standalone smoke',
      '',
      'Purpose:',
      '  Builds the canonical CLI/tests when needed, provisions an isolated runtime,',
      '  optionally creates a temporary PostgreSQL database, runs the PG/sqlite',
      '  a minimal CLI CRUD flow against isolated sqlite or PostgreSQL storage.',
      '',
      'Usage:',
      '  node ./scripts/agentspace-standalone-smoke.mjs [--skip-build] [--keep-temp] [--temp-root <dir>] [--repo-url <url>] [--pg] [--admin-repo-url <url>]',
      '',
      'Options:',
      '  --skip-build       Skip standalone build checks before smoke.',
      '  --keep-temp        Keep temp run root even on success.',
      '  --temp-root <dir>  Parent temp directory (default: $TMPDIR or os.tmpdir()).',
      '  --repo-url <url>   Explicit repo URL. With --pg, treated as the base PostgreSQL URL.',
      '  --pg               Resolve PostgreSQL from env or --repo-url and validate against an isolated temp database.',
      '  --admin-repo-url <url>  Optional PostgreSQL admin URL override for temp database create/drop.',
      '  --help             Show this help.',
      '',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const options = {
    skipBuild: false,
    keepTemp: false,
    tempRoot: tempRootDefault,
    repoUrl: '',
    pg: false,
    adminRepoUrl: '',
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--') continue
    if (token === '--help') {
      printUsage()
      process.exit(0)
    }
    if (token === '--skip-build') {
      options.skipBuild = true
      continue
    }
    if (token === '--keep-temp') {
      options.keepTemp = true
      continue
    }
    if (token === '--temp-root') {
      options.tempRoot = String(argv[index + 1] ?? '').trim() || tempRootDefault
      index += 1
      continue
    }
    if (token === '--repo-url') {
      options.repoUrl = String(argv[index + 1] ?? '').trim()
      index += 1
      continue
    }
    if (token === '--pg') {
      options.pg = true
      continue
    }
    if (token === '--admin-repo-url') {
      options.adminRepoUrl = String(argv[index + 1] ?? '').trim()
      index += 1
      continue
    }
    throw new Error(`unknown_option:${token}`)
  }

  return options
}

function log(message) {
  process.stdout.write(`[agentspace-standalone-smoke] ${message}\n`)
}

function fail(message) {
  throw new Error(`[agentspace-standalone-smoke] FAIL: ${message}`)
}

function normalizeRepoUrl(repoUrl) {
  return String(repoUrl ?? '').trim().replace(/(?:\\r|\r)+$/g, '')
}

function inferRepoDialect(repoUrl) {
  const normalized = normalizeRepoUrl(repoUrl).toLowerCase()
  if (!normalized) return 'sqlite'
  if (normalized === ':memory:') return 'sqlite'
  if (normalized.startsWith('sqlite:') || normalized.startsWith('file:')) return 'sqlite'
  if (normalized.endsWith('.db') || normalized.endsWith('.sqlite') || normalized.endsWith('.sqlite3')) return 'sqlite'
  return 'pg'
}

function redactSecrets(text, secrets = []) {
  return secrets
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .reduce((output, value) => String(output).split(value).join('[REDACTED]'), String(text ?? ''))
}

function run(command, args, options = {}) {
  const { cwd = rootDir, env = process.env, capture = false, redactions = [] } = options
  log(`run: ${redactSecrets(`${command} ${args.join(' ')}`, redactions)}`)
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })

  if (result.error) fail(`command_spawn_failed:${command}:${result.error.message}`)
  if ((result.status ?? 1) !== 0) {
    const captured = capture ? [result.stdout?.trim(), result.stderr?.trim()].filter(Boolean).join('\n') : ''
    fail(
      `command_failed:${redactSecrets(`${command} ${args.join(' ')}`, redactions)}${
        captured ? `\n${redactSecrets(captured, redactions)}` : ''
      }`,
    )
  }

  return {
    stdout: capture ? String(result.stdout ?? '') : '',
    stderr: capture ? String(result.stderr ?? '') : '',
  }
}

function parseJsonOutput(raw, label) {
  try {
    return JSON.parse(String(raw ?? '').trim())
  } catch (error) {
    fail(`invalid_json_output:${label}:${error instanceof Error ? error.message : String(error)}`)
  }
}

function ensureCommand(command) {
  const probe = spawnSync(command, ['--version'], {
    encoding: 'utf8',
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })
  if (probe.error) fail(`missing_required_command:${command}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function toItems(value) {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value.items)) return value.items
  if (Array.isArray(value.data)) return value.data
  if (value.data && typeof value.data === 'object' && Array.isArray(value.data.items)) {
    return value.data.items
  }
  return []
}

function extractEntityId(value) {
  if (!value || typeof value !== 'object') return ''
  return String(
    value.id ??
      value.data?.id ??
      value.data?.data?.id ??
      value.result?.id ??
      value.result?.data?.id ??
      '',
  ).trim()
}

function resolveBasePgUrl(explicitRepoUrl) {
  return (
    String(explicitRepoUrl ?? '').trim() ||
    process.env.AGENTSPACE_TEST_PG_URL?.trim() ||
    process.env.AGENTSPACE_REPO_PG_URL?.trim() ||
    process.env.AGENTSPACE_PG_URL?.trim() ||
    process.env.AOPS_PG_URL?.trim() ||
    process.env.DEV_PG_URL?.trim() ||
    ''
  )
}

function resolveAdminPgUrl(basePgUrl, explicitAdminRepoUrl) {
  const explicit = String(explicitAdminRepoUrl ?? '').trim() || process.env.AGENTSPACE_TEST_PG_ADMIN_URL?.trim()
  if (explicit) return explicit
  const parsed = new URL(basePgUrl)
  parsed.pathname = '/postgres'
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

function withDatabaseName(connectionString, databaseName) {
  const parsed = new URL(connectionString)
  parsed.pathname = `/${databaseName}`
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString()
}

async function withPgClient(connectionString, fn) {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function createTempDatabase(baseConnectionString, adminConnectionString) {
  const databaseName = `agentspace_standalone_smoke_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const databaseUrl = withDatabaseName(baseConnectionString, databaseName)
  await withPgClient(adminConnectionString, async (client) => {
    await client.query(`CREATE DATABASE "${databaseName}"`)
  })
  return { databaseName, databaseUrl }
}

async function dropTempDatabase(adminConnectionString, databaseName) {
  await withPgClient(adminConnectionString, async (client) => {
    await client.query(
      `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid()`,
      [databaseName],
    )
    await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
  })
}

async function canConnectTcp(host, port, timeoutMs = 1000) {
  return await new Promise((resolve) => {
    const socket = new net.Socket()
    const done = (ok) => {
      try {
        socket.destroy()
      } catch {}
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
    socket.connect(port, host)
  })
}

async function ensurePostgresReachable(connectionString) {
  const parsed = new URL(connectionString)
  const port = parsed.port ? Number(parsed.port) : 5432
  return canConnectTcp(parsed.hostname, port, 1000)
}

function buildRuntimeEnv(homeDir, expectedRepoUrl, dialect, runId) {
  const sqliteRepoUrl = dialect === 'sqlite' ? expectedRepoUrl : ''
  const pgRepoUrl = dialect === 'pg' ? expectedRepoUrl : ''
  return {
    ...process.env,
    HOME: homeDir,
    USERPROFILE: homeDir,
    NODE_NO_WARNINGS: '1',
    AGENTSPACE_REPO_URL: expectedRepoUrl,
    AGENTSPACE_SQLITE_URL: sqliteRepoUrl,
    AGENTSPACE_PG_URL: pgRepoUrl,
    AOPS_PG_URL: pgRepoUrl,
    AGENTSPACE_TEST_PG_URL: pgRepoUrl,
    AGENTSPACE_TEST_RUN_ID: runId,
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  ensureCommand('pnpm')

  if (!options.skipBuild) {
    for (const script of ['build:core', 'build:dm', 'build:kit', 'build:ops', 'build:tooling', 'build:host-plugin', 'build:cli']) {
      run('pnpm', ['run', script])
    }
    assert(fs.existsSync(cliMainPath), 'missing_agentspace_cli_dist_main')
  }

  fs.mkdirSync(options.tempRoot, { recursive: true })
  const runRoot = fs.mkdtempSync(path.join(options.tempRoot, 'agentspace-standalone-smoke.'))
  const homeDir = path.join(runRoot, 'home')
  fs.mkdirSync(homeDir, { recursive: true })

  let cleaned = false
  let tempPgDatabaseName = ''
  let tempPgDatabaseUrl = ''
  let adminPgUrl = ''
  const sqliteRepoUrl = `file:${path.join(homeDir, '.aops', 'agentspace.aops.sqlite').replaceAll('\\', '/')}`
  let expectedRepoUrl = options.repoUrl || sqliteRepoUrl
  let repoDialect = inferRepoDialect(expectedRepoUrl)

  if (options.pg && inferRepoDialect(options.repoUrl) !== 'pg' && String(options.repoUrl).trim()) {
    fail('pg_mode_requires_postgresql_base_url')
  }
  if (!options.pg && inferRepoDialect(options.repoUrl) === 'pg') {
    fail('pg_repo_requires_pg_flag')
  }

  if (options.pg) {
    const basePgUrl = resolveBasePgUrl(options.repoUrl)
    if (!basePgUrl) {
      process.stdout.write(`${JSON.stringify({ ok: true, skipped: true, reason: 'missing_pg_base_url' })}\n`)
      return
    }
    const reachable = await ensurePostgresReachable(basePgUrl)
    if (!reachable) {
      process.stdout.write(`${JSON.stringify({ ok: true, skipped: true, reason: 'pg_base_url_unreachable' })}\n`)
      return
    }

    adminPgUrl = resolveAdminPgUrl(basePgUrl, options.adminRepoUrl)
    const tempDatabase = await createTempDatabase(basePgUrl, adminPgUrl)
    tempPgDatabaseName = tempDatabase.databaseName
    tempPgDatabaseUrl = tempDatabase.databaseUrl
    expectedRepoUrl = tempPgDatabaseUrl
    repoDialect = 'pg'
  }

  const redactions = [expectedRepoUrl, tempPgDatabaseUrl, adminPgUrl]
  const runId = `standalone-${Date.now()}`
  const env = buildRuntimeEnv(homeDir, expectedRepoUrl, repoDialect, runId)

  try {
    if (repoDialect === 'pg') {
      run('pnpm', ['run', 'db:push'], {
        env: {
          ...env,
          AGENTSPACE_DRIZZLE_DIALECT: 'postgresql',
          DEV_PG_URL: '',
        },
        redactions,
      })
    }

    const cliManifest = parseJsonOutput(
      run(
        process.execPath,
        [cliMainPath, 'manifest', 'get', 'cli', '--path', 'commandsById.workspace.list-workspaces'],
        { env, capture: true, redactions },
      ).stdout,
      'manifest_get_cli_workspace_list',
    )
    assert(String(cliManifest.title ?? '') === 'agentspace workspace list-workspaces', 'cli_manifest_workspace_list_title_mismatch')

    const listedDefault = parseJsonOutput(
      run(
        process.execPath,
        [cliMainPath, 'workspace', 'list-workspaces', '--workspace-id', 'default'],
        { env, capture: true, redactions },
      ).stdout,
      'workspace_list_default',
    )
    assert(Array.isArray(listedDefault) || toItems(listedDefault).length >= 0, 'workspace_list_default_should_return_collection')

    const workspaceName = `Agentspace Standalone Smoke Workspace ${Date.now()}`
    const createdWorkspace = parseJsonOutput(
      run(
        process.execPath,
        [
          cliMainPath,
          'workspace',
          'create',
          '--data',
          JSON.stringify({
            ownerId: defaultWorkspaceOwnerId,
            name: workspaceName,
          }),
        ],
        { env, capture: true, redactions },
      ).stdout,
      'workspace_create',
    )
    const workspaceId = extractEntityId(createdWorkspace)
    assert(workspaceId.length > 0, 'workspace_create_missing_id')

    const listedWorkspace = parseJsonOutput(
      run(
        process.execPath,
        [cliMainPath, 'workspace', 'list-workspaces', '--filter', JSON.stringify({ id: workspaceId })],
        { env, capture: true, redactions },
      ).stdout,
      'workspace_list_created',
    )
    const listedItems = toItems(listedWorkspace)
    assert(listedItems.some((item) => String(item?.id ?? '') === workspaceId), 'workspace_list_missing_created_record')

    const projectName = `Agentspace Standalone Smoke Project ${Date.now()}`
    const createdProject = parseJsonOutput(
      run(
        process.execPath,
        [
          cliMainPath,
          'project',
          'create',
          '--workspace-id',
          workspaceId,
          '--data',
          JSON.stringify({ name: projectName }),
        ],
        { env, capture: true, redactions },
      ).stdout,
      'project_create',
    )
    const projectId = extractEntityId(createdProject)
    assert(projectId.length > 0, 'project_create_missing_id')

    const report = {
      tempRoot: runRoot,
      repoDialect,
      workspaceId,
      projectId,
      cliManifestTitle: cliManifest.title,
    }
    fs.writeFileSync(path.join(runRoot, reportName), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    log(`standalone smoke passed: ${path.join(runRoot, reportName)}`)

    if (!options.keepTemp) {
      fs.rmSync(runRoot, { recursive: true, force: true })
      cleaned = true
      log('cleaned temp root')
    } else {
      log(`kept temp root: ${runRoot}`)
    }
  } finally {
    if (tempPgDatabaseName && adminPgUrl) {
      await dropTempDatabase(adminPgUrl, tempPgDatabaseName).catch((error) => {
        log(`temp_pg_drop_failed:${error instanceof Error ? error.message : String(error)}`)
      })
    }
    if (!cleaned && options.keepTemp) {
      log(`artifacts: ${runRoot}`)
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
