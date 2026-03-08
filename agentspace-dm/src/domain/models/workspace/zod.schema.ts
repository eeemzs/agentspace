import { z } from 'zod'
import { IbmZodSchema } from '@aopslab/xf-bm'
import { IWorkspaceZodCtx } from './resources.js'

export const workspaceZodSchema = z
  .object({
    ...IbmZodSchema.shape,
    ownerId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    sharingEnabled: z.boolean().optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })

/* Insert schema */
export const workspaceZodSchemaInsert = workspaceZodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
}).strict()

/* with context -> may not be used for all cases - is used when i18n is needed
   Create with context - resource must be defined and ctx must be provided
*/
export const createWorkspaceZodSchemaWithContext = (ctx?: IWorkspaceZodCtx) => {
  /*
    const { v, f, t, forField } = ctx ?? {}
    t?.('fields.sampleField.label')
  */
  return workspaceZodSchema.strict()
}
