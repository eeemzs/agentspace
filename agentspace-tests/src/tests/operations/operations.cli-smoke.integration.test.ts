import { beforeAll, describe, expect, it } from 'vitest'
import { ensureCliRuntimeReady } from '../../config/config.js'
import {
  cliPackageVersion,
  runAgentspaceCliTextWithoutRepo,
  runAgentspaceCliWithoutRepo,
} from './agentspace-cli.harness.js'

describe('agentspace-cli version/help/manifest', () => {
  beforeAll(async () => {
    await ensureCliRuntimeReady()
  })

  it('supports --version', async () => {
    const version = await runAgentspaceCliTextWithoutRepo(['--version'])
    expect(version).toBe(cliPackageVersion)
  })

  it('supports contextual --help for static and operation commands', async () => {
    const rootHelp = await runAgentspaceCliTextWithoutRepo(['--help'])
    expect(rootHelp).toContain('agentspace-cli')
    expect(rootHelp).toContain('agentspace manifest cli')

    const workspaceHelp = await runAgentspaceCliTextWithoutRepo(['workspace', 'list-workspaces', '--help'])
    expect(workspaceHelp).toContain('agentspace workspace list-workspaces')
    expect(workspaceHelp).toContain('Generated from Agentspace DCM docs, shared contract args/examples, and host route projection.')

    const opHelp = await runAgentspaceCliTextWithoutRepo(['op', 'agentspace.workspace.list-workspaces', '--help'])
    expect(opHelp).toContain('agentspace op')
    expect(opHelp).toContain('agentspace workspace list-workspaces')
  })

  it('supports manifest cli/get/show browse flows', async () => {
    const cliManifest = (await runAgentspaceCliWithoutRepo(['manifest', 'cli'])) as {
      kind?: string
      commandsById?: Record<string, unknown>
      artifacts?: unknown[]
    }
    expect(String(cliManifest.kind ?? '')).toBe('agentspace-cli-projection')
    expect(Object.prototype.hasOwnProperty.call(cliManifest.commandsById ?? {}, 'manifest.get')).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(cliManifest.commandsById ?? {}, 'workspace.list-workspaces')).toBe(true)
    expect(Array.isArray(cliManifest.artifacts)).toBe(true)

    const dcmOperationDocs = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'dcm', '--path', 'docs.operations.workspace.list-workspaces'],
    )) as { summary?: string }
    expect(String(dcmOperationDocs.summary ?? '').toLowerCase()).toContain('workspace')

    const domainDocs = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'dcm', '--path', 'docs.domain'],
    )) as { notes?: string[] }
    expect(Array.isArray(domainDocs.notes) && domainDocs.notes.some((note) => note.includes('aops-skill-package-v1'))).toBe(true)
    expect(Array.isArray(domainDocs.notes) && domainDocs.notes.some((note) => note.includes('pnpm run manifest:sync'))).toBe(true)
    expect(Array.isArray(domainDocs.notes) && domainDocs.notes.some((note) => note.includes('aops-cli host diagnostics --reset --warmup'))).toBe(true)

    const skillPackageDocs = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'dcm', '--path', 'docs.operations.skill-version.import-skill-package'],
    )) as { summary?: string; notes?: string[]; examples?: string[] }
    expect(String(skillPackageDocs.summary ?? '').toLowerCase()).toContain('skill package')
    expect(Array.isArray(skillPackageDocs.notes) && skillPackageDocs.notes.some((note) => note.includes('SKILL.md'))).toBe(true)
    expect(Array.isArray(skillPackageDocs.examples) && skillPackageDocs.examples.some((example) => example.includes('"bundle"'))).toBe(true)

    const workflowInstanceDocs = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'dcm', '--path', 'docs.operations.workflow-instance.list-workflow-instances'],
    )) as { summary?: string }
    expect(String(workflowInstanceDocs.summary ?? '').toLowerCase()).toContain('workflow')

    const agentRunEventDocs = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'dcm', '--path', 'docs.operations.agent-run-event.list-agent-run-events'],
    )) as { summary?: string }
    expect(String(agentRunEventDocs.summary ?? '').toLowerCase()).toContain('agent run events')

    const cliCommandDescriptor = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'cli', '--path', 'commandsById.workspace.list-workspaces'],
    )) as { title?: string }
    expect(String(cliCommandDescriptor.title ?? '')).toBe('agentspace workspace list-workspaces')

    const workflowCliCommandDescriptor = (await runAgentspaceCliWithoutRepo(
      ['manifest', 'get', 'cli', '--path', 'commandsById.workflow-instance.list-workflow-instances'],
    )) as { title?: string }
    expect(String(workflowCliCommandDescriptor.title ?? '')).toBe('agentspace workflow-instance list-workflow-instances')

    const hrmShow = await runAgentspaceCliTextWithoutRepo(['manifest', 'show', 'hrm'])
    expect(hrmShow).toContain('agentspace manifest show host-registration')
    expect(hrmShow).toContain('runtime registration metadata only')

    const cliShow = await runAgentspaceCliTextWithoutRepo(
      ['manifest', 'show', 'cli', '--path', 'commandsById.workspace.list-workspaces'],
    )
    expect(cliShow).toContain('agentspace manifest show cli --path commandsById.workspace.list-workspaces')
    expect(cliShow).toContain('agentspace workspace list-workspaces')

    const workflowCliShow = await runAgentspaceCliTextWithoutRepo(
      ['manifest', 'show', 'cli', '--path', 'commandsById.workflow-instance.list-workflow-instances'],
    )
    expect(workflowCliShow).toContain('agentspace manifest show cli --path commandsById.workflow-instance.list-workflow-instances')
    expect(workflowCliShow).toContain('agentspace workflow-instance list-workflow-instances')
  })
})
