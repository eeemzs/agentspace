export type AopsOperationKind = 'list' | 'get' | 'create' | 'update' | 'delete' | 'custom'
export type AopsOperationEffect = 'none' | 'db' | 'mixed'
export type AopsOperationSchemaRef = { $ref: string }
export type AopsOperationSchema = AopsOperationSchemaRef | Record<string, unknown>

export type AopsOperationArgument = {
  name: string
  optional: boolean
}

export type AopsOperationPolicy = Record<string, unknown>

export type AopsOperationSpec = {
  operationId: string
  toolId: string
  serviceKey: string
  serviceEntity: string
  methodName: string
  kind: AopsOperationKind
  args: AopsOperationArgument[]
  summary?: string
  tags?: string[]
  sideEffect?: AopsOperationEffect
  inputSchema?: AopsOperationSchema
  outputSchema?: AopsOperationSchema
  policy?: AopsOperationPolicy
  examples?: string[]
}

export type DefineAopsKitOperationInput = Omit<AopsOperationSpec, 'toolId'> & {
  toolId?: string
}
