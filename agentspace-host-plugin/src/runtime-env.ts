import fs from 'node:fs'
import path from 'node:path'

import { normalizeNonEmpty } from '@aopslab/domain-kit-agentspace/shared'

const ENV_ASSIGNMENT_PATTERN = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/

let cachedDotEnvValues: Map<string, string> | null = null

function parseDotEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim()
  if (!trimmed) return ''
  const singleQuoted = /^'(.*)'$/.exec(trimmed)
  if (singleQuoted) return singleQuoted[1].trim()
  const doubleQuoted = /^"(.*)"$/.exec(trimmed)
  if (doubleQuoted) return doubleQuoted[1].trim()
  return trimmed
}

function parseDotEnvFile(content: string): Map<string, string> {
  const values = new Map<string, string>()
  for (const lineRaw of content.split(/\r?\n/g)) {
    const line = lineRaw.trim()
    if (!line || line.startsWith('#')) continue
    const matched = ENV_ASSIGNMENT_PATTERN.exec(line)
    if (!matched) continue
    const key = matched[1].trim()
    if (!key) continue
    const value = parseDotEnvValue(matched[2] ?? '')
    if (!value) continue
    values.set(key, value)
  }
  return values
}

function resolveDotEnvCandidates(): string[] {
  const candidates = [
    normalizeNonEmpty(process.env.DOTENV_CONFIG_PATH),
    normalizeNonEmpty(process.env.AOPS_ENV_PATH),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '../..', '.env'),
  ].filter((entry): entry is string => Boolean(entry))
  return Array.from(new Set(candidates))
}

function getDotEnvValues(): Map<string, string> {
  if (cachedDotEnvValues) return cachedDotEnvValues
  for (const candidate of resolveDotEnvCandidates()) {
    if (!fs.existsSync(candidate)) continue
    try {
      const content = fs.readFileSync(candidate, 'utf8')
      cachedDotEnvValues = parseDotEnvFile(content)
      return cachedDotEnvValues
    } catch {
      // ignore candidate and continue
    }
  }
  cachedDotEnvValues = new Map<string, string>()
  return cachedDotEnvValues
}

export function resolveMissingRuntimeEnvKeys(requiredKeys: string[]): string[] {
  const normalizedRequiredKeys = requiredKeys
    .map((key) => normalizeNonEmpty(key))
    .filter((key): key is string => Boolean(key))
  if (normalizedRequiredKeys.length === 0) return []

  const dotEnvValues = getDotEnvValues()
  return normalizedRequiredKeys.filter((key) => {
    const envValue = normalizeNonEmpty(process.env[key])
    if (envValue) return false
    const dotEnvValue = normalizeNonEmpty(dotEnvValues.get(key))
    return !dotEnvValue
  })
}

export function assertRuntimeEnv(requiredKeys: string[]): void {
  const missing = resolveMissingRuntimeEnvKeys(requiredKeys)
  if (missing.length === 0) return
  throw new Error(`runtime_env_missing:${missing[0]}`)
}
