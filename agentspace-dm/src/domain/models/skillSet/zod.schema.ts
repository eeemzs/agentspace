import { z } from 'zod'
import { IbmZodSchema } from '@aopslab/xf-bm'
import { scopeableFields } from '../../types.js'
import { ISkillSetZodCtx } from './resources.js'

export const skillSetZodSchema = z
  .object({
    ...IbmZodSchema.shape,
    workspaceId: z.string(),
    projectId: z.string().optional(),
    ...scopeableFields,
    name: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
  })

/* Insert schema */
export const skillSetZodSchemaInsert = skillSetZodSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  tenantId: true,
}).strict()

/* with context -> may not be used for all cases - is used when i18n is needed
   Create with context - resource must be defined and ctx must be provided
*/
export const createSkillSetZodSchemaWithContext = (_ctx?: ISkillSetZodCtx) => {
  return skillSetZodSchema.strict()
}
