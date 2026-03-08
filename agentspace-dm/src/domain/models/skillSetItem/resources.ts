import { BmResourceInline, I18nBmValidKeys } from '@aopslab/xf-i18n/bm'
import { I18nZodContextWithChain, ValidationResourceType } from '@aopslab/xf-validation'
import { IbmSkillSetItem } from './IbmSkillSetItem.js'

export interface ISkillSetItemMlgTags {
  // add keys here if needed
}

export const skillSetItemResources: BmResourceInline<IbmSkillSetItem, ISkillSetItemMlgTags> = {
  fields: {},
}

export type ISkillSetItemTranslationKeys = I18nBmValidKeys<IbmSkillSetItem, ValidationResourceType, ISkillSetItemMlgTags>
export type ISkillSetItemZodCtx = I18nZodContextWithChain<IbmSkillSetItem, ISkillSetItemTranslationKeys>
