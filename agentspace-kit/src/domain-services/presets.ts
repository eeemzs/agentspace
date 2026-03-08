import type { AopsKitEnvConfig } from '../config/config.js'
import type { AopsKitStaticConfig } from './types.js'
import { buildAopsKitStaticConfig } from './unified.js'

export function createAopsKitStaticConfigFromEnv(envConfig: AopsKitEnvConfig): AopsKitStaticConfig {
  return buildAopsKitStaticConfig(envConfig)
}
