import { DEFAULT_TENANT_AS_UUID_STRING } from '@aopslab/xf-core'
import { z } from 'zod'

export const EnvSchema = z.object({
  TENANT_ID: z.string().uuid().optional(),
  LOG_LEVEL: z.string().optional(),
  AOPS_PG_URL: z.string().url().optional(),
})

export type AgentspaceKitEnvConfig = {
  tenantId: string
  logLevel: string
  repoUrl: string
}

export type AgentspaceKitEnvEntry = {
  label: string
  config: AgentspaceKitEnvConfig
}

const AGENTSPACE_ENV_KEYS = ['envDefault'] as const
export type AgentspaceKitEnvKey = (typeof AGENTSPACE_ENV_KEYS)[number]
export const DEFAULT_AGENTSPACE_ENV_KEY: AgentspaceKitEnvKey = 'envDefault'

function resolveRepoUrl(params: { explicit?: string; fallback?: string; label: string }): string {
  const value = params.explicit ?? params.fallback
  if (!value) {
    throw new Error(`Missing required configuration: ${params.label}`)
  }
  return value
}

function buildEnvConfigurations(): Record<AgentspaceKitEnvKey, AgentspaceKitEnvEntry> {
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

let cachedEnvConfigurations: Record<AgentspaceKitEnvKey, AgentspaceKitEnvEntry> | null = null

function getEnvConfigurations(): Record<AgentspaceKitEnvKey, AgentspaceKitEnvEntry> {
  if (!cachedEnvConfigurations) {
    cachedEnvConfigurations = buildEnvConfigurations()
  }
  return cachedEnvConfigurations
}

function getAgentspaceKitEnvMatrixInternal(): Array<{ key: AgentspaceKitEnvKey } & AgentspaceKitEnvEntry> {
  const envConfigurations = getEnvConfigurations()
  return (Object.entries(envConfigurations) as Array<[AgentspaceKitEnvKey, AgentspaceKitEnvEntry]>).map(([key, entry]) => ({
    key,
    ...entry,
  }))
}

function createEnvProxy(): AgentspaceKitEnvConfig {
  return new Proxy({} as AgentspaceKitEnvConfig, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined
      const cfg = getAgentspaceKitEnvConfig()
      if (!(prop in cfg)) return undefined
      return cfg[prop as keyof AgentspaceKitEnvConfig]
    },
    ownKeys() {
      return Reflect.ownKeys(getAgentspaceKitEnvConfig())
    },
    getOwnPropertyDescriptor(_target, prop) {
      const cfg = getAgentspaceKitEnvConfig()
      if (typeof prop === 'string' && prop in cfg) {
        return { enumerable: true, configurable: true, value: cfg[prop as keyof AgentspaceKitEnvConfig] }
      }
      return undefined
    },
  })
}

function createEnvMatrixProxy(): Array<{ key: AgentspaceKitEnvKey } & AgentspaceKitEnvEntry> {
  return new Proxy([] as Array<{ key: AgentspaceKitEnvKey } & AgentspaceKitEnvEntry>, {
    get(_target, prop) {
      return Reflect.get(getAgentspaceKitEnvMatrixInternal(), prop)
    },
    ownKeys() {
      return Reflect.ownKeys(getAgentspaceKitEnvMatrixInternal())
    },
    getOwnPropertyDescriptor(_target, prop) {
      const matrix = getAgentspaceKitEnvMatrixInternal()
      const value = Reflect.get(matrix, prop)
      if (value === undefined) return undefined
      return { enumerable: true, configurable: true, value }
    },
  })
}

export const env: AgentspaceKitEnvConfig = createEnvProxy()

export const agentspaceEnvMatrix: Array<{ key: AgentspaceKitEnvKey } & AgentspaceKitEnvEntry> = createEnvMatrixProxy()

export function getAgentspaceKitEnvConfig(key: AgentspaceKitEnvKey = DEFAULT_AGENTSPACE_ENV_KEY): AgentspaceKitEnvConfig {
  return getEnvConfigurations()[key].config
}
