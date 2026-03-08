import { z } from 'zod'
import { IbmZodSchema } from '@aopslab/xf-bm'
import { IProjectSummaryZodCtx } from './resources.js'

export const projectSummaryZodSchema = z
  .object({
    ...IbmZodSchema.shape,
    workspaceId: z.string(),
    projectId: z.string(),
    summary: z.string().optional(),
    decisions: z.unknown().optional(),
    openItems: z.unknown().optional(),
    lastRunId: z.string().optional(),
    lastSessionId: z.string().optional(),
  })

/* Insert schema */
export const projectSummaryZodSchemaInsert = projectSummaryZodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
}).strict()

/* with context -> may not be used for all cases - is used when i18n is needed
   Create with context - resource must be defined and ctx must be provided
*/
export const createProjectSummaryZodSchemaWithContext = (ctx?: IProjectSummaryZodCtx) => {
  /*
    const { v, f, t, forField } = ctx ?? {}
    t?.('fields.sampleField.label')
  */
  return projectSummaryZodSchema.strict()
}
