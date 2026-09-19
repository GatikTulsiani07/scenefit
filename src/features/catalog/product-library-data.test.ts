import { describe, expect, it } from 'vitest';

import { adaptSeededFurnitureCatalogue } from './legacy-furniture-adapter';
import {
  defaultProductLibraryFilters,
  filterCatalogItems,
  formatCatalogPrice,
  getCatalogCategories,
  getCatalogItemDigitalAssetStatus,
} from './product-library-data';

describe('product library data helpers', () => {
  it('derives sorted categories from the adapted catalogue data', () => {
    const catalog = adaptSeededFurnitureCatalogue();

    expect(getCatalogCategories(catalog.items)).toEqual(['Decor', 'Lighting', 'Seating', 'Storage', 'Tables', 'Textiles']);
  });

  it('filters by search, category, publication status, and digital-asset status together', () => {
    const catalog = adaptSeededFurnitureCatalogue();
    const items = [
      {
        ...catalog.items[0],
        category: 'Display',
        sku: 'DISPLAY-READY-001',
        publicationStatus: 'published' as const,
        digitalAsset: { assetId: 'asset-ready', status: 'ready' as const },
      },
      {
        ...catalog.items[1],
        category: 'Display',
        sku: 'DISPLAY-DRAFT-002',
        publicationStatus: 'draft' as const,
        digitalAsset: { assetId: 'asset-draft', status: 'ready' as const },
      },
      {
        ...catalog.items[2],
        category: 'Display',
        sku: 'DISPLAY-PROCESSING-003',
        publicationStatus: 'published' as const,
        digitalAsset: { assetId: 'asset-processing', status: 'processing' as const },
      },
    ];

    expect(filterCatalogItems(items, {
      ...defaultProductLibraryFilters,
      search: 'ready-001',
      category: 'Display',
      publicationStatus: 'published',
      digitalAssetStatus: 'ready',
    })).toEqual([items[0]]);
  });

  it('searches name, SKU, and category without a furniture-specific assumption', () => {
    const catalog = adaptSeededFurnitureCatalogue();

    expect(filterCatalogItems(catalog.items, { ...defaultProductLibraryFilters, search: 'LUMA-SOFA-001' })).toEqual([catalog.items[0]]);
    expect(filterCatalogItems(catalog.items, { ...defaultProductLibraryFilters, search: 'lighting' })).toHaveLength(2);
    expect(getCatalogItemDigitalAssetStatus({ ...catalog.items[0], digitalAsset: undefined })).toBe('no_asset');
  });

  it('formats every generic pricing type using its configured currency where applicable', () => {
    expect(formatCatalogPrice({ type: 'fixed', amount: 25.5, currency: 'EUR' })).toBe('€25.50');
    expect(formatCatalogPrice({ type: 'starting_from', amount: 1000, currency: 'USD' })).toBe('From $1,000.00');
    expect(formatCatalogPrice({ type: 'custom_quote' })).toBe('Custom quote');
    expect(formatCatalogPrice({ type: 'hidden' })).toBe('Price on request');
  });
});
