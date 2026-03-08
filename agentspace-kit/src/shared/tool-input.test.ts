import { describe, expect, it } from 'vitest'

import {
  hasNonEmptyValue,
  isWorkspaceArgName,
  normalizeNonEmpty,
  resolveWorkspaceAliasValue,
  toMissingRequiredArgToken,
  toRecord,
} from './tool-input.js'

describe('tool-input shared helper', () => {
  it('toRecord returns empty record for non-object values', () => {
    expect(toRecord(undefined)).toEqual({})
    expect(toRecord(null)).toEqual({})
    expect(toRecord('text')).toEqual({})
    expect(toRecord([1, 2, 3])).toEqual({})
  })

  it('resolveWorkspaceAliasValue uses alias precedence', () => {
    expect(resolveWorkspaceAliasValue({ workspaceName: 'name-only' })).toBe('name-only')
    expect(
      resolveWorkspaceAliasValue({
        workspaceUid: 'uid-first',
        workspaceName: 'name-fallback',
      }),
    ).toBe('uid-first')
    expect(
      resolveWorkspaceAliasValue({
        workspaceUuid: 'uuid-first',
        workspaceUid: 'uid-fallback',
      }),
    ).toBe('uuid-first')
    expect(
      resolveWorkspaceAliasValue({
        workspaceId: 'id-first',
        workspaceUuid: 'uuid-fallback',
        workspaceUid: 'uid-fallback',
        workspaceName: 'name-fallback',
      }),
    ).toBe('id-first')
  })

  it('normalizes required token for workspace-scoped args', () => {
    expect(isWorkspaceArgName('workspaceId')).toBe(true)
    expect(isWorkspaceArgName('data.workspaceId')).toBe(true)
    expect(isWorkspaceArgName('projectId')).toBe(false)

    expect(toMissingRequiredArgToken('workspaceId')).toBe('workspace_context_required')
    expect(toMissingRequiredArgToken('data.workspaceId')).toBe('workspace_context_required')
    expect(toMissingRequiredArgToken('projectId')).toBe('missing_required_arg:projectId')
  })

  it('normalizes and checks non-empty values consistently', () => {
    expect(normalizeNonEmpty('  text  ')).toBe('text')
    expect(normalizeNonEmpty('   ')).toBeUndefined()
    expect(normalizeNonEmpty(42)).toBeUndefined()

    expect(hasNonEmptyValue('text')).toBe(true)
    expect(hasNonEmptyValue('   ')).toBe(false)
    expect(hasNonEmptyValue(['x'])).toBe(true)
    expect(hasNonEmptyValue([])).toBe(false)
    expect(hasNonEmptyValue({ a: 1 })).toBe(true)
    expect(hasNonEmptyValue({})).toBe(false)
  })
})

