import type { Effect } from 'effect'

import type { AopsKitServices } from '../domain-services/types.js'
import { AOPS_OPERATION_CATALOG_ROWS } from './catalog.data.js'

type AopsCatalogRow = (typeof AOPS_OPERATION_CATALOG_ROWS)[number]
type AopsOperationId = Extract<AopsCatalogRow['operationId'], string>

type AopsSpecialMethods = {
  hardDeleteAopsProjectCascade: (workspaceId: string, projectId: string) => Promise<unknown>
}

type AopsServiceByKey = AopsKitServices & {
  __calls__: AopsSpecialMethods
}

type RowService<TRow extends AopsCatalogRow> =
  TRow['serviceKey'] extends keyof AopsServiceByKey
    ? AopsServiceByKey[TRow['serviceKey']]
    : never

type RowMethod<TRow extends AopsCatalogRow> =
  TRow['methodName'] extends keyof RowService<TRow>
    ? RowService<TRow>[TRow['methodName']]
    : never

type RowParams<TRow extends AopsCatalogRow> =
  RowMethod<TRow> extends (...args: infer TArgs) => unknown
    ? TArgs
    : never

type RowResult<TRow extends AopsCatalogRow> =
  RowMethod<TRow> extends (...args: unknown[]) => infer TResult
    ? TResult
    : never

type UnwrapEffect<T> = T extends Effect.Effect<infer A, unknown, unknown>
  ? A
  : Awaited<T>

type BuildInputShape<
  TRow extends AopsCatalogRow,
  TParams extends readonly unknown[] = RowParams<TRow>,
> = {
  [I in keyof TRow['args'] as TRow['args'][I] extends {
    name: infer N extends string
    optional: false
  }
    ? N
    : never]: I extends keyof TParams
    ? TParams[I]
    : never
} & {
  [I in keyof TRow['args'] as TRow['args'][I] extends {
    name: infer N extends string
    optional: true
  }
    ? N
    : never]?: I extends keyof TParams
    ? TParams[I]
    : never
}

type RowByOperationId<TId extends AopsOperationId> = Extract<AopsCatalogRow, { operationId: TId }>

export type AopsOperationInputById = {
  [TId in AopsOperationId]: BuildInputShape<RowByOperationId<TId>>
}

export type AopsOperationOutputById = {
  [TId in AopsOperationId]: UnwrapEffect<RowResult<RowByOperationId<TId>>>
}

export type AopsTypedOperationId = AopsOperationId

export type AopsOperationHostContextInput = {
  tenantId?: string
  workspaceId?: string
  workspaceUuid?: string
  workspaceUid?: string
  workspaceName?: string
  locale?: string
  fallbackLocale?: string
}

export type AopsOperationInput<TId extends AopsTypedOperationId> = AopsOperationInputById[TId] & AopsOperationHostContextInput
export type AopsOperationOutput<TId extends AopsTypedOperationId> = AopsOperationOutputById[TId]
