import z from 'zod'
import { EnsureAllKeys } from '@aopslab/xf-core'
import { DotNestedMlgKeys, EnsureExactMlgKeys, mlgFieldsOf } from '@aopslab/xf-bm'
import { skillSetItemZodSchema, skillSetItemZodSchemaInsert } from './zod.schema.js'

/* Zod-based types */
export type IbmSkillSetItem = z.infer<typeof skillSetItemZodSchema>
export type IbmSkillSetItemInsert = z.infer<typeof skillSetItemZodSchemaInsert>

export const ibmSkillSetItemKeys = [
  'id',
  'tenantId',
  'createdAt',
  'updatedAt',
  'workspaceId',
  'skillSetId',
  'skillVersionId',
  'position',
  'createdBy',
  'updatedBy',
  'meta',
] as const satisfies readonly (keyof IbmSkillSetItem)[]

type _VerifyKeys = EnsureAllKeys<IbmSkillSetItem, typeof ibmSkillSetItemKeys>
const _verifyKeys: _VerifyKeys = true
void _verifyKeys

export type BmSkillSetItemMlgKeys = DotNestedMlgKeys<IbmSkillSetItem>

export const bmSkillSetItemMlgFields = mlgFieldsOf<IbmSkillSetItem>()()

// Compile-time check: ensure bm fields cover exact MLG paths
type _VerifyMlgFields = EnsureExactMlgKeys<IbmSkillSetItem, typeof bmSkillSetItemMlgFields>
const _verifyMlgFields: _VerifyMlgFields = true
void _verifyMlgFields
