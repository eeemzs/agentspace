import { z } from 'zod'
import { IbmZodSchema } from '@aopslab/xf-bm'
import {
  CODEX_CHAT_EXECUTION_MODES,
  CODEX_CHAT_REASONING_EFFORTS,
  CODEX_CHAT_SANDBOX_MODES,
} from '../../types.js'
import { ICodexChatSettingZodCtx } from './resources.js'

export const codexChatSettingZodSchema = z.object({
  ...IbmZodSchema.shape,
  workspaceId: z.string(),
  userId: z.string(),
  binaryPath: z.string().optional(),
  model: z.string().optional(),
  reasoningEffort: z.enum(CODEX_CHAT_REASONING_EFFORTS).optional(),
  profile: z.string().optional(),
  executionMode: z.enum(CODEX_CHAT_EXECUTION_MODES),
  sandboxMode: z.enum(CODEX_CHAT_SANDBOX_MODES),
  manualCwd: z.string().optional(),
  autoStart: z.boolean().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
})

/* Insert schema */
export const codexChatSettingZodSchemaInsert = codexChatSettingZodSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    tenantId: true,
  })
  .strict()

export const createCodexChatSettingZodSchemaWithContext = (_ctx?: ICodexChatSettingZodCtx) => {
  return codexChatSettingZodSchema.strict()
}

