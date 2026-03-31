import z from 'zod'
import { EnsureAllKeys } from '@aopslab/xf-core'
import { DotNestedMlgKeys, EnsureExactMlgKeys, mlgFieldsOf } from '@aopslab/xf-bm'
import { workspaceZodSchema, workspaceZodSchemaInsert } from './zod.schema.js'

/* Zod-based types */
export type IbmWorkspace = z.infer<typeof workspaceZodSchema>
export type IbmWorkspaceInsert = z.infer<typeof workspaceZodSchemaInsert>

export const ibmWorkspaceKeys = [
  'id',
  'tenantId',
  'createdAt',
  'updatedAt',
  'scopeId',
  'ownerId',
  'name',
  'description',
  'sharingEnabled',
  'createdBy',
  'updatedBy',
] as const satisfies readonly (keyof IbmWorkspace)[]

type _VerifyKeys = EnsureAllKeys<IbmWorkspace, typeof ibmWorkspaceKeys>
const _verifyKeys: _VerifyKeys = true
void _verifyKeys

export type BmWorkspaceMlgKeys = DotNestedMlgKeys<IbmWorkspace>

export const bmWorkspaceMlgFields = mlgFieldsOf<IbmWorkspace>()(
  // add more nested fields as needed, e.g. 'options.option_name'
)

// Compile-time check: ensure bm fields cover exact MLG paths
type _VerifyMlgFields = EnsureExactMlgKeys<IbmWorkspace, typeof bmWorkspaceMlgFields>
const _verifyMlgFields: _VerifyMlgFields = true
void _verifyMlgFields
