import { createBmDbMapper, FieldConversionLookup, stringToUuid, uuidToString } from '@aopslab/xf-db'
import { IbmWorkspaceMember } from '../../../../domain/models/index.js'
import { IdbWorkspaceMemberDrizzle, WorkspaceMemberColumnsDrizzle } from './drizzle.schema.workspaceMember.js'

const conversions: FieldConversionLookup<IbmWorkspaceMember, WorkspaceMemberColumnsDrizzle> = {
  id: { toDomain: uuidToString, toDb: stringToUuid },
  //==> field-conversions
  // customField: { toDomain: (v) => v, toDb: (v) => v },
  //<==//
};

export const mapperWorkspaceMemberDrizzle = createBmDbMapper<IbmWorkspaceMember, IdbWorkspaceMemberDrizzle, WorkspaceMemberColumnsDrizzle>(conversions);
