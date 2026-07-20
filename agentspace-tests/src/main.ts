import { listAgentspaceKitOperations } from '@aopslab/domain-kit-agentspace'

export async function runAgentspaceBootstrapSmoke(): Promise<{
  readonly domainId: 'agentspace'
  readonly operationCount: number
}> {
  return {
    domainId: 'agentspace',
    operationCount: listAgentspaceKitOperations().length,
  }
}

runAgentspaceBootstrapSmoke()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  })
