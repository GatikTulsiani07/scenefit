import { z } from 'zod';

import type { CatalogItem } from '@/features/catalog/contracts';

const nonEmptyIdentifierSchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });

function containsTraversalSegment(value: string): boolean {
  let decoded = value;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    let next: string;
    try {
      next = decodeURIComponent(decoded).replaceAll('\\', '/');
    } catch {
      return true;
    }

    if (next === decoded) break;
    decoded = next;
  }

  return decoded.split('/').some((segment) => segment === '..');
}

const approvedUriSchema = z.string().trim().min(1).refine(
  (value) => {
    if (/\s/.test(value) || value.startsWith('//')) return false;
    if (value.startsWith('/')) return !containsTraversalSegment(value);

    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'must be an application-relative path or an HTTPS URL' },
);

export const assetOwnerScopeSchema = z.object({
  businessId: nonEmptyIdentifierSchema,
}).strict();

export const assetKindSchema = z.enum(['image', 'model_3d', 'thumbnail', 'texture']);

export const assetStatusSchema = z.enum([
  'queued',
  'processing',
  'needs_review',
  'ready',
  'failed',
]);

export const approvedFileReferenceSchema = z.object({
  kind: assetKindSchema,
  uri: approvedUriSchema,
  mimeType: z.string().trim().regex(/^[\w.+-]+\/[\w.+-]+$/),
  byteSize: z.number().int().positive(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  approvedAt: isoTimestampSchema,
}).strict();

export const assetFailureCodeSchema = z.enum([
  'validation_failed',
  'unsupported_input',
  'processing_failed',
  'provider_unavailable',
  'timed_out',
  'cancelled',
]);

export const assetFailureSchema = z.object({
  code: assetFailureCodeSchema,
  message: nonEmptyIdentifierSchema,
}).strict();

export const catalogItemAssociationSchema = z.object({
  catalogId: nonEmptyIdentifierSchema,
  catalogItemId: nonEmptyIdentifierSchema,
}).strict();

export const digitalAssetSchema = z
  .object({
    id: nonEmptyIdentifierSchema,
    owner: assetOwnerScopeSchema,
    association: catalogItemAssociationSchema,
    kind: assetKindSchema,
    status: assetStatusSchema,
    approvedFiles: z.array(approvedFileReferenceSchema).max(20),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
    approvedAt: isoTimestampSchema.optional(),
    failure: assetFailureSchema.optional(),
  })
  .strict()
  .superRefine((asset, context) => {
    const createdAt = new Date(asset.createdAt).getTime();
    const updatedAt = new Date(asset.updatedAt).getTime();

    if (updatedAt < createdAt) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'updatedAt cannot be before createdAt', path: ['updatedAt'] });
    }

    for (const [index, file] of asset.approvedFiles.entries()) {
      const fileApprovedAt = new Date(file.approvedAt).getTime();
      if (fileApprovedAt < createdAt || fileApprovedAt > updatedAt) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'file approval timestamps must fall between createdAt and updatedAt',
          path: ['approvedFiles', index, 'approvedAt'],
        });
      }
    }

    if (asset.approvedAt) {
      const approvedAt = new Date(asset.approvedAt).getTime();
      if (asset.status !== 'ready') {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'approvedAt is only valid for ready assets', path: ['approvedAt'] });
      }
      if (approvedAt < createdAt || approvedAt > updatedAt) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'approvedAt must fall between createdAt and updatedAt', path: ['approvedAt'] });
      }
      if (asset.approvedFiles.some((file) => new Date(file.approvedAt).getTime() > approvedAt)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'asset approval cannot precede file approval', path: ['approvedAt'] });
      }
    }

    if (asset.status === 'ready' && (!asset.approvedAt || !asset.approvedFiles.some((file) => file.kind === asset.kind))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ready assets require an approved file appropriate to their asset kind and approvedAt',
        path: ['approvedFiles'],
      });
    }

    if (asset.status === 'failed' && !asset.failure) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'failed assets require a structured failure',
        path: ['failure'],
      });
    }
  });

export const generationRequestSchema = z.object({
  id: nonEmptyIdentifierSchema,
  owner: assetOwnerScopeSchema,
  association: catalogItemAssociationSchema,
  kind: assetKindSchema,
  requestedAt: isoTimestampSchema,
  sourceAssetId: nonEmptyIdentifierSchema.optional(),
}).strict();

export const generationJobStatusSchema = z.enum(['queued', 'processing', 'succeeded', 'failed']);

export const generationJobSchema = z.object({
  id: nonEmptyIdentifierSchema,
  requestId: nonEmptyIdentifierSchema,
  owner: assetOwnerScopeSchema,
  association: catalogItemAssociationSchema,
  status: generationJobStatusSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
}).strict().superRefine((job, context) => {
  if (new Date(job.updatedAt).getTime() < new Date(job.createdAt).getTime()) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'updatedAt cannot be before createdAt', path: ['updatedAt'] });
  }
});

export const generationFailureSchema = z.object({
  code: assetFailureCodeSchema,
  message: nonEmptyIdentifierSchema,
}).strict();

export const generationResultSchema = z.object({
  jobId: nonEmptyIdentifierSchema,
  requestId: nonEmptyIdentifierSchema,
  owner: assetOwnerScopeSchema,
  association: catalogItemAssociationSchema,
  status: z.enum(['succeeded', 'failed']),
  asset: digitalAssetSchema.optional(),
  failure: generationFailureSchema.optional(),
}).strict().superRefine((result, context) => {
  // A successful generation may return a generated asset awaiting human review;
  // it cannot return an unstarted, processing, or failed asset.
  if (result.status === 'succeeded' && !result.asset) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'successful jobs require an asset result', path: ['asset'] });
  }
  if (result.status === 'succeeded' && result.failure) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'successful jobs cannot include a failure', path: ['failure'] });
  }
  if (result.status === 'succeeded' && result.asset && !['needs_review', 'ready'].includes(result.asset.status)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'successful jobs require an asset that is ready or needs review', path: ['asset', 'status'] });
  }
  if (result.status === 'failed' && !result.failure) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'failed jobs require a structured failure', path: ['failure'] });
  }
  if (result.status === 'failed' && result.asset) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'failed jobs cannot include an asset result', path: ['asset'] });
  }
  if (result.asset && result.asset.owner.businessId !== result.owner.businessId) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'result asset owner must match the generation request owner', path: ['asset', 'owner', 'businessId'] });
  }
  if (result.asset && (result.asset.association.catalogId !== result.association.catalogId || result.asset.association.catalogItemId !== result.association.catalogItemId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'result asset association must match the generation request', path: ['asset', 'association'] });
  }
});

export type AssetOwnerScope = z.infer<typeof assetOwnerScopeSchema>;
export type AssetKind = z.infer<typeof assetKindSchema>;
export type AssetStatus = z.infer<typeof assetStatusSchema>;
export type ApprovedFileReference = z.infer<typeof approvedFileReferenceSchema>;
export type AssetFailure = z.infer<typeof assetFailureSchema>;
export type CatalogItemAssociation = z.infer<typeof catalogItemAssociationSchema>;
export type DigitalAsset = z.infer<typeof digitalAssetSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type GenerationJobStatus = z.infer<typeof generationJobStatusSchema>;
export type GenerationJob = z.infer<typeof generationJobSchema>;
export type GenerationFailure = z.infer<typeof generationFailureSchema>;
export type GenerationResult = z.infer<typeof generationResultSchema>;

const assetTransitions: Record<AssetStatus, readonly AssetStatus[]> = {
  queued: ['processing', 'failed'],
  processing: ['needs_review', 'failed'],
  needs_review: ['ready', 'failed', 'processing'],
  ready: [],
  failed: ['queued'],
};

const jobTransitions: Record<GenerationJobStatus, readonly GenerationJobStatus[]> = {
  queued: ['processing', 'failed'],
  processing: ['succeeded', 'failed'],
  succeeded: [],
  failed: ['queued'],
};

export function canTransitionAssetStatus(from: AssetStatus, to: AssetStatus): boolean {
  return assetTransitions[from].includes(to);
}

export function canTransitionGenerationJobStatus(from: GenerationJobStatus, to: GenerationJobStatus): boolean {
  return jobTransitions[from].includes(to);
}

export function transitionAssetStatus(
  asset: DigitalAsset,
  status: AssetStatus,
  updatedAt: string,
  options: { failure?: AssetFailure; approvedAt?: string } = {},
): DigitalAsset {
  if (!canTransitionAssetStatus(asset.status, status)) {
    throw new Error(`Invalid digital asset transition: ${asset.status} → ${status}`);
  }

  return digitalAssetSchema.parse({
    ...asset,
    status,
    updatedAt,
    ...(status === 'failed'
      ? { failure: options.failure ?? asset.failure }
      : { failure: undefined }),
    ...(options.approvedAt ? { approvedAt: options.approvedAt } : {}),
  });
}

export function transitionGenerationJobStatus(job: GenerationJob, status: GenerationJobStatus, updatedAt: string): GenerationJob {
  if (!canTransitionGenerationJobStatus(job.status, status)) {
    throw new Error(`Invalid generation job transition: ${job.status} → ${status}`);
  }

  return generationJobSchema.parse({ ...job, status, updatedAt });
}

export function digitalAssetMatchesCatalogItem(asset: DigitalAsset, item: CatalogItem): boolean {
  return asset.association.catalogId === item.catalogId
    && asset.association.catalogItemId === item.id;
}

export function assertDigitalAssetMatchesCatalogItem(asset: DigitalAsset, item: CatalogItem): void {
  if (!digitalAssetMatchesCatalogItem(asset, item)) {
    throw new Error('Digital asset association does not match the catalog item');
  }
}
