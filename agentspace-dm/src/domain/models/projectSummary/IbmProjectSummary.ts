import z from 'zod'
import { EnsureAllKeys } from '@aopslab/xf-core'
import { DotNestedMlgKeys, EnsureExactMlgKeys, mlgFieldsOf } from '@aopslab/xf-bm'
import { projectSummaryZodSchema, projectSummaryZodSchemaInsert } from './zod.schema.js'

/* Zod-based types */
export type IbmProjectSummary = z.infer<typeof projectSummaryZodSchema>
export type IbmProjectSummaryInsert = z.infer<typeof projectSummaryZodSchemaInsert>

export const ibmProjectSummaryKeys = [
  'id',
  'tenantId',
  'createdAt',
  'updatedAt',
  'projectId',
  'summary',
  'decisions',
  'openItems',
  'lastRunId',
  'lastSessionId',
] as const satisfies readonly (keyof IbmProjectSummary)[]

type _VerifyKeys = EnsureAllKeys<IbmProjectSummary, typeof ibmProjectSummaryKeys>
const _verifyKeys: _VerifyKeys = true
void _verifyKeys

export type BmProjectSummaryMlgKeys = DotNestedMlgKeys<IbmProjectSummary>

export const bmProjectSummaryMlgFields = mlgFieldsOf<IbmProjectSummary>()()

// Compile-time check: ensure bm fields cover exact MLG paths
type _VerifyMlgFields = EnsureExactMlgKeys<IbmProjectSummary, typeof bmProjectSummaryMlgFields>
const _verifyMlgFields: _VerifyMlgFields = true
void _verifyMlgFields
