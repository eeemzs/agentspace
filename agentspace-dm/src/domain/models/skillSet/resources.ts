import { BmResourceInline, I18nBmValidKeys } from '@aopslab/xf-i18n/bm'
import { I18nZodContextWithChain, ValidationResourceType } from '@aopslab/xf-validation'
import { IbmSkillSet } from './IbmSkillSet.js'

export interface ISkillSetMlgTags {
  // add keys here if needed
}

export const skillSetResources: BmResourceInline<IbmSkillSet, ISkillSetMlgTags> = {
  fields: {},
}

export type ISkillSetTranslationKeys = I18nBmValidKeys<IbmSkillSet, ValidationResourceType, ISkillSetMlgTags>
export type ISkillSetZodCtx = I18nZodContextWithChain<IbmSkillSet, ISkillSetTranslationKeys>
