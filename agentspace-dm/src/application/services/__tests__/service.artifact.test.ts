import { describe, it, expect, vi } from 'vitest'
import { Effect } from 'effect'
import { ArtifactService } from '../service.artifact.js'

const makeRepo = () => ({
  create: vi.fn(),
  findById: vi.fn(),
  patchById: vi.fn(),
  find: vi.fn(),
})

describe('ArtifactService', () => {
  it('stores artifact via create', async () => {
    const artifactRepo = makeRepo()
    artifactRepo.create.mockImplementation((data) => Effect.succeed({ ...data, id: 'artifact-1' }))

    const service = new ArtifactService({ artifactRepository: artifactRepo as any })
    const result = await Effect.runPromise(
      service.storeArtifact({
        projectId: 'project-1',
        artifactType: 'file',
        storagePath: 's3://bucket/file.txt',
      })
    )

    expect(artifactRepo.create).toHaveBeenCalledTimes(1)
    const payload = artifactRepo.create.mock.calls[0][0]
    expect(payload.projectId).toBe('project-1')
    expect(result.id).toBe('artifact-1')
  })

  it('lists artifacts by ref', async () => {
    const artifactRepo = makeRepo()
    const linkRepo = makeRepo()

    linkRepo.find.mockImplementation(() => Effect.succeed([{ artifactId: 'artifact-1' }]))
    artifactRepo.findById.mockImplementation((id) => Effect.succeed({ id }))

    const service = new ArtifactService({
      artifactRepository: artifactRepo as any,
      artifactLinkRepository: linkRepo as any,
    })

    const result = await Effect.runPromise(service.listArtifactsByRef('task', 'task-1', 'project-1'))

    expect(linkRepo.find).toHaveBeenCalledWith({
      matchEq: { refType: 'task', refId: 'task-1', projectId: 'project-1' },
    })
    expect(artifactRepo.findById).toHaveBeenCalledWith('artifact-1')
    expect(result).toEqual([{ id: 'artifact-1' }])
  })
})
