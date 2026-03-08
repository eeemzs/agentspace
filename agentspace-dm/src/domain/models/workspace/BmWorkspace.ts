import { BmBase, BmBaseConstructorParams, MlgFieldsOf } from '@aopslab/xf-bm'
import { IbmWorkspace } from './IbmWorkspace.js'
import { IWorkspaceMlgTags, IWorkspaceZodCtx, workspaceResources } from './resources.js'
import { createWorkspaceZodSchemaWithContext } from './zod.schema.js'
import { bmWorkspaceMlgFields } from './IbmWorkspace.js'

export class BmWorkspace extends BmBase<IbmWorkspace, IWorkspaceMlgTags> {
  public static mlgFields: MlgFieldsOf<IbmWorkspace> = bmWorkspaceMlgFields

  constructor({ data, locale, fallbackLocale, logger }: BmBaseConstructorParams<IbmWorkspace>) {
    super({ data, locale, fallbackLocale, logger }, workspaceResources)
  }

  public buildSchemas(zodCtx: IWorkspaceZodCtx) {
    return {
      default: createWorkspaceZodSchemaWithContext(zodCtx),
    }
  }
}

