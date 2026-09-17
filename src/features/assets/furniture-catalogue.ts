import { z } from 'zod';

const nonEmptyTextSchema = z.string().trim().min(1);

const applicationRelativePathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\/(?!\/)(?:[^\s?#]+)(?:\?[^\s#]+)?(?:#[^\s]+)?$/, {
    message: 'must be an application-relative path',
  });

const furnitureDimensionsSchema = z
  .object({
    widthMetres: z.number().finite().positive(),
    heightMetres: z.number().finite().positive(),
    depthMetres: z.number().finite().positive(),
  })
  .strict();

const furnitureMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const furnitureAssetSchema = z
  .object({
    assetId: nonEmptyTextSchema,
    name: nonEmptyTextSchema,
    category: nonEmptyTextSchema,
    sku: nonEmptyTextSchema,
    description: nonEmptyTextSchema.optional(),
    priceAed: z.number().int().nonnegative(),
    thumbnailUrl: applicationRelativePathSchema,
    modelUrl: applicationRelativePathSchema,
    dimensions: furnitureDimensionsSchema,
    metadata: z.record(z.string(), furnitureMetadataValueSchema).optional(),
  })
  .strict();

export const furnitureCatalogueSchema = z
  .array(furnitureAssetSchema)
  .length(10, 'catalogue must contain exactly ten demo products')
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

export type FurnitureDimensions = z.infer<typeof furnitureDimensionsSchema>;
export type FurnitureAsset = z.infer<typeof furnitureAssetSchema>;
export type FurnitureCatalogue = z.infer<typeof furnitureCatalogueSchema>;

const seededFurnitureCatalogue = [
  {
    assetId: 'sofa-luma-01',
    name: 'Luma three-seat sofa',
    category: 'Seating',
    sku: 'LUMA-SOFA-001',
    description: 'A low-profile fabric sofa for the living-room hero shot.',
    priceAed: 3890,
    thumbnailUrl: '/assets/thumbnails/luma-sofa.png',
    modelUrl: '/assets/models/luma-sofa.glb',
    dimensions: {
      widthMetres: 2.1,
      heightMetres: 0.84,
      depthMetres: 0.92,
    },
    metadata: {
      isHeroItem: true,
      fabric: 'boucle',
    },
  },
  {
    assetId: 'armchair-luma-01',
    name: 'Luma accent chair',
    category: 'Seating',
    sku: 'LUMA-CHAIR-001',
    description: 'Compact lounge chair with a sculpted backrest.',
    priceAed: 1840,
    thumbnailUrl: '/assets/thumbnails/luma-chair.png',
    modelUrl: '/assets/models/luma-chair.glb',
    dimensions: {
      widthMetres: 0.82,
      heightMetres: 0.78,
      depthMetres: 0.79,
    },
  },
  {
    assetId: 'coffee-table-luma-01',
    name: 'Luma coffee table',
    category: 'Tables',
    sku: 'LUMA-TABLE-001',
    description: 'Rounded coffee table with a wood veneer top.',
    priceAed: 1220,
    thumbnailUrl: '/assets/thumbnails/luma-coffee-table.png',
    modelUrl: '/assets/models/luma-coffee-table.glb',
    dimensions: {
      widthMetres: 1.1,
      heightMetres: 0.38,
      depthMetres: 0.62,
    },
  },
  {
    assetId: 'side-table-luma-01',
    name: 'Luma side table',
    category: 'Tables',
    sku: 'LUMA-TABLE-002',
    description: 'Slim side table that fits beside the sofa.',
    priceAed: 760,
    thumbnailUrl: '/assets/thumbnails/luma-side-table.png',
    modelUrl: '/assets/models/luma-side-table.glb',
    dimensions: {
      widthMetres: 0.46,
      heightMetres: 0.54,
      depthMetres: 0.46,
    },
  },
  {
    assetId: 'console-luma-01',
    name: 'Luma console table',
    category: 'Storage',
    sku: 'LUMA-STORAGE-001',
    description: 'Tall console table with open shelving.',
    priceAed: 1690,
    thumbnailUrl: '/assets/thumbnails/luma-console.png',
    modelUrl: '/assets/models/luma-console.glb',
    dimensions: {
      widthMetres: 1.4,
      heightMetres: 0.82,
      depthMetres: 0.34,
    },
  },
  {
    assetId: 'media-unit-luma-01',
    name: 'Luma media unit',
    category: 'Storage',
    sku: 'LUMA-STORAGE-002',
    description: 'Low media unit with two enclosed drawers.',
    priceAed: 2450,
    thumbnailUrl: '/assets/thumbnails/luma-media-unit.png',
    modelUrl: '/assets/models/luma-media-unit.glb',
    dimensions: {
      widthMetres: 1.8,
      heightMetres: 0.5,
      depthMetres: 0.42,
    },
  },
  {
    assetId: 'lamp-luma-01',
    name: 'Luma floor lamp',
    category: 'Lighting',
    sku: 'LUMA-LIGHT-001',
    description: 'Warm standing lamp with a linen shade.',
    priceAed: 690,
    thumbnailUrl: '/assets/thumbnails/luma-floor-lamp.png',
    modelUrl: '/assets/models/luma-floor-lamp.glb',
    dimensions: {
      widthMetres: 0.38,
      heightMetres: 1.52,
      depthMetres: 0.38,
    },
  },
  {
    assetId: 'lamp-luma-02',
    name: 'Luma table lamp',
    category: 'Lighting',
    sku: 'LUMA-LIGHT-002',
    description: 'Small lamp for side tables and consoles.',
    priceAed: 420,
    thumbnailUrl: '/assets/thumbnails/luma-table-lamp.png',
    modelUrl: '/assets/models/luma-table-lamp.glb',
    dimensions: {
      widthMetres: 0.22,
      heightMetres: 0.44,
      depthMetres: 0.22,
    },
  },
  {
    assetId: 'rug-luma-01',
    name: 'Luma area rug',
    category: 'Textiles',
    sku: 'LUMA-TEXTILE-001',
    description: 'Neutral rug sized for the demo living room.',
    priceAed: 980,
    thumbnailUrl: '/assets/thumbnails/luma-rug.png',
    modelUrl: '/assets/models/luma-rug.glb',
    dimensions: {
      widthMetres: 2.4,
      heightMetres: 0.02,
      depthMetres: 1.8,
    },
  },
  {
    assetId: 'decor-luma-01',
    name: 'Luma ceramic vase',
    category: 'Decor',
    sku: 'LUMA-DECOR-001',
    description: 'Simple decorative object for shelf styling.',
    priceAed: 260,
    thumbnailUrl: '/assets/thumbnails/luma-vase.png',
    modelUrl: '/assets/models/luma-vase.glb',
    dimensions: {
      widthMetres: 0.18,
      heightMetres: 0.31,
      depthMetres: 0.18,
    },
  },
] as const;

export const furnitureCatalogue = furnitureCatalogueSchema.parse(seededFurnitureCatalogue);

export function getFurnitureCatalogue(): FurnitureCatalogue {
  return [...furnitureCatalogue];
}

export function findFurnitureAssetById(
  assetId: string,
  catalogue: FurnitureCatalogue = furnitureCatalogue,
): FurnitureAsset | undefined {
  return catalogue.find((asset) => asset.assetId === assetId);
}

export function filterFurnitureAssetsByCategory(
  category: string,
  catalogue: FurnitureCatalogue = furnitureCatalogue,
): FurnitureAsset[] {
  return catalogue.filter((asset) => asset.category === category);
}

export function getAvailableFurnitureCategories(
  catalogue: FurnitureCatalogue = furnitureCatalogue,
): string[] {
  return Array.from(new Set(catalogue.map((asset) => asset.category)));
}
