#!/usr/bin/env bash
set -euo pipefail

pnpm run build:dm

dialect="${AGENTSPACE_DRIZZLE_DIALECT:-postgresql}"
config="drizzle.agentspace.config.ts"

if [[ "$dialect" == "sqlite" ]]; then
  config="drizzle.agentspace.sqlite.config.ts"
fi

npx drizzle-kit generate --config "$config"
