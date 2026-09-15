import { z } from 'zod';

export const SCENE_DATA_V1_VERSION = 1;
export const MAX_PLACED_ASSETS = 100;
export const MAX_SCENE_COORDINATE_METRES = 100;

const nonEmptyIdentifierSchema = z.string().trim().min(1);

const sceneCoordinateSchema = z
  .number()
  .finite()
  .min(-MAX_SCENE_COORDINATE_METRES)
  .max(MAX_SCENE_COORDINATE_METRES);

const finiteNumberSchema = z.number().finite();

export const vector3Schema = z.tuple([
  finiteNumberSchema,
  finiteNumberSchema,
  finiteNumberSchema,
]);

const scenePositionSchema = z.tuple([
  sceneCoordinateSchema,
  sceneCoordinateSchema,
  sceneCoordinateSchema,
]);

export const placedAssetSchema = z
  .object({
    instanceId: nonEmptyIdentifierSchema,
    assetId: nonEmptyIdentifierSchema,
    position: scenePositionSchema,
    rotation: vector3Schema,
  })
  .strict();

export const cameraSchema = z
  .object({
    position: scenePositionSchema,
    target: scenePositionSchema,
  })
  .strict();

export const sceneDataV1Schema = z
  .object({
    version: z.literal(SCENE_DATA_V1_VERSION),
    roomId: nonEmptyIdentifierSchema,
    placedAssets: z
      .array(placedAssetSchema)
      .max(MAX_PLACED_ASSETS)
      .superRefine((placedAssets, context) => {
        const instanceIds = new Set<string>();

        for (const [index, placedAsset] of placedAssets.entries()) {
          if (instanceIds.has(placedAsset.instanceId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Placed asset instance IDs must be unique',
              path: [index, 'instanceId'],
            });
          }

          instanceIds.add(placedAsset.instanceId);
        }
      }),
    camera: cameraSchema.optional(),
  })
  .strict();

export type Vector3 = z.infer<typeof vector3Schema>;
export type PlacedAsset = z.infer<typeof placedAssetSchema>;
export type SceneCamera = z.infer<typeof cameraSchema>;
export type SceneDataV1 = z.infer<typeof sceneDataV1Schema>;
