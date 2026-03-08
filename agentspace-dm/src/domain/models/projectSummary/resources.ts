import { BmResourceInline, I18nBmValidKeys } from '@aopslab/xf-i18n/bm'
import { I18nZodContextWithChain, ValidationResourceType } from '@aopslab/xf-validation'
import { IbmProjectSummary } from './IbmProjectSummary.js'

export interface IProjectSummaryMlgTags {
  // add keys here if needed
}

export const projectSummaryResources: BmResourceInline<IbmProjectSummary, IProjectSummaryMlgTags> = {
  fields: {}
}

export type IProjectSummaryTranslationKeys = I18nBmValidKeys<IbmProjectSummary, ValidationResourceType, IProjectSummaryMlgTags>
export type IProjectSummaryZodCtx = I18nZodContextWithChain<IbmProjectSummary, IProjectSummaryTranslationKeys>
