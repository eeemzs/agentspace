#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptRoot = dirname(fileURLToPath(import.meta.url))
const domainRoot = resolve(scriptRoot, '..', '..')
const sqliteTmpRoot = resolve(domainRoot, '.tmp')
const SQLITE_TEST_FILE_PREFIX = 'agentspace-tests-'
const SQLITE_TEST_FILE_MARKER = '.sqlite'
const DEFAULT_SQLITE_TMP_RETENTION_HOURS = 24

function printUsage() {
  process.stdout.write(
    [
      'agentspace integration test launcher',
      '',
      'Usage:',
      '  pnpm --filter @aopslab/domain-tests-agentspace run test:matrix -- --repos=<pg|sqlite|pg,sqlite> [--runner=<tsx|node>] [--force-cli-build] [-- <vitest-args...>]',
      '',
      'Examples:',
      '  pnpm --filter @aopslab/domain-tests-agentspace run test:matrix -- --repos=sqlite --runner=node',
      '  pnpm --filter @aopslab/domain-tests-agentspace run test:matrix -- --repos=pg,sqlite --runner=tsx -- -t "supports workspace CRUD across repo variants"',
      '',
    ].join('\n'),
  )
}

function parseArgs(argv) {
  const options = new Map()
  const passthrough = []
  let afterDoubleDash = false

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (afterDoubleDash) {
      passthrough.push(token)
      continue
    }

    if (token === '--') {
      afterDoubleDash = true
      continue
    }

    if (!token.startsWith('--')) {
      passthrough.push(token)
      continue
    }

    const equalAt = token.indexOf('=')
    if (equalAt > -1) {
      const key = token.slice(2, equalAt).trim().toLowerCase()
      const value = token.slice(equalAt + 1).trim()
      options.set(key, value)
      continue
    }

    const key = token.slice(2).trim().toLowerCase()
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      options.set(key, 'true')
      continue
    }
    options.set(key, next.trim())
    index += 1
  }

  return { options, passthrough }
}

function fail(message) {
  process.stderr.write(`${message}\n\n`)
  printUsage()
  process.exit(1)
}

const repoTokenMap = {
  pg: 'drizzle',
  postgres: 'drizzle',
  postgresql: 'drizzle',
  drizzle: 'drizzle',
  'drizzle-pg': 'drizzle',
  sqlite: 'drizzle-sqlite',
  'drizzle-sqlite': 'drizzle-sqlite',
}

function normalizeRepoVariants(rawRepos) {
  const raw = String(rawRepos ?? '').trim()
  if (!raw) {
    fail('missing_required_option:--repos (at least one of pg, sqlite)')
  }

  const selected = []
  for (const tokenRaw of raw.split(',')) {
    const token = tokenRaw.trim().toLowerCase()
    if (!token) continue
    const mapped = repoTokenMap[token]
    if (!mapped) {
      fail(`invalid_repo_token:${token}`)
    }
    if (!selected.includes(mapped)) {
      selected.push(mapped)
    }
  }

  if (selected.length === 0) {
    fail('missing_required_option:--repos (at least one of pg, sqlite)')
  }
  return selected
}

function normalizeRunner(rawRunner) {
  const normalized = String(rawRunner ?? 'tsx').trim().toLowerCase()
  if (normalized !== 'tsx' && normalized !== 'node') {
    fail(`invalid_runner:${normalized} (allowed: tsx,node)`)
  }
  return normalized
}

function toBoolean(raw) {
  const normalized = String(raw ?? '').trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

function sanitizeRunId(raw) {
  const normalized = String(raw ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
  return normalized || 'run'
}

function resolveSqliteTmpRetentionMs() {
  const raw = String(process.env.AGENTSPACE_TEST_SQLITE_TMP_RETENTION_HOURS ?? DEFAULT_SQLITE_TMP_RETENTION_HOURS).trim()
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SQLITE_TMP_RETENTION_HOURS * 60 * 60 * 1000
  }
  return parsed * 60 * 60 * 1000
}

function listSqliteTestArtifacts() {
  if (!existsSync(sqliteTmpRoot)) return []
  return readdirSync(sqliteTmpRoot)
    .filter((entry) => entry.startsWith(SQLITE_TEST_FILE_PREFIX) && entry.includes(SQLITE_TEST_FILE_MARKER))
    .map((entry) => ({
      name: entry,
      path: resolve(sqliteTmpRoot, entry),
    }))
}

function safeRemoveFile(path) {
  try {
    rmSync(path, { force: true })
  } catch {}
}

function cleanupStaleSqliteArtifacts(currentRunId) {
  const staleBeforeMs = Date.now() - resolveSqliteTmpRetentionMs()
  const currentRunPrefix = `${SQLITE_TEST_FILE_PREFIX}${currentRunId}-`
  for (const artifact of listSqliteTestArtifacts()) {
    if (artifact.name.startsWith(currentRunPrefix)) continue
    let stats
    try {
      stats = statSync(artifact.path)
    } catch {
      continue
    }
    if (stats.mtimeMs >= staleBeforeMs) continue
    safeRemoveFile(artifact.path)
  }
}

function cleanupCurrentRunSqliteArtifacts(runId, exitCode) {
  if (toBoolean(process.env.AGENTSPACE_TEST_KEEP_SQLITE_TMP)) return
  if ((exitCode ?? 1) !== 0) return

  const runPrefix = `${SQLITE_TEST_FILE_PREFIX}${runId}-`
  for (const artifact of listSqliteTestArtifacts()) {
    if (!artifact.name.startsWith(runPrefix)) continue
    safeRemoveFile(artifact.path)
  }
}

function run() {
  const { options, passthrough } = parseArgs(process.argv.slice(2))
  if (options.has('help') || options.has('h')) {
    printUsage()
    return
  }

  const repoInput = options.get('repos') ?? options.get('repo-types')
  const selectedVariants = normalizeRepoVariants(repoInput)
  const runner = normalizeRunner(options.get('runner') ?? options.get('cli-runner'))
  const forceCliBuild = toBoolean(options.get('force-cli-build'))
  const runId = sanitizeRunId(process.env.AGENTSPACE_TEST_RUN_ID ?? randomUUID())

  const env = {
    ...process.env,
    AGENTSPACE_TEST_VARIANTS: selectedVariants.join(','),
    AGENTSPACE_TEST_CLI_RUNNER: runner,
    AGENTSPACE_TEST_RUN_ID: runId,
  }
  if (forceCliBuild) {
    env.AGENTSPACE_TEST_FORCE_CLI_BUILD = '1'
  }

  cleanupStaleSqliteArtifacts(runId)

  process.stdout.write(
    `[agentspace-tests] selected variants: ${selectedVariants.join(', ')} | cli runner: ${runner}\n`,
  )

  const require = createRequire(import.meta.url)
  const vitestPkg = require.resolve('vitest/package.json')
  const vitestCli = resolve(dirname(vitestPkg), 'vitest.mjs')
  const child = spawn(
    process.execPath,
    [vitestCli, 'run', '--config', 'vite.config.ts', ...passthrough],
    {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
      shell: false,
    },
  )

  child.once('error', (error) => {
    process.stderr.write(`[agentspace-tests] launcher_failed:${String(error)}\n`)
    process.exit(1)
  })

  child.once('close', (code) => {
    cleanupCurrentRunSqliteArtifacts(runId, code ?? 1)
    process.exit(code ?? 1)
  })
}

run()
