import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortArtifact } from '../ports/repository-ports/index.js'
import { ArtifactDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryArtifact = createRepositoryFactory<IRepositoryPortArtifact>({
  moduleName: 'RepositoryFactoryArtifact',
  mongoRepo: undefined,
  drizzleRepo: ArtifactDrizzleRepo,
});
