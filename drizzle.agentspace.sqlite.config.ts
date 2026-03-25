import 'dotenv/config'

const agentspaceTables = [
  'agent-run-events',
  'agent-runs',
  'agent-sessions',
  'aops-kanban-columns',
  'artifact-links',
  'artifacts',
  'codex-chat-messages',
  'codex-chat-settings',
  'codex-chat-threads',
  'kanban-boards',
  'memory-items',
  'project-members',
  'project-paths',
  'project-summaries',
  'projects',
  'prompt-versions',
  'prompts',
  'resources',
  'skill-set-items',
  'skill-sets',
  'skill-versions',
  'skills',
  'sprint-items',
  'sprints',
  'tags',
  'task-comments',
  'tasks',
  'workflow-instances',
  'workflow-step-runs',
  'workspace-members',
  'workspaces',
]

export default {
  out: './drizzle-out/agentspace-sqlite',
  schema: ['./agentspace-dm/dist/infrastructure/db/drizzle/drizzle.schema.sqlite.index.js'],
  tablesFilter: agentspaceTables,
  dialect: 'sqlite',
  casing: 'camelCase',
  dbCredentials: {
    url:
      process.env.AGENTSPACE_REPO_URL ||
      process.env.AGENTSPACE_SQLITE_URL ||
      'file:./drizzle-out/agentspace/agentspace.sqlite',
  },
}
