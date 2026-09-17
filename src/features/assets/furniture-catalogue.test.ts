import { describe, expect, it } from 'vitest';

import {
  filterFurnitureAssetsByCategory,
  findFurnitureAssetById,
  furnitureAssetSchema,
  furnitureCatalogue,
  furnitureCatalogueSchema,
  getAvailableFurnitureCategories,
  getFurnitureCatalogue,
  type FurnitureAsset,
} from './furniture-catalogue';

const validAsset: FurnitureAsset = {
  assetId: 'sofa-demo-01',
  name: 'Demo sofa',
  category: 'Seating',
  sku: 'DEMO-SOFA-001',
  description: 'A valid demo product.',
  priceAed: 2500,
  thumbnailUrl: '/assets/thumbnails/demo-sofa.png',
  modelUrl: '/assets/models/demo-sofa.glb',
  dimensions: {
    widthMetres: 2.2,
    heightMetres: 0.9,
    depthMetres: 0.95,
  },
  metadata: {
    fabric: 'linen',
  },
};

const validCatalogue = furnitureCatalogue;

describe('furniture asset contract', () => {
  it('accepts a valid furniture asset', () => {
    expect(furnitureAssetSchema.parse(validAsset)).toEqual(validAsset);
  });

  it('rejects empty identifiers, names, categories, and SKUs', () => {
    for (const invalidAsset of [
      { ...validAsset, assetId: ' ' },
      { ...validAsset, name: '' },
      { ...validAsset, category: ' ' },
      { ...validAsset, sku: '' },
    ]) {
      expect(furnitureAssetSchema.safeParse(invalidAsset).success).toBe(false);
    }
  });

  it('rejects invalid thumbnail and model paths', () => {
    for (const invalidAsset of [
      { ...validAsset, thumbnailUrl: 'assets/demo-sofa.png' },
      { ...validAsset, thumbnailUrl: 'https://example.com/demo-sofa.png' },
      { ...validAsset, thumbnailUrl: '/assets/thumbnails/demo-sofa.svg' },
      { ...validAsset, modelUrl: 'demo-sofa.glb' },
      { ...validAsset, modelUrl: 'https://example.com/demo-sofa.glb' },
      { ...validAsset, modelUrl: '/assets/models/demo-sofa.obj' },
    ]) {
      expect(furnitureAssetSchema.safeParse(invalidAsset).success).toBe(false);
    }
  });

  it('rejects unsupported metadata keys and invalid metadata values', () => {
    for (const invalidAsset of [
      { ...validAsset, metadata: { finish: 'linen' } },
      { ...validAsset, metadata: { isHeroItem: 'yes' } },
      { ...validAsset, metadata: { fabric: '' } },
    ]) {
      expect(furnitureAssetSchema.safeParse(invalidAsset).success).toBe(false);
    }
  });

  it('rejects negative, non-integer, and non-finite prices', () => {
    for (const invalidAsset of [
      { ...validAsset, priceAed: -1 },
      { ...validAsset, priceAed: 1999.5 },
      { ...validAsset, priceAed: Number.POSITIVE_INFINITY },
      { ...validAsset, priceAed: Number.NaN },
    ]) {
      expect(furnitureAssetSchema.safeParse(invalidAsset).success).toBe(false);
    }
  });

  it('rejects zero, negative, infinite, and non-numeric dimensions', () => {
    for (const invalidAsset of [
      { ...validAsset, dimensions: { ...validAsset.dimensions, widthMetres: 0 } },
      { ...validAsset, dimensions: { ...validAsset.dimensions, heightMetres: -0.1 } },
      { ...validAsset, dimensions: { ...validAsset.dimensions, depthMetres: Number.POSITIVE_INFINITY } },
      { ...validAsset, dimensions: { ...validAsset.dimensions, widthMetres: Number.NaN } },
    ]) {
      expect(furnitureAssetSchema.safeParse(invalidAsset).success).toBe(false);
    }
  });

  it('accepts the complete valid ten-product catalogue', () => {
    expect(furnitureCatalogueSchema.parse(validCatalogue)).toEqual(validCatalogue);
    expect(validCatalogue).toHaveLength(10);
    expect(new Set(validCatalogue.map((asset) => asset.assetId)).size).toBe(10);
    expect(new Set(validCatalogue.map((asset) => asset.sku)).size).toBe(10);
  });

  it('rejects duplicate asset IDs', () => {
    const duplicateAssetIds = [...validCatalogue];
    duplicateAssetIds[1] = { ...duplicateAssetIds[1], assetId: duplicateAssetIds[0].assetId };

    expect(furnitureCatalogueSchema.safeParse(duplicateAssetIds).success).toBe(false);
  });

  it('rejects duplicate SKUs', () => {
    const duplicateSkus = [...validCatalogue];
    duplicateSkus[1] = { ...duplicateSkus[1], sku: duplicateSkus[0].sku };

    expect(furnitureCatalogueSchema.safeParse(duplicateSkus).success).toBe(false);
  });

  it('rejects catalogue sizes other than exactly ten products', () => {
    expect(furnitureCatalogueSchema.safeParse(validCatalogue.slice(0, 9)).success).toBe(false);

    const oversizedCatalogue = [...validCatalogue, { ...validCatalogue[0], assetId: 'extra-item' }];
    expect(furnitureCatalogueSchema.safeParse(oversizedCatalogue).success).toBe(false);
  });

  it('returns the seeded catalogue and supports lookup and filtering helpers', () => {
    expect(getFurnitureCatalogue()).toEqual(furnitureCatalogue);
    expect(findFurnitureAssetById('sofa-luma-01')).toEqual(furnitureCatalogue[0]);
    expect(findFurnitureAssetById('missing-asset')).toBeUndefined();

    expect(filterFurnitureAssetsByCategory('Seating')).toEqual([
      furnitureCatalogue[0],
      furnitureCatalogue[1],
    ]);
    expect(filterFurnitureAssetsByCategory('Decor')).toEqual([furnitureCatalogue[9]]);
    expect(filterFurnitureAssetsByCategory('Missing')).toEqual([]);

    expect(getAvailableFurnitureCategories()).toEqual([
      'Seating',
      'Tables',
      'Storage',
      'Lighting',
      'Textiles',
      'Decor',
    ]);
  });

  it('returns defensive copies so callers cannot mutate the canonical catalogue', () => {
    const firstSnapshot = getFurnitureCatalogue();

    firstSnapshot[0].name = 'Tampered sofa';
    firstSnapshot[0].dimensions.widthMetres = 99;
    firstSnapshot[0].metadata = { fabric: 'tampered' };

    const secondSnapshot = getFurnitureCatalogue();

    expect(secondSnapshot[0].name).toBe('Luma three-seat sofa');
    expect(secondSnapshot[0].dimensions.widthMetres).toBe(2.1);
    expect(secondSnapshot[0].metadata).toEqual({ fabric: 'boucle' });
  });

  it('returns defensive copies from lookup and category helpers as well', () => {
    const found = findFurnitureAssetById('sofa-luma-01');
    expect(found).toBeDefined();

    if (!found) {
      return;
    }

    found.name = 'Changed by consumer';
    found.dimensions.heightMetres = 42;
    found.metadata = { fabric: 'changed' };

    expect(findFurnitureAssetById('sofa-luma-01')).toEqual(furnitureCatalogue[0]);

    const seating = filterFurnitureAssetsByCategory('Seating');
    seating[0].name = 'Changed category result';

    expect(filterFurnitureAssetsByCategory('Seating')[0]).toEqual(furnitureCatalogue[0]);
  });
});
