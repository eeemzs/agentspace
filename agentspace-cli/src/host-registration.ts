import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type AgentspaceHostRegistrationPathMode = 'portable' | 'installed' | 'package'

export type AgentspaceHostRegistrationManifest = {
  kind: 'aops-host-registration'
  registrationVersion: '1'
  domain: 'agentspace'
  displayName: 'Agentspace'
  packageName: string
  description: string
  baseDir?: string
  notes?: string[]
  pluginLoader: {
    allowlist: string[]
    strictAllowlist: false
    tolerantBootstrap: false
  }
  manifestProviders: Array<{
    id: 'agentspace-dcm'
    domain: 'agentspace'
    enabled: true
    module: string
    exportName: 'buildAgentspaceDomainCapabilityManifest'
    options: {
      includeDocs: true
    }
  }>
  plugins: Array<{
    domain: 'agentspace'
    enabled: true
    module: string
    factory: 'createAgentspacePlugin'
    options: {
      defaultTenantId: '123e4567-e89b-41d4-a000-000000000001'
    }
  }>
}

type PackageDescriptor = {
  packageName: string
  packageRoot: string
  mainEntry: string
  version: string
}

const requireFromHere = createRequire(import.meta.url)

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T
}

function getCliPackageDescriptor(): PackageDescriptor {
  const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url))
  const packageRoot = path.dirname(packageJsonPath)
  const packageJson = readJsonFile<{ name?: string; main?: string; version?: string }>(packageJsonPath)
  return {
    packageName: packageJson.name?.trim() || '@aopslab/domain-cli-agentspace',
    packageRoot,
    mainEntry: path.resolve(packageRoot, packageJson.main?.trim() || 'dist/main.js'),
    version: packageJson.version?.trim() || '0.0.0',
  }
}

function resolvePackageDescriptor(packageName: string): PackageDescriptor {
  const packageJsonPath = requireFromHere.resolve(`${packageName}/package.json`)
  const packageRoot = path.dirname(packageJsonPath)
  const packageJson = readJsonFile<{ main?: string; version?: string }>(packageJsonPath)
  return {
    packageName,
    packageRoot,
    mainEntry: path.resolve(packageRoot, packageJson.main?.trim() || 'dist/index.js'),
    version: packageJson.version?.trim() || '0.0.0',
  }
}

function toPortablePath(fromDir: string, targetPath: string): string {
  const relative = path.relative(fromDir, targetPath).split(path.sep).join('/')
  if (relative.startsWith('.')) return relative
  return `./${relative}`
}

export function buildAgentspaceHostRegistrationManifest(
  options: {
    mode?: AgentspaceHostRegistrationPathMode
  } = {},
): AgentspaceHostRegistrationManifest {
  const mode = options.mode ?? 'installed'
  const cli = getCliPackageDescriptor()
  const kitPackage = '@aopslab/domain-kit-agentspace'
  const hostPluginPackage = '@aopslab/domain-host-plugin-agentspace'
  const kit = mode === 'package' ? null : resolvePackageDescriptor(kitPackage)
  const hostPlugin = mode === 'package' ? null : resolvePackageDescriptor(hostPluginPackage)
  const portable = mode === 'portable'
  const packageMode = mode === 'package'
  const baseDir = portable ? '../..' : packageMode ? undefined : cli.packageRoot
  const specifierBaseDir = portable ? cli.packageRoot : ''
  const toolingModule = packageMode
    ? kitPackage
    : portable
      ? toPortablePath(specifierBaseDir, kit!.mainEntry)
      : kit!.mainEntry
  const pluginModule = packageMode
    ? hostPluginPackage
    : portable
      ? toPortablePath(specifierBaseDir, hostPlugin!.mainEntry)
      : hostPlugin!.mainEntry

  return {
    kind: 'aops-host-registration',
    registrationVersion: '1',
    domain: 'agentspace',
    displayName: 'Agentspace',
    packageName: cli.packageName,
    description: 'Context, memory, reusable assets, activity, and collaborative state tooling for AOPS-aligned runtimes.',
    ...(baseDir ? { baseDir } : {}),
    notes: [
      'Prefer registering from `agentspace manifest host-registration` when agentspace is installed outside the AOPS workspace.',
      'Package mode is intended for sealed payloads whose node_modules closure already contains the agentspace packages.',
    ],
    pluginLoader: {
      allowlist: [pluginModule],
      strictAllowlist: false,
      tolerantBootstrap: false,
    },
    manifestProviders: [
      {
        id: 'agentspace-dcm',
        domain: 'agentspace',
        enabled: true,
        module: toolingModule,
        exportName: 'buildAgentspaceDomainCapabilityManifest',
        options: {
          includeDocs: true,
        },
      },
    ],
    plugins: [
      {
        domain: 'agentspace',
        enabled: true,
        module: pluginModule,
        factory: 'createAgentspacePlugin',
        options: {
          defaultTenantId: '123e4567-e89b-41d4-a000-000000000001',
        },
      },
    ],
  }
}
