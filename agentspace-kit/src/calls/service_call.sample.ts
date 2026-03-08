import type { AopsKitContext } from '../domain-services/types.js';

export async function serviceCallSample(
  kit: { getAll: (ctx?: Partial<AopsKitContext>) => Promise<Record<string, unknown>> },
  payload: Record<string, unknown>,
  overrides?: Partial<AopsKitContext>,
) {
  const services = await kit.getAll(overrides);
  //==> custom service call: sample <==//
  return { ok: true, payload, services };
}
