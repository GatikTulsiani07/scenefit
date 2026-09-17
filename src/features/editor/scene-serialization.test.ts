import { describe, expect, it } from 'vitest';

import { sceneDataV1Schema } from '@/lib/validation/scene-data';

import { prepareSceneHydration, serializeSceneData } from './scene-serialization';

const validScene = {
  version: 1 as const,
  roomId: 'living-room-v1',
  placedAssets: [
    {
      instanceId: 'sofa-instance-1',
      assetId: 'sofa-luma-01',
      position: [1, 0, -2] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
    },
    {
      instanceId: 'lamp-instance-1',
      assetId: 'lamp-luma-01',
      position: [-1, 0, 2] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
    },
  ],
};

describe('scene serialization', () => {
  it('serializes only SceneData V1 fields with stable IDs and asset ordering', () => {
    const editorState = {
      roomId: validScene.roomId,
      placedAssets: validScene.placedAssets,
      selectedInstanceId: 'lamp-instance-1',
      interactionMode: 'rotate',
      isDirty: true,
      saveStatus: 'saving',
      assetLoadingStatus: 'loading',
      editorError: { code: 'validation_failed' },
    };
    const result = serializeSceneData(editorState);

    expect(result).toEqual({ success: true, data: validScene });

    if (result.success) {
      expect(sceneDataV1Schema.parse(result.data)).toEqual(validScene);
      expect(result.data).not.toHaveProperty('selectedInstanceId');
      expect(result.data).not.toHaveProperty('interactionMode');
      expect(result.data).not.toHaveProperty('isDirty');
      expect(result.data).not.toHaveProperty('saveStatus');
      expect(result.data).not.toHaveProperty('assetLoadingStatus');
      expect(result.data).not.toHaveProperty('editorError');
    }
  });

  it('returns a stable validation error instead of serializing invalid transforms', () => {
    const result = serializeSceneData({
      roomId: validScene.roomId,
      placedAssets: [{ ...validScene.placedAssets[0], rotation: [0, Number.NaN, 0] }],
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: 'validation_failed', message: 'Scene data is invalid.' },
    });
  });
});

describe('scene hydration preparation', () => {
  it('accepts schema-valid scenes using known catalogue assets', () => {
    expect(prepareSceneHydration(validScene)).toEqual({ success: true, data: validScene });
  });

  it('returns unsupported_scene_version only for finite numeric unsupported versions', () => {
    expect(prepareSceneHydration({ ...validScene, version: 2 })).toMatchObject({
      success: false,
      error: { code: 'unsupported_scene_version', details: { supportedVersion: 1 } },
    });
  });

  it('returns validation_failed for missing, malformed, or non-finite versions', () => {
    for (const invalidScene of [
      { roomId: validScene.roomId, placedAssets: validScene.placedAssets },
      { ...validScene, version: '2' },
      { ...validScene, version: null },
      { ...validScene, version: {} },
      { ...validScene, version: [] },
      { ...validScene, version: Number.NaN },
      { ...validScene, version: Number.POSITIVE_INFINITY },
      { ...validScene, version: Number.NEGATIVE_INFINITY },
    ]) {
      expect(prepareSceneHydration(invalidScene)).toMatchObject({
        success: false,
        error: { code: 'validation_failed' },
      });
    }
  });

  it('returns asset_not_found for schema-valid unknown catalogue assets', () => {
    expect(
      prepareSceneHydration({
        ...validScene,
        placedAssets: [{ ...validScene.placedAssets[0], assetId: 'not-in-catalogue' }],
      }),
    ).toMatchObject({
      success: false,
      error: { code: 'asset_not_found', details: { assetIds: ['not-in-catalogue'] } },
    });
  });

  it('rejects invalid tuple shapes, non-finite transforms, and duplicate instance IDs', () => {
    for (const invalidScene of [
      { ...validScene, placedAssets: [{ ...validScene.placedAssets[0], position: [0, 0] }] },
      { ...validScene, placedAssets: [{ ...validScene.placedAssets[0], rotation: [0, Number.POSITIVE_INFINITY, 0] }] },
      { ...validScene, placedAssets: [validScene.placedAssets[0], validScene.placedAssets[0]] },
    ]) {
      expect(prepareSceneHydration(invalidScene)).toMatchObject({
        success: false,
        error: { code: 'validation_failed' },
      });
    }
  });
});
