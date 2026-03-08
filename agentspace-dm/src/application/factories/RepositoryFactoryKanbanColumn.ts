import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortKanbanColumn } from '../ports/repository-ports/index.js'
import { KanbanColumnDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryKanbanColumn = createRepositoryFactory<IRepositoryPortKanbanColumn>({
  moduleName: 'RepositoryFactoryKanbanColumn',
  mongoRepo: undefined,
  drizzleRepo: KanbanColumnDrizzleRepo,
});
