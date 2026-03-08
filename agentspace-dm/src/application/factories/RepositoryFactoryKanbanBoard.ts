import { createRepositoryFactory } from '@aopslab/xf-dm'
import { IRepositoryPortKanbanBoard } from '../ports/repository-ports/index.js'
import { KanbanBoardDrizzleRepo } from '../../infrastructure/repositories/index.js'

export const RepositoryFactoryKanbanBoard = createRepositoryFactory<IRepositoryPortKanbanBoard>({
  moduleName: 'RepositoryFactoryKanbanBoard',
  mongoRepo: undefined,
  drizzleRepo: KanbanBoardDrizzleRepo,
});
