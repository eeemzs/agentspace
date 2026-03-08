import { BmBase, BmBaseConstructorParams, MlgFieldsOf } from '@aopslab/xf-bm'
import { IbmProjectSummary } from './IbmProjectSummary.js'
import { IProjectSummaryMlgTags, IProjectSummaryZodCtx, projectSummaryResources } from './resources.js'
import { createProjectSummaryZodSchemaWithContext } from './zod.schema.js'
import { bmProjectSummaryMlgFields } from './IbmProjectSummary.js'

export class BmProjectSummary extends BmBase<IbmProjectSummary, IProjectSummaryMlgTags> {
  public static mlgFields: MlgFieldsOf<IbmProjectSummary> = bmProjectSummaryMlgFields

  constructor({ data, locale, fallbackLocale, logger }: BmBaseConstructorParams<IbmProjectSummary>) {
    super({ data, locale, fallbackLocale, logger }, projectSummaryResources)
  }

  public buildSchemas(zodCtx: IProjectSummaryZodCtx) {
    return {
      default: createProjectSummaryZodSchemaWithContext(zodCtx),
    }
  }
}

