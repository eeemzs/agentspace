import { createBmDbMapper, FieldConversionLookup, stringToUuid, uuidToString } from '@aopslab/xf-db'
import { IbmProjectSummary } from '../../../../domain/models/index.js'
import { IdbProjectSummaryDrizzle, ProjectSummaryColumnsDrizzle } from './drizzle.schema.projectSummary.js'

const conversions: FieldConversionLookup<IbmProjectSummary, ProjectSummaryColumnsDrizzle> = {
  id: { toDomain: uuidToString, toDb: stringToUuid },
  //==> field-conversions
  // customField: { toDomain: (v) => v, toDb: (v) => v },
  //<==//
};

export const mapperProjectSummaryDrizzle = createBmDbMapper<IbmProjectSummary, IdbProjectSummaryDrizzle, ProjectSummaryColumnsDrizzle>(conversions);
