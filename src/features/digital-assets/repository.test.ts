import { describe, expect, it } from 'vitest';

import {
  createDigitalAssetRepository,
  type DigitalAssetRepositorySnapshot,
} from './repository';

const timestamps = {
  requestedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const request = {
  id: 'request-1',
  owner: { businessId: 'business-1' },
  association: { catalogId: 'catalog-1', catalogItemId: 'item-1' },
  kind: 'model_3d' as const,
  requestedAt: timestamps.requestedAt,
};

const asset = {
  id: 'asset-1',
  owner: { businessId: 'business-1' },
  association: { catalogId: 'catalog-1', catalogItemId: 'item-1' },
  kind: 'model_3d' as const,
  status: 'ready' as const,
  approvedFiles: [{
    kind: 'model_3d' as const,
    uri: '/assets/item.glb',
    mimeType: 'model/gltf-binary',
    byteSize: 1024,
    checksumSha256: 'a'.repeat(64),
    approvedAt: timestamps.updatedAt,
  }],
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
  approvedAt: timestamps.updatedAt,
};

const snapshot: DigitalAssetRepositorySnapshot = {
  requests: [],
  jobs: [],
  assets: [],
};

describe('createDigitalAssetRepository', () => {
  it('creates stable jobs for generation requests and treats retries as idempotent', () => {
    const repository = createDigitalAssetRepository(snapshot);

    const first = repository.submitGenerationRequest(request);
    const second = repository.submitGenerationRequest(request);

    expect(first.created).toBe(true);
    expect(first.job).toMatchObject({
      id: 'job-request-1',
      requestId: 'request-1',
      owner: { businessId: 'business-1' },
      association: request.association,
      status: 'queued',
    });
    expect(second.created).toBe(false);
    expect(second.job).toEqual(first.job);
    expect(repository.snapshot().requests).toHaveLength(1);
    expect(repository.snapshot().jobs).toHaveLength(1);
  });

  it('rejects duplicate request ids from a different business scope', () => {
    const repository = createDigitalAssetRepository(snapshot);

    repository.submitGenerationRequest(request);

    expect(() => repository.submitGenerationRequest({
      ...request,
      owner: { businessId: 'business-2' },
    })).toThrow('generation request id already exists with different ownership or scope');
  });

  it('requires the persisted business scope for job and asset status updates', () => {
    const repository = createDigitalAssetRepository({
      requests: [request],
      jobs: [{
        id: 'job-request-1',
        requestId: 'request-1',
        owner: request.owner,
        association: request.association,
        status: 'queued',
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      }],
      assets: [asset],
    });

    expect(() => repository.recordGenerationJobStatus({
      jobId: 'job-request-1',
      owner: { businessId: 'business-2' },
      status: 'processing',
      updatedAt: '2026-01-01T00:01:00.000Z',
    })).toThrow('generation job owner must match the persisted business scope');

    expect(() => repository.recordDigitalAssetStatus({
      assetId: 'asset-1',
      owner: { businessId: 'business-2' },
      status: 'failed',
      failure: { code: 'processing_failed', message: 'boom' },
      updatedAt: '2026-01-01T00:01:00.000Z',
    })).toThrow('digital asset owner must match the persisted business scope');
  });

  it('stores generation results, allows safe retries, and keeps asset ownership aligned', () => {
    const repository = createDigitalAssetRepository({
      requests: [request],
      jobs: [{
        id: 'job-request-1',
        requestId: 'request-1',
        owner: request.owner,
        association: request.association,
        status: 'queued',
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      }],
    });

    const result = repository.recordGenerationResult({
      jobId: 'job-request-1',
      requestId: 'request-1',
      owner: request.owner,
      association: request.association,
      status: 'succeeded',
      asset,
    }, '2026-01-01T00:02:00.000Z');

    expect(result.job.status).toBe('succeeded');
    expect(result.asset).toMatchObject({ id: 'asset-1', owner: request.owner });
    expect(repository.snapshot().assets).toHaveLength(1);

    const retry = repository.recordGenerationResult({
      jobId: 'job-request-1',
      requestId: 'request-1',
      owner: request.owner,
      association: request.association,
      status: 'succeeded',
      asset,
    }, '2026-01-01T00:03:00.000Z');

    expect(retry.job.status).toBe('succeeded');
    expect(repository.snapshot().assets).toHaveLength(1);
    expect(retry.asset).toEqual(result.asset);
  });

  it('supports safe asset retries without mutating unrelated repository state', () => {
    const repository = createDigitalAssetRepository({
      assets: [{
        ...asset,
        status: 'failed',
        failure: { code: 'processing_failed', message: 'temporary failure' },
        approvedAt: undefined,
        approvedFiles: [],
        updatedAt: '2026-01-01T00:01:00.000Z',
      }],
    });

    const retried = repository.recordDigitalAssetStatus({
      assetId: 'asset-1',
      owner: request.owner,
      status: 'queued',
      updatedAt: '2026-01-01T00:02:00.000Z',
    });

    expect(retried.status).toBe('queued');
    expect(retried.failure).toBeUndefined();
    expect(repository.snapshot().assets).toHaveLength(1);
  });
});
