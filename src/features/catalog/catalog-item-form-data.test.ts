import { describe, expect, it } from 'vitest';

import { adaptSeededFurnitureCatalogue } from './legacy-furniture-adapter';
import {
  buildCatalogItemPayload,
  findCatalogItemById,
  getCatalogItemFormValues,
  getNewCatalogItemFormValues,
  hasCatalogItemFormChanges,
  validateCatalogItemForm,
} from './catalog-item-form-data';

describe('catalog item form data', () => {
  it('provides generic defaults for a new item', () => {
    expect(getNewCatalogItemFormValues()).toMatchObject({
      name: '',
      productType: 'Product',
      pricingType: 'custom_quote',
      currency: 'USD',
      publicationStatus: 'draft',
      digitalAssetStatus: 'no_asset',
    });
  });

  it('populates edit values from an adapted catalogue item', () => {
    const item = adaptSeededFurnitureCatalogue().items[0];
    const values = getCatalogItemFormValues(item);

    expect(values).toMatchObject({
      name: item.name,
      sku: item.sku,
      category: item.category,
      pricingType: 'fixed',
      currency: 'AED',
      amount: String(item.pricing.type === 'fixed' ? item.pricing.amount : ''),
      width: String(item.dimensions?.width),
      digitalAssetStatus: 'no_asset',
    });
  });

  it('finds the matching edit item and returns undefined for an unknown ID', () => {
    const catalog = adaptSeededFurnitureCatalogue();

    expect(findCatalogItemById(catalog, catalog.items[0].id)).toEqual(catalog.items[0]);
    expect(findCatalogItemById(catalog, 'unknown-item')).toBeUndefined();
  });

  it('requires core fields and pricing amounts only when applicable', () => {
    const values = getNewCatalogItemFormValues();
    const requiredResult = validateCatalogItemForm(values, { id: 'new-item', catalogId: 'catalog-1' });
    expect(requiredResult).toMatchObject({ success: false, fieldErrors: { name: expect.any(String), category: expect.any(String) } });

    const quoteValues = { ...values, name: 'Display', category: 'Fixtures', pricingType: 'custom_quote' as const };
    expect(validateCatalogItemForm(quoteValues, { id: 'new-item', catalogId: 'catalog-1' }).success).toBe(true);

    const fixedValues = { ...quoteValues, pricingType: 'fixed' as const };
    expect(validateCatalogItemForm(fixedValues, { id: 'new-item', catalogId: 'catalog-1' })).toMatchObject({ success: false, fieldErrors: { amount: expect.any(String) } });
  });

  it('rejects invalid pricing and partial or invalid dimensions', () => {
    const base = { ...getNewCatalogItemFormValues(), name: 'Fixture', category: 'Fixtures', pricingType: 'fixed' as const, amount: '-2' };
    expect(validateCatalogItemForm(base, { id: 'item-1', catalogId: 'catalog-1' })).toMatchObject({ success: false, fieldErrors: { amount: expect.any(String) } });

    const partialDimensions = { ...base, amount: '10', width: '1', height: '' };
    expect(validateCatalogItemForm(partialDimensions, { id: 'item-1', catalogId: 'catalog-1' })).toMatchObject({ success: false, fieldErrors: { width: expect.any(String), depth: expect.any(String) } });

    const invalidDimensions = { ...base, amount: '10', width: '1', height: '2', depth: '-1' };
    expect(validateCatalogItemForm(invalidDimensions, { id: 'item-1', catalogId: 'catalog-1' })).toMatchObject({ success: false, fieldErrors: { depth: expect.any(String) } });
  });

  it('builds and validates a valid payload without requiring an amount for hidden pricing', () => {
    const values = { ...getNewCatalogItemFormValues(), name: 'Display package', category: 'Fixtures', productType: 'Service', pricingType: 'hidden' as const, width: '1.2', height: '2', depth: '0.5' };
    const result = validateCatalogItemForm(values, { id: 'item-1', catalogId: 'catalog-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.payload).toMatchObject({ id: 'item-1', category: 'Fixtures', pricing: { type: 'hidden' }, dimensions: { width: 1.2, height: 2, depth: 0.5 }, metadata: { productType: 'Service' } });
    }

    expect(buildCatalogItemPayload(values, { id: 'item-1', catalogId: 'catalog-1' })).toMatchObject({ pricing: { type: 'hidden' } });
  });

  it('preserves edit-only metadata and digital-asset paths in a valid payload', () => {
    const source = adaptSeededFurnitureCatalogue().items[0];
    const existingItem = {
      ...source,
      metadata: { ...source.metadata, productType: 'Display', finish: 'walnut', internalCode: 'INT-42' },
      digitalAsset: {
        assetId: 'asset-existing',
        status: 'ready' as const,
        thumbnailUrl: '/assets/existing-thumbnail.png',
        modelUrl: '/assets/existing-model.glb',
      },
    };
    const values = { ...getCatalogItemFormValues(existingItem), name: 'Updated display' };
    const result = validateCatalogItemForm(values, { id: 'ignored-id', catalogId: existingItem.catalogId, existingItem });

    expect(result).toMatchObject({
      success: true,
      payload: {
        id: existingItem.id,
        metadata: { productType: 'Display', finish: 'walnut', internalCode: 'INT-42' },
        digitalAsset: {
          assetId: 'asset-existing',
          status: 'ready',
          thumbnailUrl: '/assets/existing-thumbnail.png',
          modelUrl: '/assets/existing-model.glb',
        },
      },
    });
  });

  it('detects unsaved changes without implying persistence', () => {
    const initial = getNewCatalogItemFormValues();
    expect(hasCatalogItemFormChanges(initial, initial)).toBe(false);
    expect(hasCatalogItemFormChanges(initial, { ...initial, name: 'Changed' })).toBe(true);
  });
});
