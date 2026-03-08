import { DEFAULT_TENANT_AS_UUID_STRING } from '@aopslab/xf-core'
import { z } from 'zod'

export const EnvSchema = z.object({
  TENANT_ID: z.string().uuid().optional(),
  LOG_LEVEL: z.string().optional(),
  AOPS_PG_URL: z.string().url().optional(),
})

export type AopsKitEnvConfig = {
  tenantId: string
  logLevel: string
  repoUrl: string
}

export type AopsKitEnvEntry = {
  label: string
  config: AopsKitEnvConfig
}

const AOPS_ENV_KEYS = ['envDefault'] as const
export type AopsKitEnvKey = (typeof AOPS_ENV_KEYS)[number]
export const DEFAULT_AOPS_ENV_KEY: AopsKitEnvKey = 'envDefault'

function resolveRepoUrl(params: { explicit?: string; fallback?: string; label: string }): string {
  const value = params.explicit ?? params.fallback
  if (!value) {
    throw new Error(`Missing required configuration: ${params.label}`)
  }
  return value
}

function buildEnvConfigurations(): Record<AopsKitEnvKey, AopsKitEnvEntry> {
  const parsed = EnvSchema.safeParse(process.env)
  const e = parsed.success ? parsed.data : ({} as z.infer<typeof EnvSchema>)

  const defaultTenantId = e.TENANT_ID ?? DEFAULT_TENANT_AS_UUID_STRING
  const defaultLogLevel = process.env.NODE_ENV === 'development' ? 'debug' : e.LOG_LEVEL ?? 'info'
  const repoUrl = resolveRepoUrl({ explicit: e.AOPS_PG_URL, label: 'AOPS_PG_URL' })

  return {
    envDefault: {
      label: 'env-default (process.env)',
      config: {
        tenantId: defaultTenantId,
        logLevel: defaultLogLevel,
        repoUrl,
      },
    },
  }
}

let cachedEnvConfigurations: Record<AopsKitEnvKey, AopsKitEnvEntry> | null = null

function getEnvConfigurations(): Record<AopsKitEnvKey, AopsKitEnvEntry> {
  if (!cachedEnvConfigurations) {
    cachedEnvConfigurations = buildEnvConfigurations()
  }
  return cachedEnvConfigurations
}

function getAopsKitEnvMatrixInternal(): Array<{ key: AopsKitEnvKey } & AopsKitEnvEntry> {
  const envConfigurations = getEnvConfigurations()
  return (Object.entries(envConfigurations) as Array<[AopsKitEnvKey, AopsKitEnvEntry]>).map(([key, entry]) => ({
    key,
    ...entry,
  }))
}

function createEnvProxy(): AopsKitEnvConfig {
  return new Proxy({} as AopsKitEnvConfig, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined
      const cfg = getAopsKitEnvConfig()
      if (!(prop in cfg)) return undefined
      return cfg[prop as keyof AopsKitEnvConfig]
    },
    ownKeys() {
      return Reflect.ownKeys(getAopsKitEnvConfig())
    },
    getOwnPropertyDescriptor(_target, prop) {
      const cfg = getAopsKitEnvConfig()
      if (typeof prop === 'string' && prop in cfg) {
        return { enumerable: true, configurable: true, value: cfg[prop as keyof AopsKitEnvConfig] }
      }
      return undefined
    },
  })
}

function createEnvMatrixProxy(): Array<{ key: AopsKitEnvKey } & AopsKitEnvEntry> {
  return new Proxy([] as Array<{ key: AopsKitEnvKey } & AopsKitEnvEntry>, {
    get(_target, prop) {
      return Reflect.get(getAopsKitEnvMatrixInternal(), prop)
    },
    ownKeys() {
      return Reflect.ownKeys(getAopsKitEnvMatrixInternal())
    },
    getOwnPropertyDescriptor(_target, prop) {
      const matrix = getAopsKitEnvMatrixInternal()
      const value = Reflect.get(matrix, prop)
      if (value === undefined) return undefined
      return { enumerable: true, configurable: true, value }
    },
  })
}

export const env: AopsKitEnvConfig = createEnvProxy()

export const aopsEnvMatrix: Array<{ key: AopsKitEnvKey } & AopsKitEnvEntry> = createEnvMatrixProxy()

export function getAopsKitEnvConfig(key: AopsKitEnvKey = DEFAULT_AOPS_ENV_KEY): AopsKitEnvConfig {
  return getEnvConfigurations()[key].config
}
