import { z } from 'zod';

const nonEmptyTextSchema = z.string().trim().min(1);

const applicationRelativePathSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^\/(?!\/)[^\s?#]+$/, {
    message: 'must be an application-relative path',
  });

const monetaryAmountSchema = z.number().finite().nonnegative();

export const publicationStatusSchema = z.enum(['draft', 'published', 'archived']);

export const digitalAssetStatusSchema = z.enum([
  'no_asset',
  'queued',
  'processing',
  'needs_review',
  'ready',
  'failed',
]);

export const pricingSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('fixed'),
      amount: monetaryAmountSchema,
      currency: z.string().regex(/^[A-Z]{3}$/, {
        message: 'currency must be an ISO 4217-style uppercase three-letter code',
      }),
    })
    .strict(),
  z
    .object({
      type: z.literal('starting_from'),
      amount: monetaryAmountSchema,
      currency: z.string().regex(/^[A-Z]{3}$/, {
        message: 'currency must be an ISO 4217-style uppercase three-letter code',
      }),
    })
    .strict(),
  z.object({ type: z.literal('custom_quote') }).strict(),
  z.object({ type: z.literal('hidden') }).strict(),
]);

export const dimensionsSchema = z
  .object({
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
    depth: z.number().finite().positive(),
    unit: nonEmptyTextSchema,
  })
  .strict();

export const digitalAssetReferenceSchema = z
  .object({
    assetId: nonEmptyTextSchema.optional(),
    status: digitalAssetStatusSchema,
    thumbnailUrl: applicationRelativePathSchema.optional(),
    modelUrl: applicationRelativePathSchema.optional(),
  })
  .strict()
  .superRefine((asset, context) => {
    if (asset.status !== 'no_asset' && !asset.assetId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'assetId is required when an asset has entered its lifecycle',
        path: ['assetId'],
      });
    }
  });

export const catalogItemSchema = z
  .object({
    id: nonEmptyTextSchema,
    catalogId: nonEmptyTextSchema,
    name: nonEmptyTextSchema,
    description: nonEmptyTextSchema.optional(),
    category: nonEmptyTextSchema,
    sku: nonEmptyTextSchema.optional(),
    publicationStatus: publicationStatusSchema,
    pricing: pricingSchema,
    dimensions: dimensionsSchema.optional(),
    digitalAsset: digitalAssetReferenceSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const catalogSchema = z
  .object({
    id: nonEmptyTextSchema,
    name: nonEmptyTextSchema,
    items: z.array(catalogItemSchema),
  })
  .strict()
  .superRefine((catalog, context) => {
    const itemIds = new Set<string>();
    const skus = new Set<string>();

    for (const [index, item] of catalog.items.entries()) {
      if (item.catalogId !== catalog.id) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'catalog item catalogId must match the containing catalog',
          path: ['items', index, 'catalogId'],
        });
      }

      if (itemIds.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'catalog item IDs must be unique',
          path: ['items', index, 'id'],
        });
      }

      if (item.sku && skus.has(item.sku)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'catalog item SKUs must be unique when provided',
          path: ['items', index, 'sku'],
        });
      }

      itemIds.add(item.id);
      if (item.sku) {
        skus.add(item.sku);
      }
    }
  });

export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type DigitalAssetStatus = z.infer<typeof digitalAssetStatusSchema>;
export type Pricing = z.infer<typeof pricingSchema>;
export type Dimensions = z.infer<typeof dimensionsSchema>;
export type DigitalAssetReference = z.infer<typeof digitalAssetReferenceSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
