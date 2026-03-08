import { z } from 'zod'
import { IbmZodSchema } from '@aopslab/xf-bm'
import { ISkillSetItemZodCtx } from './resources.js'

export const skillSetItemZodSchema = z.object({
  ...IbmZodSchema.shape,
  workspaceId: z.string(),
  skillSetId: z.string(),
  skillVersionId: z.string(),
  position: z.number().int(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  meta: z.unknown().optional(),
})

/* Insert schema */
export const skillSetItemZodSchemaInsert = skillSetItemZodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
}).strict()

/* with context -> may not be used for all cases - is used when i18n is needed
   Create with context - resource must be defined and ctx must be provided
*/
export const createSkillSetItemZodSchemaWithContext = (_ctx?: ISkillSetItemZodCtx) => {
  return skillSetItemZodSchema.strict()
}
