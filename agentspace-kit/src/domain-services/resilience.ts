import type { AgentspaceKitProviderOptions } from './types.js';

/**
 * Keep resilience and policy presets in one place.
 * Examples include retry, circuit-breaker, timeout, and cache settings.
 */
export const defaultAgentspaceKitResilience: Pick<AgentspaceKitProviderOptions, 'resilience' | 'cache'> = {
  resilience: {
    services: {
      // retry: { maxRetries: 3, delayMs: 50 },
      // timeoutMs: 5_000,
    },
    repositories: {
      // retry: { maxRetries: 2, delayMs: 25 },
      // timeoutMs: 3_000,
    },
  },
  cache: {
    // ttlMs: 5 * 60 * 1000,
  },
};
