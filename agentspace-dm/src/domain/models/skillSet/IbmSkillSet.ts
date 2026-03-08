import z from 'zod'
import { EnsureAllKeys } from '@aopslab/xf-core'
import { DotNestedMlgKeys, EnsureExactMlgKeys, mlgFieldsOf } from '@aopslab/xf-bm'
import { skillSetZodSchema, skillSetZodSchemaInsert } from './zod.schema.js'

/* Zod-based types */
export type IbmSkillSet = z.infer<typeof skillSetZodSchema>
export type IbmSkillSetInsert = z.infer<typeof skillSetZodSchemaInsert>

export const ibmSkillSetKeys = [
  'id',
  'tenantId',
  'createdAt',
  'updatedAt',
  'workspaceId',
  'projectId',
  'scopeType',
  'scopeId',
  'name',
  'description',
  'tags',
  'createdBy',
  'updatedBy',
] as const satisfies readonly (keyof IbmSkillSet)[]

type _VerifyKeys = EnsureAllKeys<IbmSkillSet, typeof ibmSkillSetKeys>
const _verifyKeys: _VerifyKeys = true
void _verifyKeys

export type BmSkillSetMlgKeys = DotNestedMlgKeys<IbmSkillSet>

export const bmSkillSetMlgFields = mlgFieldsOf<IbmSkillSet>()()

// Compile-time check: ensure bm fields cover exact MLG paths
type _VerifyMlgFields = EnsureExactMlgKeys<IbmSkillSet, typeof bmSkillSetMlgFields>
const _verifyMlgFields: _VerifyMlgFields = true
void _verifyMlgFields
