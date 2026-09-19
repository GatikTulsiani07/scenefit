import { z } from 'zod';

import {
  furnitureAssetSchema,
  furnitureCatalogue,
  type FurnitureAsset,
} from '@/features/assets/furniture-catalogue';

import {
  catalogItemSchema,
  catalogSchema,
  type Catalog,
  type CatalogItem,
} from './contracts';

export const SEEDED_FURNITURE_CATALOG_ID = 'seeded-furniture-catalog';

const suppliedFurnitureCollectionSchema = z
  .array(furnitureAssetSchema)
  .superRefine((catalogue, context) => {
    const assetIds = new Set<string>();
    const skus = new Set<string>();

    for (const [index, asset] of catalogue.entries()) {
      if (assetIds.has(asset.assetId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'asset IDs must be unique',
          path: [index, 'assetId'],
        });
      }

      if (skus.has(asset.sku)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'SKUs must be unique',
          path: [index, 'sku'],
        });
      }

      assetIds.add(asset.assetId);
      skus.add(asset.sku);
    }
  });

export function adaptFurnitureAssetToCatalogItem(
  asset: FurnitureAsset,
  catalogId: string = SEEDED_FURNITURE_CATALOG_ID,
): CatalogItem {
  return catalogItemSchema.parse({
    id: asset.assetId,
    catalogId,
    name: asset.name,
    description: asset.description,
    category: asset.category,
    sku: asset.sku,
    publicationStatus: 'published',
    pricing: {
      type: 'fixed',
      amount: asset.priceAed,
      currency: 'AED',
    },
    dimensions: {
      width: asset.dimensions.widthMetres,
      height: asset.dimensions.heightMetres,
      depth: asset.dimensions.depthMetres,
      unit: 'm',
    },
    // Seed paths are legacy metadata, not evidence of a downloadable or ready asset.
    digitalAsset: {
      status: 'no_asset',
      thumbnailUrl: asset.thumbnailUrl,
      modelUrl: asset.modelUrl,
    },
    metadata: asset.metadata,
  });
}

export function adaptFurnitureCatalogueToCatalogItems(
  catalogue: ReadonlyArray<FurnitureAsset> = furnitureCatalogue,
  catalogId: string = SEEDED_FURNITURE_CATALOG_ID,
): CatalogItem[] {
  const validatedCatalogue = suppliedFurnitureCollectionSchema.parse(catalogue);

  return validatedCatalogue.map((asset) => adaptFurnitureAssetToCatalogItem(asset, catalogId));
}

export function adaptSeededFurnitureCatalogue(): Catalog {
  return catalogSchema.parse({
    id: SEEDED_FURNITURE_CATALOG_ID,
    name: 'Seeded furniture catalogue',
    items: adaptFurnitureCatalogueToCatalogItems(),
  });
}
