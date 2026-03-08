import { z } from 'zod'
import { IbmZodSchema } from '@aopslab/xf-bm'
import { WORKSPACE_MEMBER_ROLES } from '../../types.js'
import { IWorkspaceMemberZodCtx } from './resources.js'

export const workspaceMemberZodSchema = z
  .object({
    ...IbmZodSchema.shape,
    workspaceId: z.string(),
    userId: z.string(),
    role: z.enum(WORKSPACE_MEMBER_ROLES),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })

/* Insert schema */
export const workspaceMemberZodSchemaInsert = workspaceMemberZodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
}).strict()

/* with context -> may not be used for all cases - is used when i18n is needed
   Create with context - resource must be defined and ctx must be provided
*/
export const createWorkspaceMemberZodSchemaWithContext = (ctx?: IWorkspaceMemberZodCtx) => {
  return workspaceMemberZodSchema.strict()
}
