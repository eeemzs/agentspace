import { createBmDbMapper, FieldConversionLookup, stringToUuid, uuidToString } from '@aopslab/xf-db'
import { IbmSkillSetItem } from '../../../../domain/models/index.js'
import { IdbSkillSetItemDrizzle, SkillSetItemColumnsDrizzle } from './drizzle.schema.skillSetItem.js'

const conversions: FieldConversionLookup<IbmSkillSetItem, SkillSetItemColumnsDrizzle> = {
  id: { toDomain: uuidToString, toDb: stringToUuid },
  //==> field-conversions
  // customField: { toDomain: (v) => v, toDb: (v) => v },
  //<==//
};

export const mapperSkillSetItemDrizzle = createBmDbMapper<IbmSkillSetItem, IdbSkillSetItemDrizzle, SkillSetItemColumnsDrizzle>(conversions);
