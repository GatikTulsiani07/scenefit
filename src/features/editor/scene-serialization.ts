import { findFurnitureAssetById } from '@/features/assets/furniture-catalogue';
import {
  SCENE_DATA_V1_VERSION,
  sceneDataV1Schema,
  type PlacedAsset,
  type SceneDataV1,
} from '@/lib/validation/scene-data';

type SceneConversionErrorCode = 'asset_not_found' | 'unsupported_scene_version' | 'validation_failed';

export type SceneConversionError = {
  code: SceneConversionErrorCode;
  message: string;
  details: Record<string, unknown>;
};

export type SceneSerializationResult =
  | { success: true; data: SceneDataV1 }
  | { success: false; error: SceneConversionError };

export type SceneHydrationResult =
  | { success: true; data: SceneDataV1 }
  | { success: false; error: SceneConversionError };

export type PersistableEditorSceneState = {
  roomId: string;
  placedAssets: ReadonlyArray<PlacedAsset>;
};

function formatValidationError(error: { issues: Array<{ message: string; path: PropertyKey[] }> }) {
  return error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.join('.'),
  }));
}

function validationFailure(error: { issues: Array<{ message: string; path: PropertyKey[] }> }): SceneConversionError {
  return {
    code: 'validation_failed',
    message: 'Scene data is invalid.',
    details: { issues: formatValidationError(error) },
  };
}

function hasUnsupportedVersion(scene: unknown): boolean {
  if (typeof scene !== 'object' || scene === null || !('version' in scene)) {
    return false;
  }

  const version = (scene as { version?: unknown }).version;
  return typeof version === 'number' && Number.isFinite(version) && version !== SCENE_DATA_V1_VERSION;
}

export function serializeSceneData(
  state: PersistableEditorSceneState,
): SceneSerializationResult {
  const serializedScene = {
    version: SCENE_DATA_V1_VERSION,
    roomId: state.roomId,
    placedAssets: state.placedAssets.map((placedAsset) => ({
      instanceId: placedAsset.instanceId,
      assetId: placedAsset.assetId,
      position: placedAsset.position,
      rotation: placedAsset.rotation,
    })),
  };
  const parsedScene = sceneDataV1Schema.safeParse(serializedScene);

  if (!parsedScene.success) {
    return { success: false, error: validationFailure(parsedScene.error) };
  }

  return { success: true, data: parsedScene.data };
}

export function prepareSceneHydration(scene: unknown): SceneHydrationResult {
  const parsedScene = sceneDataV1Schema.safeParse(scene);

  if (!parsedScene.success) {
    if (hasUnsupportedVersion(scene)) {
      return {
        success: false,
        error: {
          code: 'unsupported_scene_version',
          message: `Scene version ${String((scene as { version: unknown }).version)} is not supported.`,
          details: { supportedVersion: SCENE_DATA_V1_VERSION },
        },
      };
    }

    return { success: false, error: validationFailure(parsedScene.error) };
  }

  const unknownAssetIds = parsedScene.data.placedAssets
    .filter((placedAsset) => !findFurnitureAssetById(placedAsset.assetId))
    .map((placedAsset) => placedAsset.assetId);

  if (unknownAssetIds.length > 0) {
    return {
      success: false,
      error: {
        code: 'asset_not_found',
        message: 'Scene data references furniture that is not in the catalogue.',
        details: { assetIds: unknownAssetIds },
      },
    };
  }

  return { success: true, data: parsedScene.data };
}
