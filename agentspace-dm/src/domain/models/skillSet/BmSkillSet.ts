import { BmBase, BmBaseConstructorParams, MlgFieldsOf } from '@aopslab/xf-bm'
import { IbmSkillSet } from './IbmSkillSet.js'
import { ISkillSetMlgTags, ISkillSetZodCtx, skillSetResources } from './resources.js'
import { createSkillSetZodSchemaWithContext } from './zod.schema.js'
import { bmSkillSetMlgFields } from './IbmSkillSet.js'

export class BmSkillSet extends BmBase<IbmSkillSet, ISkillSetMlgTags> {
  public static mlgFields: MlgFieldsOf<IbmSkillSet> = bmSkillSetMlgFields

  constructor({ data, locale, fallbackLocale, logger }: BmBaseConstructorParams<IbmSkillSet>) {
    super({ data, locale, fallbackLocale, logger }, skillSetResources)
  }

  public buildSchemas(zodCtx: ISkillSetZodCtx) {
    return {
      default: createSkillSetZodSchemaWithContext(zodCtx),
    }
  }
}
