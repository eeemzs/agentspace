import { createBmDbMapper, FieldConversionLookup, stringToUuid, uuidToString } from '@aopslab/xf-db'
import { IbmWorkspace } from '../../../../domain/models/index.js'
import { IdbWorkspaceDrizzle, WorkspaceColumnsDrizzle } from './drizzle.schema.workspace.js'

const conversions: FieldConversionLookup<IbmWorkspace, WorkspaceColumnsDrizzle> = {
  id: { toDomain: uuidToString, toDb: stringToUuid },
  //==> field-conversions
  // customField: { toDomain: (v) => v, toDb: (v) => v },
  //<==//
};

export const mapperWorkspaceDrizzle = createBmDbMapper<IbmWorkspace, IdbWorkspaceDrizzle, WorkspaceColumnsDrizzle>(conversions);
