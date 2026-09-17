import { describe, expect, it } from 'vitest';

import { createEditorStore } from './editor-store';
import { type PlacedAsset } from '@/lib/validation/scene-data';

const sampleCatalog = [
  { id: 'sofa', name: 'Sofa', category: 'seating' },
  { id: 'lamp', name: 'Floor lamp', category: 'lighting' },
];

const validScene: { version: 1; roomId: string; placedAssets: PlacedAsset[] } = {
  version: 1 as const,
  roomId: 'living-room-v1',
  placedAssets: [
    {
      instanceId: 'instance-1',
      assetId: 'sofa',
      position: [1, 0, -2] as const,
      rotation: [0, Math.PI / 2, 0] as const,
    },
  ],
};

describe('editor store', () => {
  it('adds an asset, selects it, and marks the project dirty', () => {
    const store = createEditorStore({ generateInstanceId: () => 'instance-1', assets: sampleCatalog });

    const created = store.getState().addAsset('sofa');

    expect(created).toEqual({
      instanceId: 'instance-1',
      assetId: 'sofa',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    });
    expect(store.getState().placedAssets).toEqual([created]);
    expect(store.getState().selectedInstanceId).toBe('instance-1');
    expect(store.getState().isDirty).toBe(true);
    expect(store.getState().assets).toEqual(sampleCatalog);
  });

  it('adds different and repeated products with deterministic unique instance IDs', () => {
    const generatedIds = ['instance-sofa-1', 'instance-lamp-1', 'instance-sofa-2'];
    const store = createEditorStore({
      generateInstanceId: () => generatedIds.shift() ?? '',
      assets: sampleCatalog,
    });

    const firstSofa = store.getState().addAsset('sofa');
    const lamp = store.getState().addAsset('lamp');
    const secondSofa = store.getState().addAsset('sofa');

    expect(store.getState().placedAssets).toEqual([firstSofa, lamp, secondSofa]);
    expect(new Set(store.getState().placedAssets.map((asset) => asset.instanceId)).size).toBe(3);
    expect(store.getState().placedAssets.map((asset) => asset.assetId)).toEqual(['sofa', 'lamp', 'sofa']);
    expect(store.getState().selectedInstanceId).toBe('instance-sofa-2');
    expect(store.getState().isDirty).toBe(true);
  });

  it('uses a deterministic unused fallback ID when the generator repeats an existing ID', () => {
    const store = createEditorStore({ generateInstanceId: () => 'duplicate-id' });

    const first = store.getState().addAsset('sofa');
    const second = store.getState().addAsset('sofa');

    expect(first.instanceId).toBe('duplicate-id');
    expect(second.instanceId).toBe('instance-1');
    expect(second.position).toEqual([0, 0, 0]);
    expect(second.rotation).toEqual([0, 0, 0]);
  });

  it('selects an instance without mutating the scene', () => {
    const store = createEditorStore({ placedAssets: [validScene.placedAssets[0]] });

    store.getState().selectInstance('instance-1');

    expect(store.getState().selectedInstanceId).toBe('instance-1');
    expect(store.getState().placedAssets).toEqual(validScene.placedAssets);
    expect(store.getState().isDirty).toBe(false);
  });

  it('updates position on the floor plane only and marks the project dirty', () => {
    const store = createEditorStore({ placedAssets: [validScene.placedAssets[0]] });

    store.getState().updatePosition('instance-1', [4, 7, -6]);

    expect(store.getState().placedAssets[0].position).toEqual([4, 0, -6]);
    expect(store.getState().placedAssets[0].rotation).toEqual([0, Math.PI / 2, 0]);
    expect(store.getState().isDirty).toBe(true);
  });

  it('updates rotation around the vertical axis only and keeps scale unavailable', () => {
    const store = createEditorStore({ placedAssets: [validScene.placedAssets[0]] });

    store.getState().updateRotation('instance-1', [Math.PI / 4, Math.PI, -Math.PI / 6]);

    expect(store.getState().placedAssets[0].rotation).toEqual([
      0,
      Math.PI,
      0,
    ]);
    expect(store.getState().placedAssets[0]).not.toHaveProperty('scale');
    expect(store.getState().isDirty).toBe(true);
  });

  it('deletes an instance and clears selection when the selected item is removed', () => {
    const store = createEditorStore({
      placedAssets: [
        validScene.placedAssets[0],
        { ...validScene.placedAssets[0], instanceId: 'instance-2', assetId: 'lamp' },
      ],
      selectedInstanceId: 'instance-2',
    });

    store.getState().deleteInstance('instance-2');

    expect(store.getState().placedAssets).toEqual([validScene.placedAssets[0]]);
    expect(store.getState().selectedInstanceId).toBeNull();
    expect(store.getState().isDirty).toBe(true);
  });

  it('clears the scene while preserving project metadata and marking the state dirty', () => {
    const store = createEditorStore({
      projectId: 'project-1',
      projectName: 'Demo room',
      roomId: 'living-room-v1',
      placedAssets: [validScene.placedAssets[0]],
      selectedInstanceId: 'instance-1',
    });

    store.getState().clearScene();

    expect(store.getState().projectId).toBe('project-1');
    expect(store.getState().projectName).toBe('Demo room');
    expect(store.getState().roomId).toBe('living-room-v1');
    expect(store.getState().placedAssets).toEqual([]);
    expect(store.getState().selectedInstanceId).toBeNull();
    expect(store.getState().isDirty).toBe(true);
  });

  it('hydrates a valid scene without corrupting the existing state', () => {
    const store = createEditorStore({
      projectId: 'project-1',
      projectName: 'Draft design',
      roomId: 'placeholder-room',
      placedAssets: [{ ...validScene.placedAssets[0], instanceId: 'draft-instance' }],
      selectedInstanceId: 'draft-instance',
      isDirty: true,
    });

    const hydrated = store.getState().hydrateScene(validScene);

    expect(hydrated).toBe(true);
    expect(store.getState().projectId).toBe('project-1');
    expect(store.getState().projectName).toBe('Draft design');
    expect(store.getState().roomId).toBe('living-room-v1');
    expect(store.getState().placedAssets).toEqual(validScene.placedAssets);
    expect(store.getState().selectedInstanceId).toBeNull();
    expect(store.getState().isDirty).toBe(false);
    expect(store.getState().saveStatus).toBe('saved');
    expect(store.getState().assetLoadingStatus).toBe('ready');
    expect(store.getState().editorError).toBeNull();
  });

  it('rejects invalid hydration without changing the scene', () => {
    const store = createEditorStore({
      roomId: 'placeholder-room',
      placedAssets: [{ ...validScene.placedAssets[0], instanceId: 'draft-instance' }],
      selectedInstanceId: 'draft-instance',
      isDirty: true,
    });

    const hydrated = store.getState().hydrateScene({
      ...validScene,
      roomId: ' ',
    });

    expect(hydrated).toBe(false);
    expect(store.getState().roomId).toBe('placeholder-room');
    expect(store.getState().placedAssets).toEqual([
      { ...validScene.placedAssets[0], instanceId: 'draft-instance' },
    ]);
    expect(store.getState().selectedInstanceId).toBe('draft-instance');
    expect(store.getState().isDirty).toBe(true);
    expect(store.getState().editorError).toEqual({
      code: 'validation_failed',
      message: 'Scene data could not be loaded.',
    });
  });

  it('marks the project as saved and clears the dirty state', () => {
    const store = createEditorStore({ isDirty: true, saveStatus: 'error' });

    store.getState().markSaved();

    expect(store.getState().isDirty).toBe(false);
    expect(store.getState().saveStatus).toBe('saved');
    expect(store.getState().editorError).toBeNull();
  });
});
