import { createBmDbMapper, FieldConversionLookup, stringToUuid, uuidToString } from '@aopslab/xf-db'
import { IbmAgentRunEvent } from '../../../../domain/models/index.js'
import { IdbAgentRunEventDrizzle, AgentRunEventColumnsDrizzle } from './drizzle.schema.agentRunEvent.js'

const conversions: FieldConversionLookup<IbmAgentRunEvent, AgentRunEventColumnsDrizzle> = {
  id: { toDomain: uuidToString, toDb: stringToUuid },
  workspaceId: { toDomain: uuidToString, toDb: stringToUuid },
  projectId: { toDomain: uuidToString, toDb: stringToUuid },
  agentRunId: { toDomain: uuidToString, toDb: stringToUuid },
}

export const mapperAgentRunEventDrizzle = createBmDbMapper<IbmAgentRunEvent, IdbAgentRunEventDrizzle, AgentRunEventColumnsDrizzle>(conversions)
