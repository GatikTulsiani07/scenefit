import {
  assetOwnerScopeSchema,
  digitalAssetSchema,
  generationJobSchema,
  generationRequestSchema,
  generationResultSchema,
  transitionAssetStatus,
  transitionGenerationJobStatus,
  type AssetFailure,
  type AssetOwnerScope,
  type AssetStatus,
  type DigitalAsset,
  type GenerationJob,
  type GenerationJobStatus,
  type GenerationRequest,
  type GenerationResult,
} from './contracts';

export type DigitalAssetRepositorySnapshot = {
  requests: ReadonlyArray<GenerationRequest>;
  jobs: ReadonlyArray<GenerationJob>;
  assets: ReadonlyArray<DigitalAsset>;
};

export type DigitalAssetRepository = {
  submitGenerationRequest(request: GenerationRequest): { job: GenerationJob; created: boolean };
  recordGenerationJobStatus(input: {
    jobId: string;
    owner: AssetOwnerScope;
    status: GenerationJobStatus;
    updatedAt: string;
  }): GenerationJob;
  recordGenerationResult(result: GenerationResult, updatedAt: string): { job: GenerationJob; asset?: DigitalAsset };
  saveDigitalAsset(asset: DigitalAsset): DigitalAsset;
  recordDigitalAssetStatus(input: {
    assetId: string;
    owner: AssetOwnerScope;
    status: AssetStatus;
    updatedAt: string;
    failure?: AssetFailure;
    approvedAt?: string;
  }): DigitalAsset;
  getGenerationJob(jobId: string, owner?: AssetOwnerScope): GenerationJob | undefined;
  getDigitalAsset(assetId: string, owner?: AssetOwnerScope): DigitalAsset | undefined;
  snapshot(): DigitalAssetRepositorySnapshot;
};

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function normalizeOwner(owner: AssetOwnerScope): AssetOwnerScope {
  return assetOwnerScopeSchema.parse(owner);
}

function sameOwner(expected: AssetOwnerScope, actual: AssetOwnerScope): boolean {
  return expected.businessId === actual.businessId;
}

function sameRequest(existing: GenerationRequest, incoming: GenerationRequest): boolean {
  return existing.owner.businessId === incoming.owner.businessId
    && existing.association.catalogId === incoming.association.catalogId
    && existing.association.catalogItemId === incoming.association.catalogItemId
    && existing.kind === incoming.kind
    && existing.sourceAssetId === incoming.sourceAssetId;
}

function sameAsset(existing: DigitalAsset, incoming: DigitalAsset): boolean {
  return existing.owner.businessId === incoming.owner.businessId
    && existing.association.catalogId === incoming.association.catalogId
    && existing.association.catalogItemId === incoming.association.catalogItemId
    && existing.kind === incoming.kind
    && existing.status === incoming.status
    && existing.approvedAt === incoming.approvedAt
    && JSON.stringify(existing.approvedFiles) === JSON.stringify(incoming.approvedFiles)
    && JSON.stringify(existing.failure) === JSON.stringify(incoming.failure);
}

function sameJob(existing: GenerationJob, incoming: GenerationJob): boolean {
  return existing.owner.businessId === incoming.owner.businessId
    && existing.association.catalogId === incoming.association.catalogId
    && existing.association.catalogItemId === incoming.association.catalogItemId
    && existing.requestId === incoming.requestId;
}

function createJobFromRequest(request: GenerationRequest): GenerationJob {
  return generationJobSchema.parse({
    id: `job-${request.id}`,
    requestId: request.id,
    owner: request.owner,
    association: request.association,
    status: 'queued',
    createdAt: request.requestedAt,
    updatedAt: request.requestedAt,
  });
}

function updateAssetStatus(
  asset: DigitalAsset,
  status: AssetStatus,
  updatedAt: string,
  options: { failure?: AssetFailure; approvedAt?: string } = {},
): DigitalAsset {
  if (asset.status === status) {
    return digitalAssetSchema.parse({
      ...asset,
      updatedAt,
      ...(status === 'failed' ? { failure: options.failure ?? asset.failure } : {}),
      ...(status === 'ready' && options.approvedAt ? { approvedAt: options.approvedAt } : {}),
    });
  }

  return transitionAssetStatus(asset, status, updatedAt, options);
}

function updateJobStatus(job: GenerationJob, status: GenerationJobStatus, updatedAt: string): GenerationJob {
  if (job.status === status) {
    return generationJobSchema.parse({ ...job, updatedAt });
  }

  return transitionGenerationJobStatus(job, status, updatedAt);
}

export function createDigitalAssetRepository(initialState: Partial<DigitalAssetRepositorySnapshot> = {}): DigitalAssetRepository {
  const requestsById = new Map<string, GenerationRequest>();
  const jobsById = new Map<string, GenerationJob>();
  const assetsById = new Map<string, DigitalAsset>();

  for (const request of initialState.requests ?? []) {
    const parsed = generationRequestSchema.parse(request);
    requestsById.set(parsed.id, cloneValue(parsed));
  }

  for (const job of initialState.jobs ?? []) {
    const parsed = generationJobSchema.parse(job);
    jobsById.set(parsed.id, cloneValue(parsed));
  }

  for (const asset of initialState.assets ?? []) {
    const parsed = digitalAssetSchema.parse(asset);
    assetsById.set(parsed.id, cloneValue(parsed));
  }

  return {
    submitGenerationRequest(request) {
      const parsed = generationRequestSchema.parse(request);
      const normalized = { ...parsed, owner: normalizeOwner(parsed.owner) };
      const existingRequest = requestsById.get(normalized.id);

      if (existingRequest) {
        if (!sameRequest(existingRequest, normalized)) {
          throw new Error('generation request id already exists with different ownership or scope');
        }

        const existingJob = jobsById.get(`job-${existingRequest.id}`);
        if (existingJob) {
          if (!sameOwner(existingJob.owner, normalized.owner)) {
            throw new Error('generation job owner must match the persisted business scope');
          }

          return { job: cloneValue(existingJob), created: false };
        }

        const restored = createJobFromRequest(existingRequest);
        jobsById.set(restored.id, cloneValue(restored));
        return { job: cloneValue(restored), created: false };
      }

      requestsById.set(normalized.id, cloneValue(normalized));

      const jobId = `job-${normalized.id}`;
      const existingJob = jobsById.get(jobId);
      if (existingJob) {
        if (!sameOwner(existingJob.owner, normalized.owner)) {
          throw new Error('generation job owner must match the persisted business scope');
        }

        const expected = createJobFromRequest(normalized);
        if (!sameJob(existingJob, expected)) {
          throw new Error('generation job id already exists with different ownership or content');
        }

        return { job: cloneValue(existingJob), created: false };
      }

      const job = createJobFromRequest(normalized);
      jobsById.set(job.id, cloneValue(job));
      return { job: cloneValue(job), created: true };
    },

    recordGenerationJobStatus(input) {
      const owner = normalizeOwner(input.owner);
      const job = jobsById.get(input.jobId);

      if (!job) {
        throw new Error('generation job was not found');
      }

      if (!sameOwner(job.owner, owner)) {
        throw new Error('generation job owner must match the persisted business scope');
      }

      const updatedJob = updateJobStatus(job, input.status, input.updatedAt);
      jobsById.set(updatedJob.id, cloneValue(updatedJob));
      return cloneValue(updatedJob);
    },

    recordGenerationResult(result, updatedAt) {
      const parsed = generationResultSchema.parse(result);
      const job = jobsById.get(parsed.jobId);

      if (!job) {
        throw new Error('generation job was not found');
      }

      if (!sameOwner(job.owner, parsed.owner)) {
        throw new Error('generation result owner must match the persisted business scope');
      }

      if (job.requestId !== parsed.requestId) {
        throw new Error('generation result request must match the persisted job');
      }

      let savedAsset: DigitalAsset | undefined;
      if (parsed.asset) {
        savedAsset = this.saveDigitalAsset(parsed.asset);
      }

      const status = parsed.status === 'succeeded' ? 'succeeded' : 'failed';
      const normalizedJob = job.status === 'queued'
        ? updateJobStatus(job, 'processing', updatedAt)
        : job;
      const updatedJob = updateJobStatus(normalizedJob, status, updatedAt);
      jobsById.set(updatedJob.id, cloneValue(updatedJob));

      return { job: cloneValue(updatedJob), asset: savedAsset ? cloneValue(savedAsset) : undefined };
    },

    saveDigitalAsset(asset) {
      const parsed = digitalAssetSchema.parse(asset);
      const existing = assetsById.get(parsed.id);

      if (existing) {
        if (!sameAsset(existing, parsed)) {
          throw new Error('digital asset id already exists with different ownership or content');
        }

        return cloneValue(existing);
      }

      assetsById.set(parsed.id, cloneValue(parsed));
      return cloneValue(parsed);
    },

    recordDigitalAssetStatus(input) {
      const owner = normalizeOwner(input.owner);
      const asset = assetsById.get(input.assetId);

      if (!asset) {
        throw new Error('digital asset was not found');
      }

      if (!sameOwner(asset.owner, owner)) {
        throw new Error('digital asset owner must match the persisted business scope');
      }

      const updatedAsset = updateAssetStatus(asset, input.status, input.updatedAt, {
        failure: input.failure,
        approvedAt: input.approvedAt,
      });
      assetsById.set(updatedAsset.id, cloneValue(updatedAsset));
      return cloneValue(updatedAsset);
    },

    getGenerationJob(jobId, owner) {
      const job = jobsById.get(jobId);
      if (!job) return undefined;
      if (owner && !sameOwner(job.owner, normalizeOwner(owner))) return undefined;
      return cloneValue(job);
    },

    getDigitalAsset(assetId, owner) {
      const asset = assetsById.get(assetId);
      if (!asset) return undefined;
      if (owner && !sameOwner(asset.owner, normalizeOwner(owner))) return undefined;
      return cloneValue(asset);
    },

    snapshot() {
      return {
        requests: cloneValue([...requestsById.values()]),
        jobs: cloneValue([...jobsById.values()]),
        assets: cloneValue([...assetsById.values()]),
      };
    },
  };
}
