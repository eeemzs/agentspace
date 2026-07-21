import type { AgentspaceKitServices } from './types.js';

/**
 * Metrics placeholder. Extend it to emit Prometheus-style output when needed.
 */
export function renderAgentspaceKitMetrics(_services: Partial<AgentspaceKitServices>): string {
  //==> custom metrics renderer <==//
  return '# AgentspaceKit metrics not implemented';
}
