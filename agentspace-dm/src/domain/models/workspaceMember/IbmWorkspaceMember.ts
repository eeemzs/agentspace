import z from 'zod'
import { EnsureAllKeys } from '@aopslab/xf-core'
import { DotNestedMlgKeys, EnsureExactMlgKeys, mlgFieldsOf } from '@aopslab/xf-bm'
import { workspaceMemberZodSchema, workspaceMemberZodSchemaInsert } from './zod.schema.js'

/* Zod-based types */
export type IbmWorkspaceMember = z.infer<typeof workspaceMemberZodSchema>
export type IbmWorkspaceMemberInsert = z.infer<typeof workspaceMemberZodSchemaInsert>

export const ibmWorkspaceMemberKeys = [
  'id',
  'tenantId',
  'createdAt',
  'updatedAt',
  'workspaceId',
  'userId',
  'role',
  'createdBy',
  'updatedBy',
] as const satisfies readonly (keyof IbmWorkspaceMember)[]

type _VerifyKeys = EnsureAllKeys<IbmWorkspaceMember, typeof ibmWorkspaceMemberKeys>
const _verifyKeys: _VerifyKeys = true
void _verifyKeys

export type BmWorkspaceMemberMlgKeys = DotNestedMlgKeys<IbmWorkspaceMember>

export const bmWorkspaceMemberMlgFields = mlgFieldsOf<IbmWorkspaceMember>()(
  // add more nested fields as needed, e.g. 'options.option_name'
)

// Compile-time check: ensure bm fields cover exact MLG paths
type _VerifyMlgFields = EnsureExactMlgKeys<IbmWorkspaceMember, typeof bmWorkspaceMemberMlgFields>
const _verifyMlgFields: _VerifyMlgFields = true
void _verifyMlgFields
