import type { AopsKitServices } from './types.js';

/**
 * Metrics placeholder. İsterseniz Prometheus benzeri çıktı üretmek için genişletin.
 */
export function renderAopsKitMetrics(_services: Partial<AopsKitServices>): string {
  //==> custom metrics renderer <==//
  return '# AopsKit metrics not implemented';
}
