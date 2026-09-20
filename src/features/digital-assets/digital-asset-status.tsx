import React from 'react';

import { digitalAssetReferenceSchema, type DigitalAssetReference, type DigitalAssetStatus } from '@/features/catalog/contracts';
import {
  digitalAssetSchema,
  type AssetFailure,
  type DigitalAsset,
} from './contracts';

export type DigitalAssetStatusInput = DigitalAssetReference | DigitalAsset | undefined;
export type DigitalAssetAction = { href: string; label?: string };
export type DigitalAssetActions = Partial<Record<'upload' | 'review' | 'retry' | 'preview' | 'download', DigitalAssetAction>>;

export type DigitalAssetStatusPresentation = {
  label: string;
  description: string;
  unavailableActions: ReadonlyArray<{ key: keyof DigitalAssetActions; label: string }>;
};

type ResolvedStatusInput =
  | { kind: 'reference'; value: DigitalAssetReference }
  | { kind: 'asset'; value: DigitalAsset }
  | { kind: 'invalid' };

const statusPresentations: Record<DigitalAssetStatus, DigitalAssetStatusPresentation> = {
  no_asset: {
    label: 'No asset',
    description: 'No verified digital asset is associated with this product.',
    unavailableActions: [{ key: 'upload', label: 'Upload image' }],
  },
  queued: {
    label: 'Queued',
    description: 'The asset request is queued; no usable file is available yet.',
    unavailableActions: [{ key: 'review', label: 'Review' }],
  },
  processing: {
    label: 'Processing',
    description: 'The asset is being prepared; no usable file is available yet.',
    unavailableActions: [{ key: 'review', label: 'Review' }],
  },
  needs_review: {
    label: 'Needs review',
    description: 'The asset is awaiting business review before it can be used.',
    unavailableActions: [{ key: 'review', label: 'Review' }],
  },
  ready: {
    label: 'Ready',
    description: 'A verified digital asset is ready for authorized use.',
    unavailableActions: [{ key: 'preview', label: 'Preview' }, { key: 'download', label: 'Download' }],
  },
  failed: {
    label: 'Failed',
    description: 'Asset processing failed; no ready asset is available.',
    unavailableActions: [{ key: 'retry', label: 'Retry' }],
  },
};

const invalidPresentation: DigitalAssetStatusPresentation = {
  label: 'Unavailable',
  description: 'The digital-asset status could not be validated.',
  unavailableActions: [
    { key: 'upload', label: 'Upload image' },
    { key: 'review', label: 'Review' },
    { key: 'retry', label: 'Retry' },
    { key: 'preview', label: 'Preview' },
    { key: 'download', label: 'Download' },
  ],
};

function resolveInput(input: unknown): ResolvedStatusInput {
  if (input === undefined) return { kind: 'reference', value: { status: 'no_asset' } };

  const assetResult = digitalAssetSchema.safeParse(input);
  if (assetResult.success) return { kind: 'asset', value: assetResult.data };

  const referenceResult = digitalAssetReferenceSchema.safeParse(input);
  if (referenceResult.success) return { kind: 'reference', value: referenceResult.data };

  return { kind: 'invalid' };
}

function getFailure(input: ResolvedStatusInput): AssetFailure | undefined {
  return input.kind === 'asset' ? input.value.failure : undefined;
}

function formatFailureCode(code: string): string {
  return code.replaceAll('_', ' ');
}

export function getDigitalAssetStatusPresentation(input: unknown): DigitalAssetStatusPresentation {
  const resolved = resolveInput(input);
  if (resolved.kind === 'invalid') return invalidPresentation;

  const status = resolved.value.status;
  if (status === 'ready' && resolved.kind === 'reference') {
    return {
      ...statusPresentations.ready,
      label: 'Ready reference',
      description: 'This catalogue reference is marked ready, but approved-file evidence is unavailable. Preview and download are unavailable.',
    };
  }

  return statusPresentations[status];
}

export function DigitalAssetStatusPresentation({
  input,
  actions,
  compact = false,
}: {
  input?: unknown;
  actions?: DigitalAssetActions;
  compact?: boolean;
}) {
  const resolved = resolveInput(input);
  const status = resolved.kind === 'invalid' ? 'invalid' : resolved.value.status;
  const presentation = getDigitalAssetStatusPresentation(input);
  const failure = resolved.kind !== 'invalid' && resolved.value.status === 'failed' ? getFailure(resolved) : undefined;
  const isVerifiedReadyAsset = resolved.kind === 'asset' && resolved.value.status === 'ready';

  return (
    <div
      aria-label={`Digital asset status: ${presentation.label}`}
      className={compact ? 'space-y-2' : 'rounded-xl border border-stone-200 bg-stone-50 p-4'}
      data-digital-asset-status={status}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-900">{presentation.label}</span>
        {!compact ? <span className="text-sm font-medium text-slate-800">Digital asset</span> : null}
      </div>
      <p className="text-sm leading-6 text-slate-600">{presentation.description}</p>
      {failure ? <p className="text-sm text-red-800">Failure code: <code>{formatFailureCode(failure.code)}</code></p> : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
        {presentation.unavailableActions.map(({ key, label }) => {
          const action = resolved.kind === 'invalid'
            || ((key === 'preview' || key === 'download') && !isVerifiedReadyAsset)
            ? undefined
            : actions?.[key];
          return action ? (
            <a key={key} href={action.href} className="text-cyan-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
              {action.label ?? label}
            </a>
          ) : (
            <span key={key} className="text-slate-500">{label} unavailable</span>
          );
        })}
      </div>
    </div>
  );
}
