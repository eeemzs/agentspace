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
  'experience-items',
  'memory-items',
  'project-members',
  'project-paths',
  'projects',
  'prompt-versions',
  'prompts',
  'resources',
  'scopes',
  'skill-versions',
  'skills',
  'tags',
  'workflow-definitions',
  'workflow-instances',
  'workflow-step-runs',
]

export default {
  out: './drizzle-out/agentspace',
  schema: ['./agentspace-dm/dist/infrastructure/db/drizzle/drizzle.schema.index.js'],
  tablesFilter: agentspaceTables,
  dialect: 'postgresql',
  casing: 'camelCase',
  dbCredentials: {
    url:
      process.env.AGENTSPACE_REPO_URL ||
      process.env.AGENTSPACE_PG_URL ||
      process.env.AOPS_REPO_URL ||
      process.env.AOPS_PG_URL ||
      process.env.DEV_PG_URL ||
      process.env.POSTGRES_URL_LOCAL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/agentspace',
  },
}
