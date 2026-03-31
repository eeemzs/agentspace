import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs'
import os from 'node:os'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const SQLITE_TABLE_SENTINELS = [
  { table: 'workspaces', requiredColumns: ['scopeId'] },
  { table: 'projects', requiredColumns: ['scopeId'] },
  { table: 'scopes', requiredColumns: ['type', 'parentScopeId'] },
] as const
const cliRoot = fileURLToPath(new URL('../', import.meta.url))
const sqliteBootstrapSqlPath = resolve(cliRoot, 'resources', 'sqlite-bootstrap.sql')
const nodeRequire = createRequire(import.meta.url)

function requireNodeSqlite(): typeof import('node:sqlite') {
  return nodeRequire('node:sqlite') as typeof import('node:sqlite')
}

export function isSqliteRepoUrl(repoUrl: string): boolean {
  const normalized = repoUrl.trim().toLowerCase()
  if (!normalized) return false
  if (normalized === ':memory:') return true
  if (normalized.startsWith('sqlite:') || normalized.startsWith('file:')) return true
  return normalized.endsWith('.db') || normalized.endsWith('.sqlite') || normalized.endsWith('.sqlite3')
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

export function getDefaultAgentspaceSqlitePath(): string {
  return resolve(os.homedir(), '.aops', 'agentspace.aops.sqlite')
}

export function getDefaultAgentspaceSqliteRepoUrl(): string {
  return `file:${getDefaultAgentspaceSqlitePath()}`
}

function hasAgentspaceSchema(filename: string): boolean {
  const { DatabaseSync } = requireNodeSqlite()
  const db = new DatabaseSync(filename)
  try {
    return SQLITE_TABLE_SENTINELS.every(({ table, requiredColumns }) => {
      const found = db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
        .get(table) as { name?: string } | undefined
      if (found?.name !== table) return false

      const columns = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name?: string }>
      const columnNames = new Set(columns.map((column) => String(column?.name ?? '')))
      return requiredColumns.every((column) => columnNames.has(column))
    })
  } finally {
    db.close()
  }
}

function applyBootstrapSql(filename: string): void {
  if (!existsSync(sqliteBootstrapSqlPath)) {
    throw new Error(`missing_sqlite_bootstrap_sql:${sqliteBootstrapSqlPath}`)
  }

  const { DatabaseSync } = requireNodeSqlite()
  const sql = readFileSync(sqliteBootstrapSqlPath, 'utf8')
  const db = new DatabaseSync(filename)
  try {
    db.exec(sql)
  } finally {
    db.close()
  }
}

export function ensureAgentspaceSqliteSchemaReady(repoUrlRaw: string | undefined): void {
  const repoUrl = String(repoUrlRaw ?? '').trim()
  if (!repoUrl || !isSqliteRepoUrl(repoUrl)) return

  const filename = resolveSqliteFilename(repoUrl)
  if (filename === ':memory:') return

  mkdirSync(dirname(filename), { recursive: true })
  if (!existsSync(filename)) {
    const fd = openSync(filename, 'a')
    closeSync(fd)
  }

  if (hasAgentspaceSchema(filename)) return

  try {
    applyBootstrapSql(filename)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`sqlite_schema_bootstrap_failed:${message}`)
  }
}
