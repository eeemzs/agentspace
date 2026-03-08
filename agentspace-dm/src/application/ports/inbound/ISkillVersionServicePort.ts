import { Effect } from 'effect'
import { SkillVersionServiceError } from '../../errors/SkillVersionServiceError.js'
import { IbmResource, IbmSkill, IbmSkillVersion, IbmSkillVersionInsert } from '../../../domain/models/index.js'
import { DbQueryOptions } from '@aopslab/xf-db'

export interface OpenAiSkillFileInput {
  path: string
  content: string
  kind?: string
  encoding?: string
  mimeType?: string
}

export interface OpenAiSkillBundleInput {
  files: OpenAiSkillFileInput[]
  entryFile?: string
  metadata?: Record<string, unknown>
  sourcePath?: string
}

export interface ImportOpenAiSkillInput {
  workspaceId: string
  projectId?: string
  scopeType: 'global' | 'project'
  scopeId?: string
  skillId?: string
  name?: string
  description?: string
  shortDescription?: string
  tags?: string[]
  status?: 'draft' | 'published' | 'archived'
  createdBy?: string
  updatedBy?: string
  publish?: boolean
  bundle: OpenAiSkillBundleInput
}

export interface ImportOpenAiSkillResult {
  skill: IbmSkill
  skillVersion: IbmSkillVersion
  resource?: IbmResource
}

export interface ExportOpenAiSkillResult {
  skillVersionId: string
  skillId: string
  skillName?: string
  workspaceId: string
  projectId?: string
  entryFile: string
  skillStandard: string
  files: OpenAiSkillFileInput[]
  metadata: Record<string, unknown>
}

export interface MaterializeOpenAiSkillInput {
  outputDir: string
  overwrite?: boolean
}

export interface MaterializeOpenAiSkillResult {
  skillVersionId: string
  outputDir: string
  writtenFiles: Array<{
    path: string
    fullPath: string
    sizeBytes: number
  }>
}

export interface ISkillVersionServicePort {
  getById(id: string, options?: DbQueryOptions<IbmSkillVersion>): Effect.Effect<IbmSkillVersion | null, SkillVersionServiceError>
  create(data: IbmSkillVersionInsert): Effect.Effect<IbmSkillVersion, SkillVersionServiceError>
  getSkillVersion(id: string, options?: DbQueryOptions<IbmSkillVersion>): Effect.Effect<IbmSkillVersion | null, SkillVersionServiceError>
  listSkillVersions(
    filter?: Partial<IbmSkillVersion>,
    options?: DbQueryOptions<IbmSkillVersion>
  ): Effect.Effect<IbmSkillVersion[], SkillVersionServiceError>
  updateSkillVersion(id: string, patch: Partial<IbmSkillVersion>): Effect.Effect<IbmSkillVersion, SkillVersionServiceError>
  removeSkillVersion(id: string): Effect.Effect<void, SkillVersionServiceError>
  publishSkillVersion(id: string, updatedBy?: string): Effect.Effect<IbmSkillVersion, SkillVersionServiceError>
  importOpenAiSkill(data: ImportOpenAiSkillInput): Effect.Effect<ImportOpenAiSkillResult, SkillVersionServiceError>
  exportOpenAiSkillVersion(id: string): Effect.Effect<ExportOpenAiSkillResult, SkillVersionServiceError>
  materializeOpenAiSkillVersion(
    id: string,
    data: MaterializeOpenAiSkillInput
  ): Effect.Effect<MaterializeOpenAiSkillResult, SkillVersionServiceError>
}

export interface ISkillVersionLookupPort {
  getById(id: string): Effect.Effect<IbmSkillVersion | null, SkillVersionServiceError>
}
