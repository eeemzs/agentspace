import 'dotenv/config'

const agentspaceTables = [
  'activity-items',
  'agent-run-events',
  'agent-runs',
  'agent-sessions',
  'artifact-links',
  'artifacts',
  'codex-chat-messages',
  'codex-chat-settings',
  'codex-chat-threads',
  'memory-items',
  'project-members',
  'project-paths',
  'projects',
  'prompt-versions',
  'prompts',
  'resources',
  'skill-versions',
  'skills',
  'tags',
  'workflow-instances',
  'workflow-step-runs',
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
