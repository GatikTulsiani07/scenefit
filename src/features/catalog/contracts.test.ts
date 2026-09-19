import { describe, expect, it } from 'vitest';

import {
  catalogItemSchema,
  catalogSchema,
  digitalAssetReferenceSchema,
  digitalAssetStatusSchema,
  dimensionsSchema,
  pricingSchema,
  publicationStatusSchema,
  type CatalogItem,
} from './contracts';

const validCatalogItem: CatalogItem = {
  id: 'item-1',
  catalogId: 'catalog-1',
  name: 'Display fixture',
  description: 'A configurable display fixture.',
  category: 'Fixtures',
  sku: 'FIXTURE-001',
  publicationStatus: 'draft',
  pricing: { type: 'fixed', amount: 1250, currency: 'USD' },
  dimensions: { width: 1.2, height: 0.8, depth: 0.5, unit: 'm' },
  digitalAsset: {
    assetId: 'asset-1',
    status: 'ready',
    thumbnailUrl: '/assets/fixture.png',
    modelUrl: '/assets/fixture.glb',
  },
  metadata: { finish: 'oak' },
};

describe('generic catalog contracts', () => {
  it('accepts each publication and digital asset status', () => {
    for (const status of ['draft', 'published', 'archived']) {
      expect(publicationStatusSchema.parse(status)).toBe(status);
    }

    for (const status of ['no_asset', 'queued', 'processing', 'needs_review', 'ready', 'failed']) {
      expect(digitalAssetStatusSchema.parse(status)).toBe(status);
    }
  });

  it('rejects unsupported status values', () => {
    expect(publicationStatusSchema.safeParse('private').success).toBe(false);
    expect(digitalAssetStatusSchema.safeParse('uploaded').success).toBe(false);
  });

  it('supports fixed, starting-from, quote, and hidden pricing without assuming a fixed price', () => {
    expect(pricingSchema.parse({ type: 'fixed', amount: 25.5, currency: 'EUR' })).toEqual({
      type: 'fixed',
      amount: 25.5,
      currency: 'EUR',
    });
    expect(pricingSchema.parse({ type: 'starting_from', amount: 500, currency: 'AED' })).toEqual({
      type: 'starting_from',
      amount: 500,
      currency: 'AED',
    });
    expect(pricingSchema.parse({ type: 'custom_quote' })).toEqual({ type: 'custom_quote' });
    expect(pricingSchema.parse({ type: 'hidden' })).toEqual({ type: 'hidden' });

    for (const invalidPricing of [
      { type: 'fixed', amount: -1, currency: 'USD' },
      { type: 'fixed', amount: Number.POSITIVE_INFINITY, currency: 'USD' },
      { type: 'starting_from', amount: 10, currency: 'usd' },
      { type: 'custom_quote', amount: 1 },
    ]) {
      expect(pricingSchema.safeParse(invalidPricing).success).toBe(false);
    }
  });

  it('validates configurable dimension units and rejects invalid measurements', () => {
    expect(dimensionsSchema.parse({ width: 120, height: 80, depth: 50, unit: 'cm' })).toEqual({
      width: 120,
      height: 80,
      depth: 50,
      unit: 'cm',
    });

    for (const invalidDimensions of [
      { width: 0, height: 1, depth: 1, unit: 'm' },
      { width: 1, height: -1, depth: 1, unit: 'm' },
      { width: 1, height: 1, depth: Number.NaN, unit: 'm' },
      { width: 1, height: 1, depth: 1, unit: ' ' },
    ]) {
      expect(dimensionsSchema.safeParse(invalidDimensions).success).toBe(false);
    }
  });

  it('does not treat a configured model path as a ready or downloadable asset', () => {
    expect(
      digitalAssetReferenceSchema.parse({
        status: 'no_asset',
        modelUrl: '/legacy/model.glb',
        thumbnailUrl: '/legacy/thumbnail.png',
      }),
    ).toMatchObject({ status: 'no_asset', modelUrl: '/legacy/model.glb' });
    expect(
      digitalAssetReferenceSchema.safeParse({ status: 'ready', modelUrl: '/legacy/model.glb' }).success,
    ).toBe(false);
  });

  it('validates catalog items and catalog membership, IDs, and SKUs', () => {
    expect(catalogItemSchema.parse(validCatalogItem)).toEqual(validCatalogItem);
    expect(
      catalogSchema.parse({ id: 'catalog-1', name: 'Example catalog', items: [validCatalogItem] }),
    ).toEqual({ id: 'catalog-1', name: 'Example catalog', items: [validCatalogItem] });

    for (const invalidCatalog of [
      { id: 'catalog-1', name: 'Example', items: [{ ...validCatalogItem, catalogId: 'other' }] },
      { id: 'catalog-1', name: 'Example', items: [validCatalogItem, { ...validCatalogItem, id: 'item-2' }] },
      { id: 'catalog-1', name: 'Example', items: [validCatalogItem, { ...validCatalogItem, sku: 'FIXTURE-002' }] },
    ]) {
      expect(catalogSchema.safeParse(invalidCatalog).success).toBe(false);
    }
  });
});
