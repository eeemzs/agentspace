import { createBmDbMapper, FieldConversionLookup, stringToUuid, uuidToString } from '@aopslab/xf-db'
import { IbmSkillSet } from '../../../../domain/models/index.js'
import { IdbSkillSetDrizzle, SkillSetColumnsDrizzle } from './drizzle.schema.skillSet.js'

const conversions: FieldConversionLookup<IbmSkillSet, SkillSetColumnsDrizzle> = {
  id: { toDomain: uuidToString, toDb: stringToUuid },
  //==> field-conversions
  // customField: { toDomain: (v) => v, toDb: (v) => v },
  //<==//
};

export const mapperSkillSetDrizzle = createBmDbMapper<IbmSkillSet, IdbSkillSetDrizzle, SkillSetColumnsDrizzle>(conversions);
