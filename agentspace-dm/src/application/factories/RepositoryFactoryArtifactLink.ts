import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortArtifactLink } from '../ports/repository-ports/index.js'
import { ArtifactLinkDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryArtifactLink = createRepositoryFactory<IRepositoryPortArtifactLink>({
  moduleName: 'RepositoryFactoryArtifactLink',
  mongoRepo: undefined,
  drizzleRepo: ArtifactLinkDrizzleRepo,
});
