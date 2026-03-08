import { BmResourceInline, I18nBmValidKeys } from '@aopslab/xf-i18n/bm'
import { I18nZodContextWithChain, ValidationResourceType } from '@aopslab/xf-validation'
import { IbmWorkspace } from './IbmWorkspace.js'

export interface IWorkspaceMlgTags {
  // add keys here if needed
}

export const workspaceResources: BmResourceInline<IbmWorkspace, IWorkspaceMlgTags> = {
  fields: {}
}

export type IWorkspaceTranslationKeys = I18nBmValidKeys<IbmWorkspace, ValidationResourceType, IWorkspaceMlgTags>
export type IWorkspaceZodCtx = I18nZodContextWithChain<IbmWorkspace, IWorkspaceTranslationKeys>
