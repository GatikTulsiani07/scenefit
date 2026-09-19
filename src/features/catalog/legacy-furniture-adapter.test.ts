import { describe, expect, it } from 'vitest';

import { furnitureCatalogue } from '@/features/assets/furniture-catalogue';

import {
  adaptFurnitureAssetToCatalogItem,
  adaptFurnitureCatalogueToCatalogItems,
  adaptSeededFurnitureCatalogue,
  SEEDED_FURNITURE_CATALOG_ID,
} from './legacy-furniture-adapter';

describe('seeded furniture catalog adapter', () => {
  it('adapts all seeded furniture into a generic catalog without changing stable IDs', () => {
    const catalog = adaptSeededFurnitureCatalogue();

    expect(catalog.id).toBe(SEEDED_FURNITURE_CATALOG_ID);
    expect(catalog.items).toHaveLength(furnitureCatalogue.length);

    for (const [index, furnitureAsset] of furnitureCatalogue.entries()) {
      const item = catalog.items[index];

      expect(item).toMatchObject({
        id: furnitureAsset.assetId,
        catalogId: SEEDED_FURNITURE_CATALOG_ID,
        name: furnitureAsset.name,
        description: furnitureAsset.description,
        category: furnitureAsset.category,
        sku: furnitureAsset.sku,
        publicationStatus: 'published',
        pricing: { type: 'fixed', amount: furnitureAsset.priceAed, currency: 'AED' },
        dimensions: {
          width: furnitureAsset.dimensions.widthMetres,
          height: furnitureAsset.dimensions.heightMetres,
          depth: furnitureAsset.dimensions.depthMetres,
          unit: 'm',
        },
        digitalAsset: {
          status: 'no_asset',
          thumbnailUrl: furnitureAsset.thumbnailUrl,
          modelUrl: furnitureAsset.modelUrl,
        },
        metadata: furnitureAsset.metadata,
      });
    }
  });

  it('keeps optional descriptions and metadata optional while retaining supplied values', () => {
    const source = { ...furnitureCatalogue[0], description: undefined, metadata: undefined };
    const item = adaptFurnitureAssetToCatalogItem(source);

    expect(item.description).toBeUndefined();
    expect(item.metadata).toBeUndefined();
  });

  it('can adapt a compatible supplied legacy catalogue under another catalog ID', () => {
    const items = adaptFurnitureCatalogueToCatalogItems(furnitureCatalogue, 'catalog-for-business-a');

    expect(items).toHaveLength(10);
    expect(items.every((item) => item.catalogId === 'catalog-for-business-a')).toBe(true);
    expect(items.map((item) => item.id)).toEqual(furnitureCatalogue.map((asset) => asset.assetId));
  });

  it('adapts a supplied one-item legacy collection', () => {
    const items = adaptFurnitureCatalogueToCatalogItems([furnitureCatalogue[0]], 'single-item-catalog');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: furnitureCatalogue[0].assetId,
      catalogId: 'single-item-catalog',
    });
  });

  it('rejects supplied collections with duplicate asset IDs or SKUs', () => {
    const duplicateId = [
      furnitureCatalogue[0],
      { ...furnitureCatalogue[1], assetId: furnitureCatalogue[0].assetId },
    ];
    const duplicateSku = [
      furnitureCatalogue[0],
      { ...furnitureCatalogue[1], sku: furnitureCatalogue[0].sku },
    ];

    expect(() => adaptFurnitureCatalogueToCatalogItems(duplicateId)).toThrow();
    expect(() => adaptFurnitureCatalogueToCatalogItems(duplicateSku)).toThrow();
  });
});
