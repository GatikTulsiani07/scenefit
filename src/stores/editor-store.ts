import { createStore } from 'zustand/vanilla';

import {
  prepareSceneHydration,
  serializeSceneData,
  type SceneHydrationResult,
  type SceneSerializationResult,
} from '@/features/editor/scene-serialization';
import {
  type PlacedAsset,
  type Vector3,
} from '@/lib/validation/scene-data';

export type EditorInteractionMode = 'select' | 'place' | 'move' | 'rotate';
export type EditorSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type EditorAssetLoadingStatus = 'idle' | 'loading' | 'ready' | 'error';

export type EditorAssetCatalogItem = {
  id: string;
  name: string;
  category?: string;
};

export type EditorErrorState = {
  code: 'validation_failed' | 'unknown';
  message: string;
} | null;

export type EditorStoreState = {
  projectId: string;
  projectName: string;
  roomId: string;
  assets: EditorAssetCatalogItem[];
  placedAssets: PlacedAsset[];
  selectedInstanceId: string | null;
  interactionMode: EditorInteractionMode;
  isDirty: boolean;
  saveStatus: EditorSaveStatus;
  assetLoadingStatus: EditorAssetLoadingStatus;
  editorError: EditorErrorState;
  addAsset: (assetId: string, options?: EditorPlacementOptions) => PlacedAsset;
  selectInstance: (instanceId: string | null) => void;
  updatePosition: (instanceId: string, position: Vector3) => void;
  updateRotation: (instanceId: string, rotation: Vector3) => void;
  deleteInstance: (instanceId: string) => void;
  clearScene: () => void;
  serializeScene: () => SceneSerializationResult;
  hydrateScene: (scene: unknown) => SceneHydrationResult;
  markSaved: () => void;
};

type EditorPlacementOptions = {
  instanceId?: string;
  position?: Vector3;
  rotation?: Vector3;
};

type CreateEditorStoreOptions = {
  projectId?: string;
  projectName?: string;
  roomId?: string;
  assets?: EditorAssetCatalogItem[];
  placedAssets?: PlacedAsset[];
  selectedInstanceId?: string | null;
  interactionMode?: EditorInteractionMode;
  isDirty?: boolean;
  saveStatus?: EditorSaveStatus;
  assetLoadingStatus?: EditorAssetLoadingStatus;
  editorError?: EditorErrorState;
  generateInstanceId?: () => string;
};

const defaultPosition: Vector3 = [0, 0, 0];
const defaultRotation: Vector3 = [0, 0, 0];

function createInstanceId(generateInstanceId: () => string, placedAssets: ReadonlyArray<PlacedAsset>) {
  const candidate = generateInstanceId().trim();
  const existingInstanceIds = new Set(placedAssets.map((placedAsset) => placedAsset.instanceId));

  if (candidate.length > 0 && !existingInstanceIds.has(candidate)) {
    return candidate;
  }

  let suffix = 1;
  while (existingInstanceIds.has(`instance-${suffix}`)) {
    suffix += 1;
  }

  return `instance-${suffix}`;
}

function mergePosition(previous: Vector3, position: Vector3): Vector3 {
  return [position[0], previous[1], position[2]];
}

function mergeRotation(previous: Vector3, rotation: Vector3): Vector3 {
  return [previous[0], rotation[1], previous[2]];
}

function initialState(options: CreateEditorStoreOptions) {
  return {
    projectId: options.projectId ?? '',
    projectName: options.projectName ?? '',
    roomId: options.roomId ?? '',
    assets: options.assets ?? [],
    placedAssets: options.placedAssets ?? [],
    selectedInstanceId: options.selectedInstanceId ?? null,
    interactionMode: options.interactionMode ?? 'select',
    isDirty: options.isDirty ?? false,
    saveStatus: options.saveStatus ?? 'idle',
    assetLoadingStatus: options.assetLoadingStatus ?? 'idle',
    editorError: options.editorError ?? null,
  };
}

export function createEditorStore(options: CreateEditorStoreOptions = {}) {
  const generateInstanceId =
    options.generateInstanceId ??
    (() =>
      globalThis.crypto?.randomUUID?.() ??
      `instance-${Math.random().toString(36).slice(2, 10)}`);

  return createStore<EditorStoreState>((set, get) => ({
    ...initialState(options),
    addAsset: (assetId, placementOptions = {}) => {
      let createdAsset: PlacedAsset | undefined;

      set((state) => {
        const placedAsset: PlacedAsset = {
          instanceId:
            placementOptions.instanceId ?? createInstanceId(generateInstanceId, state.placedAssets),
          assetId,
          position: placementOptions.position ?? defaultPosition,
          rotation: placementOptions.rotation ?? defaultRotation,
        };

        createdAsset = placedAsset;

        return {
          placedAssets: [...state.placedAssets, placedAsset],
          selectedInstanceId: placedAsset.instanceId,
          interactionMode: 'select',
          isDirty: true,
          editorError: null,
        };
      });

      return createdAsset as PlacedAsset;
    },
    selectInstance: (instanceId) => {
      set({ selectedInstanceId: instanceId });
    },
    updatePosition: (instanceId, position) => {
      set((state) => {
        const nextPlacedAssets = state.placedAssets.map((placedAsset) =>
          placedAsset.instanceId === instanceId
            ? { ...placedAsset, position: mergePosition(placedAsset.position, position) }
            : placedAsset,
        );

        if (nextPlacedAssets === state.placedAssets) {
          return state;
        }

        return {
          placedAssets: nextPlacedAssets,
          isDirty: true,
        };
      });
    },
    updateRotation: (instanceId, rotation) => {
      set((state) => {
        const nextPlacedAssets = state.placedAssets.map((placedAsset) =>
          placedAsset.instanceId === instanceId
            ? { ...placedAsset, rotation: mergeRotation(placedAsset.rotation, rotation) }
            : placedAsset,
        );

        if (nextPlacedAssets === state.placedAssets) {
          return state;
        }

        return {
          placedAssets: nextPlacedAssets,
          isDirty: true,
        };
      });
    },
    deleteInstance: (instanceId) => {
      set((state) => {
        const nextPlacedAssets = state.placedAssets.filter(
          (placedAsset) => placedAsset.instanceId !== instanceId,
        );

        if (nextPlacedAssets.length === state.placedAssets.length) {
          return state;
        }

        return {
          placedAssets: nextPlacedAssets,
          selectedInstanceId:
            state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
          isDirty: true,
        };
      });
    },
    clearScene: () => {
      set({
        placedAssets: [],
        selectedInstanceId: null,
        isDirty: true,
        editorError: null,
      });
    },
    serializeScene: () => serializeSceneData({
      roomId: get().roomId,
      placedAssets: get().placedAssets,
    }),
    hydrateScene: (scene) => {
      const result = prepareSceneHydration(scene);

      if (!result.success) {
        return result;
      }

      set({
        roomId: result.data.roomId,
        placedAssets: result.data.placedAssets,
        selectedInstanceId: null,
        interactionMode: 'select',
        isDirty: false,
        saveStatus: 'saved',
        assetLoadingStatus: 'ready',
        editorError: null,
      });

      return result;
    },
    markSaved: () => {
      set({
        isDirty: false,
        saveStatus: 'saved',
        editorError: null,
      });
    },
  }));
}
