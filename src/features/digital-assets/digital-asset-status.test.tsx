import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { adaptSeededFurnitureCatalogue } from '@/features/catalog/legacy-furniture-adapter';

import { DigitalAssetStatusPresentation, getDigitalAssetStatusPresentation } from './digital-asset-status';
import { digitalAssetSchema, type DigitalAsset } from './contracts';

const statuses = ['no_asset', 'queued', 'processing', 'needs_review', 'ready', 'failed'] as const;

function referenceForStatus(status: (typeof statuses)[number]) {
  return status === 'no_asset' ? { status } : { status, assetId: `asset-${status}` };
}

function failedAsset(): DigitalAsset {
  return digitalAssetSchema.parse({
    id: 'asset-failed',
    owner: { businessId: 'business-1' },
    association: { catalogId: 'catalog-1', catalogItemId: 'item-1' },
    kind: 'image',
    status: 'failed',
    approvedFiles: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:01:00.000Z',
    failure: { code: 'processing_failed', message: 'provider internals must not be exposed' },
  });
}

function readyAsset(): DigitalAsset {
  return digitalAssetSchema.parse({
    id: 'asset-ready',
    owner: { businessId: 'business-1' },
    association: { catalogId: 'catalog-1', catalogItemId: 'item-1' },
    kind: 'image',
    status: 'ready',
    approvedFiles: [{
      kind: 'image',
      uri: '/assets/item.png',
      mimeType: 'image/png',
      byteSize: 1024,
      checksumSha256: 'a'.repeat(64),
      approvedAt: '2026-01-01T00:01:00.000Z',
    }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:02:00.000Z',
    approvedAt: '2026-01-01T00:01:00.000Z',
  });
}

describe('DigitalAssetStatusPresentation', () => {
  it('presents all six validated catalogue-reference statuses with accessible labels', () => {
    for (const status of statuses) {
      const markup = renderToStaticMarkup(<DigitalAssetStatusPresentation input={referenceForStatus(status)} />);
      const presentation = getDigitalAssetStatusPresentation(referenceForStatus(status));

      expect(markup).toContain(`aria-label="Digital asset status: ${presentation.label}"`);
      expect(markup).toContain(presentation.description);
      expect(markup).toContain(`data-digital-asset-status="${status}"`);
    }
  });

  it('presents structured failure codes safely without exposing failure messages', () => {
    const markup = renderToStaticMarkup(<DigitalAssetStatusPresentation input={failedAsset()} />);

    expect(markup).toContain('Failure code: <code>processing failed</code>');
    expect(markup).not.toContain('provider internals must not be exposed');
    expect(markup).toContain('Retry unavailable');
    expect(markup).not.toContain('<button');
  });

  it('keeps actions unavailable unless an action destination is supplied', () => {
    const unavailable = renderToStaticMarkup(<DigitalAssetStatusPresentation input={referenceForStatus('ready')} actions={{ preview: { href: '/catalog/item-1/preview' }, download: { href: '/assets/item.png' } }} />);
    const available = renderToStaticMarkup(<DigitalAssetStatusPresentation input={readyAsset()} actions={{ preview: { href: '/catalog/item-1/preview' }, download: { href: '/assets/item.png' } }} />);

    expect(unavailable).toContain('Preview unavailable');
    expect(unavailable).toContain('Download unavailable');
    expect(unavailable).toContain('Ready reference');
    expect(unavailable).not.toContain('href=');
    expect(available).toContain('href="/catalog/item-1/preview"');
    expect(available).not.toContain('Preview unavailable');
    expect(available).toContain('href="/assets/item.png"');
  });

  it('renders an unavailable state for malformed input without indexing a missing status', () => {
    const markup = renderToStaticMarkup(<DigitalAssetStatusPresentation input={{ status: 'unknown', assetId: 'asset-invalid' }} actions={{ preview: { href: '/preview' } }} />);

    expect(markup).toContain('data-digital-asset-status="invalid"');
    expect(markup).toContain('status could not be validated.');
    expect(markup).toContain('Preview unavailable');
    expect(markup).not.toContain('href="/preview"');
  });

  it('keeps seeded legacy paths at no asset', () => {
    const item = adaptSeededFurnitureCatalogue().items[0];
    const markup = renderToStaticMarkup(<DigitalAssetStatusPresentation input={item.digitalAsset} />);

    expect(item.digitalAsset?.modelUrl).toBeTruthy();
    expect(markup).toContain('data-digital-asset-status="no_asset"');
    expect(markup).toContain('No verified digital asset is associated');
    expect(markup).toContain('Upload image unavailable');
    expect(markup).not.toContain('Ready');
    expect(markup).not.toContain('href=');
  });
});
