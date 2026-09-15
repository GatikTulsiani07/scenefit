import { describe, expect, it } from 'vitest';

import {
  MAX_PLACED_ASSETS,
  MAX_SCENE_COORDINATE_METRES,
  sceneDataV1Schema,
  type SceneDataV1,
} from './scene-data';

const validScene: SceneDataV1 = {
  version: 1,
  roomId: 'living-room-v1',
  placedAssets: [
    {
      instanceId: 'sofa-1',
      assetId: 'sofa',
      position: [1.25, 0, -2.5],
      rotation: [0, Math.PI / 2, 0],
    },
  ],
  camera: {
    position: [4, 3, 5],
    target: [0, 0, 0],
  },
};

describe('SceneDataV1 schema', () => {
  it('accepts a version 1 scene with optional camera data', () => {
    expect(sceneDataV1Schema.parse(validScene)).toEqual(validScene);
    expect(sceneDataV1Schema.parse({ ...validScene, camera: undefined })).toEqual({
      version: 1,
      roomId: 'living-room-v1',
      placedAssets: validScene.placedAssets,
    });
  });

  it('rejects unsupported and missing scene versions', () => {
    expect(sceneDataV1Schema.safeParse({ ...validScene, version: 2 }).success).toBe(false);
    expect(sceneDataV1Schema.safeParse({ ...validScene, version: undefined }).success).toBe(false);
  });

  it('rejects empty identifiers', () => {
    for (const scene of [
      { ...validScene, roomId: ' ' },
      {
        ...validScene,
        placedAssets: [{ ...validScene.placedAssets[0], instanceId: '' }],
      },
      {
        ...validScene,
        placedAssets: [{ ...validScene.placedAssets[0], assetId: ' ' }],
      },
    ]) {
      expect(sceneDataV1Schema.safeParse(scene).success).toBe(false);
    }
  });

  it('rejects positions and rotations that are not exact finite three-number tuples', () => {
    for (const placedAsset of [
      { ...validScene.placedAssets[0], position: [0, 0] },
      { ...validScene.placedAssets[0], position: [0, 0, 0, 0] },
      { ...validScene.placedAssets[0], position: [0, Infinity, 0] },
      { ...validScene.placedAssets[0], rotation: [0, 0] },
      { ...validScene.placedAssets[0], rotation: [0, 0, 0, 0] },
      { ...validScene.placedAssets[0], rotation: [0, Number.NaN, 0] },
      { ...validScene.placedAssets[0], rotation: [0, 0, Number.NEGATIVE_INFINITY] },
    ]) {
      expect(
        sceneDataV1Schema.safeParse({ ...validScene, placedAssets: [placedAsset] }).success,
      ).toBe(false);
    }
  });

  it('rejects positions outside the scene bounds', () => {
    const scene = {
      ...validScene,
      placedAssets: [
        {
          ...validScene.placedAssets[0],
          position: [MAX_SCENE_COORDINATE_METRES + 1, 0, 0],
        },
      ],
    };

    expect(sceneDataV1Schema.safeParse(scene).success).toBe(false);
  });

  it('rejects incomplete and invalid camera vectors', () => {
    expect(
      sceneDataV1Schema.safeParse({
        ...validScene,
        camera: { position: [0, 0, 0] },
      }).success,
    ).toBe(false);
    expect(
      sceneDataV1Schema.safeParse({
        ...validScene,
        camera: { position: [0, 0, 0], target: [0, Infinity, 0] },
      }).success,
    ).toBe(false);
  });

  it('rejects scenes with more than the placed-asset limit', () => {
    const placedAssets = Array.from({ length: MAX_PLACED_ASSETS + 1 }, (_, index) => ({
      ...validScene.placedAssets[0],
      instanceId: `instance-${index}`,
    }));

    expect(sceneDataV1Schema.safeParse({ ...validScene, placedAssets }).success).toBe(false);
  });

  it('rejects duplicate placed-asset instance IDs', () => {
    expect(
      sceneDataV1Schema.safeParse({
        ...validScene,
        placedAssets: [
          validScene.placedAssets[0],
          { ...validScene.placedAssets[0], assetId: 'armchair' },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects fields outside the persisted scene contract', () => {
    expect(
      sceneDataV1Schema.safeParse({ ...validScene, selectedInstanceId: 'sofa-1' }).success,
    ).toBe(false);
  });
});
