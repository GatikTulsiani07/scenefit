import { describe, expect, it } from 'vitest';

import { adaptSeededFurnitureCatalogue } from '@/features/catalog/legacy-furniture-adapter';

import {
  assetOwnerScopeSchema,
  assertDigitalAssetMatchesCatalogItem,
  assetStatusSchema,
  approvedFileReferenceSchema,
  canTransitionAssetStatus,
  canTransitionGenerationJobStatus,
  digitalAssetMatchesCatalogItem,
  digitalAssetSchema,
  generationJobSchema,
  generationRequestSchema,
  generationResultSchema,
  transitionAssetStatus,
  transitionGenerationJobStatus,
  type DigitalAsset,
  type GenerationJob,
} from './contracts';
import { mapCatalogItemDigitalAssetReference } from './compatibility';

const timestamps = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:02:00.000Z' };
const approvedFile = {
  kind: 'model_3d' as const,
  uri: '/assets/item.glb',
  mimeType: 'model/gltf-binary',
  byteSize: 1024,
  checksumSha256: 'a'.repeat(64),
  approvedAt: '2026-01-01T00:01:00.000Z',
};

const readyAsset: DigitalAsset = {
  id: 'asset-1',
  owner: { businessId: 'business-1' },
  association: { catalogId: 'catalog-1', catalogItemId: 'item-1' },
  kind: 'model_3d',
  status: 'ready',
  approvedFiles: [approvedFile],
  ...timestamps,
  approvedAt: '2026-01-01T00:01:00.000Z',
};

describe('digital asset and generation contracts', () => {
  it('accepts safe application-relative and HTTPS file references', () => {
    expect(approvedFileReferenceSchema.safeParse(approvedFile).success).toBe(true);
    expect(approvedFileReferenceSchema.safeParse({
      ...approvedFile,
      uri: 'https://cdn.example.com/assets/item.glb',
    }).success).toBe(true);
  });

  it('rejects literal and encoded traversal segments in application-relative references', () => {
    for (const uri of [
      '/assets/../private/item.glb',
      '/assets/%2e%2e/private/item.glb',
      '/assets/%252e%252e/private/item.glb',
      '/assets/%2f..%2fprivate/item.glb',
      '/assets/%5c..%5cprivate/item.glb',
    ]) {
      expect(approvedFileReferenceSchema.safeParse({ ...approvedFile, uri }).success).toBe(false);
    }
  });

  it('accepts scoped assets, requests, jobs, and successful or failed results', () => {
    expect(assetOwnerScopeSchema.parse({ businessId: 'business-1' })).toEqual({ businessId: 'business-1' });
    expect(digitalAssetSchema.parse(readyAsset)).toEqual(readyAsset);
    expect(generationRequestSchema.parse({
      id: 'request-1', owner: { businessId: 'business-1' },
      association: readyAsset.association, kind: 'model_3d', requestedAt: timestamps.createdAt,
    })).toBeTruthy();

    const job: GenerationJob = {
      id: 'job-1', requestId: 'request-1', owner: { businessId: 'business-1' },
      association: readyAsset.association,
      status: 'succeeded', ...timestamps,
    };
    expect(generationJobSchema.parse(job)).toEqual(job);
    expect(generationResultSchema.parse({
      jobId: job.id, requestId: job.requestId, owner: job.owner, association: job.association,
      status: 'succeeded', asset: readyAsset,
    })).toBeTruthy();
    expect(generationResultSchema.parse({
      jobId: job.id, requestId: job.requestId, owner: job.owner, association: job.association,
      status: 'succeeded', asset: { ...readyAsset, status: 'needs_review', approvedAt: undefined },
    })).toBeTruthy();
    expect(generationResultSchema.parse({
      jobId: job.id, requestId: job.requestId, owner: job.owner, association: job.association,
      status: 'failed', failure: { code: 'processing_failed', message: 'Could not process input' },
    })).toBeTruthy();
  });

  it('rejects malformed references, missing readiness evidence, and invalid scope values', () => {
    expect(assetStatusSchema.safeParse('no_asset').success).toBe(false);
    expect(digitalAssetSchema.safeParse({ ...readyAsset, approvedFiles: [] }).success).toBe(false);
    expect(digitalAssetSchema.safeParse({
      ...readyAsset,
      approvedFiles: [{ ...approvedFile, kind: 'image' as const }],
    }).success).toBe(false);
    expect(digitalAssetSchema.safeParse({
      ...readyAsset,
      approvedAt: '2025-12-31T23:59:00.000Z',
    }).success).toBe(false);
    expect(digitalAssetSchema.safeParse({
      ...readyAsset,
      approvedFiles: [{ ...approvedFile, approvedAt: '2026-01-01T00:03:00.000Z' }],
    }).success).toBe(false);
    expect(digitalAssetSchema.safeParse({
      ...readyAsset,
      status: 'needs_review',
    }).success).toBe(false);
    expect(digitalAssetSchema.safeParse({ ...readyAsset, approvedFiles: [{ ...approvedFile, uri: 'javascript:alert(1)' }] }).success).toBe(false);
    expect(digitalAssetSchema.safeParse({ ...readyAsset, association: { catalogId: '', catalogItemId: 'item-1' } }).success).toBe(false);
    expect(generationResultSchema.safeParse({ jobId: 'job-1', requestId: 'request-1', owner: { businessId: 'business-1' }, association: readyAsset.association, status: 'succeeded' }).success).toBe(false);
    expect(generationResultSchema.safeParse({
      jobId: 'job-1', requestId: 'request-1', owner: { businessId: 'business-1' }, association: readyAsset.association,
      status: 'succeeded', asset: readyAsset, failure: { code: 'processing_failed', message: 'Contradictory' },
    }).success).toBe(false);
    expect(generationResultSchema.safeParse({
      jobId: 'job-1', requestId: 'request-1', owner: { businessId: 'business-1' }, association: readyAsset.association,
      status: 'failed', asset: readyAsset, failure: { code: 'processing_failed', message: 'Contradictory' },
    }).success).toBe(false);
    expect(generationResultSchema.safeParse({
      jobId: 'job-1', requestId: 'request-1', owner: { businessId: 'business-1' }, association: readyAsset.association,
      status: 'succeeded', asset: { ...readyAsset, status: 'processing' },
    }).success).toBe(false);
    expect(generationResultSchema.safeParse({
      jobId: 'job-1', requestId: 'request-1', owner: { businessId: 'business-1' }, association: readyAsset.association,
      status: 'failed', failure: { code: 'processing_failed', message: 'Failed' },
    }).success).toBe(true);
    expect(generationResultSchema.safeParse({
      jobId: 'job-1', requestId: 'request-1', owner: { businessId: 'other-business' }, association: readyAsset.association,
      status: 'succeeded', asset: readyAsset,
    }).success).toBe(false);
  });

  it('enforces separate asset-readiness and generation-job transitions', () => {
    expect(canTransitionAssetStatus('queued', 'processing')).toBe(true);
    expect(canTransitionAssetStatus('processing', 'needs_review')).toBe(true);
    expect(canTransitionAssetStatus('needs_review', 'ready')).toBe(true);
    expect(canTransitionAssetStatus('ready', 'processing')).toBe(false);
    expect(canTransitionGenerationJobStatus('processing', 'succeeded')).toBe(true);
    expect(canTransitionGenerationJobStatus('processing', 'needs_review' as never)).toBe(false);

    const queued = { ...readyAsset, status: 'queued' as const, approvedFiles: [], approvedAt: undefined };
    const processing = transitionAssetStatus(queued, 'processing', '2026-01-01T00:01:00.000Z');
    expect(transitionAssetStatus(processing, 'needs_review', '2026-01-01T00:02:00.000Z').status).toBe('needs_review');
    expect(() => transitionAssetStatus(processing, 'ready', '2026-01-01T00:02:00.000Z')).toThrow('Invalid digital asset transition');
    const reviewAsset = { ...processing, status: 'needs_review' as const, approvedFiles: [approvedFile] };
    expect(transitionAssetStatus(reviewAsset, 'ready', '2026-01-01T00:03:00.000Z', {
      approvedAt: '2026-01-01T00:03:00.000Z',
    }).status).toBe('ready');
    expect(transitionAssetStatus(queued, 'failed', '2026-01-01T00:01:00.000Z', {
      failure: { code: 'processing_failed', message: 'Processing stopped' },
    }).status).toBe('failed');

    const failedAsset = transitionAssetStatus(queued, 'failed', '2026-01-01T00:01:00.000Z', {
      failure: { code: 'processing_failed', message: 'Processing stopped' },
    });
    expect(transitionAssetStatus(failedAsset, 'queued', '2026-01-01T00:02:00.000Z').failure).toBeUndefined();

    const failedJob: GenerationJob = { id: 'job-2', requestId: 'request-2', owner: { businessId: 'business-1' }, association: readyAsset.association, status: 'failed', ...timestamps };
    expect(transitionGenerationJobStatus(failedJob, 'queued', '2026-01-01T00:01:00.000Z').status).toBe('queued');
    expect(() => transitionGenerationJobStatus(failedJob, 'succeeded', '2026-01-01T00:01:00.000Z')).toThrow('Invalid generation job transition');
  });

  it('rejects asset references that do not belong to the associated catalog item', () => {
    const item = adaptSeededFurnitureCatalogue().items[0];
    expect(digitalAssetMatchesCatalogItem(readyAsset, item)).toBe(false);
    const matchingAsset = { ...readyAsset, association: { catalogId: item.catalogId, catalogItemId: item.id } };
    expect(digitalAssetMatchesCatalogItem(matchingAsset, item)).toBe(true);
    expect(() => assertDigitalAssetMatchesCatalogItem(readyAsset, item)).toThrow('association does not match');
    expect(() => assertDigitalAssetMatchesCatalogItem(matchingAsset, item)).not.toThrow();
  });

  it('does not promote seeded legacy paths with no_asset status', () => {
    const item = adaptSeededFurnitureCatalogue().items[0];
    const mapping = mapCatalogItemDigitalAssetReference(item, { businessId: 'business-1' });

    expect(mapping).toMatchObject({ kind: 'unmapped', reason: 'no_asset_status' });
    expect(mapping.kind === 'unmapped' ? mapping.legacyReference?.modelUrl : undefined).toBe(item.digitalAsset?.modelUrl);
    expect(item.id).toBe('sofa-luma-01');
  });

  it('requires business scope and approved evidence before mapping active legacy references', () => {
    const item = adaptSeededFurnitureCatalogue().items[0];
    const activeItem = { ...item, digitalAsset: { ...item.digitalAsset!, status: 'processing' as const, assetId: 'legacy-asset-1' } };

    expect(mapCatalogItemDigitalAssetReference(activeItem)).toMatchObject({ kind: 'unmapped', reason: 'missing_business_scope' });
    expect(mapCatalogItemDigitalAssetReference(activeItem, { businessId: 'business-1' })).toMatchObject({ kind: 'unmapped', reason: 'missing_approved_file_reference' });
    expect(mapCatalogItemDigitalAssetReference(
      activeItem,
      { businessId: 'business-1', hasApprovedFileReference: true } as never,
    )).toMatchObject({ kind: 'unmapped', reason: 'missing_approved_file_reference' });
    expect(mapCatalogItemDigitalAssetReference(activeItem, { businessId: 'business-1' })).toMatchObject({
      kind: 'unmapped', reason: 'missing_approved_file_reference',
    });
  });
});
