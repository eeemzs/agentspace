import { BmResourceInline, I18nBmValidKeys } from '@aopslab/xf-i18n/bm'
import { I18nZodContextWithChain, ValidationResourceType } from '@aopslab/xf-validation'
import { IbmWorkspaceMember } from './IbmWorkspaceMember.js'

export interface IWorkspaceMemberMlgTags {
  // add keys here if needed
}

export const workspaceMemberResources: BmResourceInline<IbmWorkspaceMember, IWorkspaceMemberMlgTags> = {
  fields: {}
}

export type IWorkspaceMemberTranslationKeys = I18nBmValidKeys<IbmWorkspaceMember, ValidationResourceType, IWorkspaceMemberMlgTags>
export type IWorkspaceMemberZodCtx = I18nZodContextWithChain<IbmWorkspaceMember, IWorkspaceMemberTranslationKeys>
