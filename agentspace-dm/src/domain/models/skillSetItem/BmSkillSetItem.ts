import { BmBase, BmBaseConstructorParams, MlgFieldsOf } from '@aopslab/xf-bm'
import { IbmSkillSetItem } from './IbmSkillSetItem.js'
import { ISkillSetItemMlgTags, ISkillSetItemZodCtx, skillSetItemResources } from './resources.js'
import { createSkillSetItemZodSchemaWithContext } from './zod.schema.js'
import { bmSkillSetItemMlgFields } from './IbmSkillSetItem.js'

export class BmSkillSetItem extends BmBase<IbmSkillSetItem, ISkillSetItemMlgTags> {
  public static mlgFields: MlgFieldsOf<IbmSkillSetItem> = bmSkillSetItemMlgFields

  constructor({ data, locale, fallbackLocale, logger }: BmBaseConstructorParams<IbmSkillSetItem>) {
    super({ data, locale, fallbackLocale, logger }, skillSetItemResources)
  }

  public buildSchemas(zodCtx: ISkillSetItemZodCtx) {
    return {
      default: createSkillSetItemZodSchemaWithContext(zodCtx),
    }
  }
}
