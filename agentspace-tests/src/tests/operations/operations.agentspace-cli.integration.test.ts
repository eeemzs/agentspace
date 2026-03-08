import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const testRoot = fileURLToPath(new URL('../../', import.meta.url))
const workspaceRoot = path.resolve(testRoot, '..', '..')
const cliRoot = path.resolve(workspaceRoot, 'agentspace-cli')
const cliNodeEntry = path.resolve(cliRoot, 'dist', 'main.js')
const cliPackageVersion = String(JSON.parse(fs.readFileSync(path.resolve(cliRoot, 'package.json'), 'utf8')).version ?? '0.0.0')

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

async function runAgentspaceCliText(args: string[]): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliNodeEntry, ...args], {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        AGENTSPACE_REPO_URL: '',
        AOPS_PG_URL: '',
        DEV_PG_URL: '',
        DOTENV_CONFIG_QUIET: 'true',
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

    child.once('error', (error) => reject(error))
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`agentspace_cli_failed:${args.join(' ')}\n${stdout}\n${stderr}`))
        return
      }
      resolve(stdout.trim())
    })
  })
}

async function runAgentspaceCliJson(args: string[]): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliNodeEntry, ...args], {
      cwd: workspaceRoot,
      env: {
        ...process.env,
        AGENTSPACE_REPO_URL: '',
        AOPS_PG_URL: '',
        DEV_PG_URL: '',
        DOTENV_CONFIG_QUIET: 'true',
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

    child.once('error', (error) => reject(error))
    child.once('close', (code) => {
      if (code !== 0) {
        reject(new Error(`agentspace_cli_failed:${args.join(' ')}\n${stdout}\n${stderr}`))
        return
      }
      try {
        resolve(extractJsonPayload(stdout))
      } catch (error) {
        reject(error)
      }
    })
  })
}

describe('agentspace-cli version/help/manifest', () => {
  it('supports --version', async () => {
    const version = await runAgentspaceCliText(['--version'])
    expect(version).toBe(cliPackageVersion)
  })

  it('supports contextual --help for static and operation commands', async () => {
    const rootHelp = await runAgentspaceCliText(['--help'])
    expect(rootHelp).toContain('agentspace-cli')
    expect(rootHelp).toContain('agentspace manifest cli')

    const workspaceHelp = await runAgentspaceCliText(['workspace', 'list-workspaces', '--help'])
    expect(workspaceHelp).toContain('agentspace workspace list-workspaces')
    expect(workspaceHelp).toContain('Generated from Agentspace DCM docs, shared contract args/examples, and host route projection.')

    const opHelp = await runAgentspaceCliText(['op', 'agentspace.workspace.list-workspaces', '--help'])
    expect(opHelp).toContain('agentspace op')
    expect(opHelp).toContain('agentspace workspace list-workspaces')
  })

  it('supports manifest cli/get/show browse flows', async () => {
    const cliManifest = (await runAgentspaceCliJson(['manifest', 'cli'])) as {
      kind?: string
      commandsById?: Record<string, unknown>
      artifacts?: unknown[]
    }
    expect(String(cliManifest.kind ?? '')).toBe('agentspace-cli-projection')
    expect(Object.prototype.hasOwnProperty.call(cliManifest.commandsById ?? {}, 'manifest.get')).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(cliManifest.commandsById ?? {}, 'workspace.list-workspaces')).toBe(true)
    expect(Array.isArray(cliManifest.artifacts)).toBe(true)

    const dcmOperationDocs = (await runAgentspaceCliJson(
      ['manifest', 'get', 'dcm', '--path', 'docs.operations.workspace.list-workspaces'],
    )) as { summary?: string }
    expect(String(dcmOperationDocs.summary ?? '').toLowerCase()).toContain('workspace')

    const cliCommandDescriptor = (await runAgentspaceCliJson(
      ['manifest', 'get', 'cli', '--path', 'commandsById.workspace.list-workspaces'],
    )) as { title?: string }
    expect(String(cliCommandDescriptor.title ?? '')).toBe('agentspace workspace list-workspaces')

    const hrmShow = await runAgentspaceCliText(['manifest', 'show', 'hrm'])
    expect(hrmShow).toContain('agentspace manifest show host-registration')
    expect(hrmShow).toContain('runtime registration metadata only')

    const cliShow = await runAgentspaceCliText(['manifest', 'show', 'cli', '--path', 'commandsById.workspace.list-workspaces'])
    expect(cliShow).toContain('agentspace manifest show cli --path commandsById.workspace.list-workspaces')
    expect(cliShow).toContain('agentspace workspace list-workspaces')
  })
})
