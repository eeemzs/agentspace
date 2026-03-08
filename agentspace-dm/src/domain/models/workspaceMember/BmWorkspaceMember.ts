import { BmBase, BmBaseConstructorParams, MlgFieldsOf } from '@aopslab/xf-bm'
import { IbmWorkspaceMember } from './IbmWorkspaceMember.js'
import { IWorkspaceMemberMlgTags, IWorkspaceMemberZodCtx, workspaceMemberResources } from './resources.js'
import { createWorkspaceMemberZodSchemaWithContext } from './zod.schema.js'
import { bmWorkspaceMemberMlgFields } from './IbmWorkspaceMember.js'

export class BmWorkspaceMember extends BmBase<IbmWorkspaceMember, IWorkspaceMemberMlgTags> {
  public static mlgFields: MlgFieldsOf<IbmWorkspaceMember> = bmWorkspaceMemberMlgFields

  constructor({ data, locale, fallbackLocale, logger }: BmBaseConstructorParams<IbmWorkspaceMember>) {
    super({ data, locale, fallbackLocale, logger }, workspaceMemberResources)
  }

  public buildSchemas(zodCtx: IWorkspaceMemberZodCtx) {
    return {
      default: createWorkspaceMemberZodSchemaWithContext(zodCtx),
    }
  }
}

