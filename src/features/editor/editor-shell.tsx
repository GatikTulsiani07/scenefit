'use client';

import React from 'react';
import {
  ChevronDown,
  Layers3,
  LoaderCircle,
  RotateCcw,
  Save,
  Share2,
  SquareMousePointer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SeededFurnitureCataloguePanel } from '@/features/assets/furniture-catalogue-panel';
import {
  findFurnitureAssetById,
  getFurnitureCatalogue,
} from '@/features/assets/furniture-catalogue';
import { siteName } from '@/lib/site';
import { createEditorStore, type EditorStoreState } from '@/stores/editor-store';
import type { PlacedAsset } from '@/lib/validation/scene-data';

type EditorShellMode = 'ready' | 'loading' | 'error';

export type EditorShellProps = {
  mode?: EditorShellMode;
  errorMessage?: string;
  retryLabel?: string;
  editorStore?: ReturnType<typeof createEditorStore>;
};

const panelLabelClasses = 'text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70';

function SectionCard({
  title,
  eyebrow,
  description,
  children,
}: Readonly<{
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-xl shadow-slate-950/30 backdrop-blur">
      <div className="mb-4 space-y-2">
        <p className={panelLabelClasses}>{eyebrow}</p>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptySceneState() {
  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl border border-dashed border-sky-400/25 bg-slate-900/70 px-6 py-10 text-center">
      <div className="mb-4 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 p-3 text-sky-200">
        <Layers3 className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-white">empty scene</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        no furniture has been placed yet. add a placeholder product from the catalogue to begin
        composing the room.
      </p>
    </div>
  );
}

function NoSelectionState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-5">
      <p className="text-sm font-semibold text-white">no object selected</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        the canvas is empty, so the inspector is waiting for a placed object to be selected.
      </p>
    </div>
  );
}

function formatVector(vector: PlacedAsset['position']) {
  return `(${vector.map((value) => value.toFixed(2)).join(', ')})`;
}

function SceneSummary({
  placedAssets,
  selectedInstanceId,
  onSelectInstance,
}: Readonly<{
  placedAssets: ReadonlyArray<PlacedAsset>;
  selectedInstanceId: string | null;
  onSelectInstance: (instanceId: string) => void;
}>) {
  return (
    <div className="rounded-2xl border border-sky-400/25 bg-slate-900/70 p-5" aria-live="polite">
      <h3 className="text-base font-semibold text-white">
        {placedAssets.length} {placedAssets.length === 1 ? 'item' : 'items'} in the scene
      </h3>
      <ul className="mt-4 space-y-3">
        {placedAssets.map((placedAsset) => {
          const asset = findFurnitureAssetById(placedAsset.assetId);
          const isSelected = placedAsset.instanceId === selectedInstanceId;

          return (
            <li
              key={placedAsset.instanceId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{asset?.name ?? 'Unknown product'}</p>
                <p className="mt-1 break-all text-xs text-slate-400">Instance: {placedAsset.instanceId}</p>
                {isSelected ? <p className="mt-1 text-xs font-semibold text-sky-200">Selected</p> : null}
              </div>
              <Button
                type="button"
                variant={isSelected ? 'secondary' : 'outline'}
                size="sm"
                aria-pressed={isSelected}
                aria-label={`Select ${asset?.name ?? 'unknown product'} instance ${placedAsset.instanceId}`}
                onClick={() => onSelectInstance(placedAsset.instanceId)}
              >
                Select instance
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusCard({
  tone,
  title,
  description,
  actionLabel,
}: Readonly<{
  tone: 'loading' | 'error';
  title: string;
  description: string;
  actionLabel?: string;
}>) {
  return (
    <div
      className="flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-5"
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div className="flex items-center gap-3">
        {tone === 'loading' ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-300" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 rotate-180 text-amber-300" aria-hidden="true" />
        )}
        <div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
      {actionLabel ? (
        <Button type="button" variant="outline" size="sm" aria-label={actionLabel}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

function CanvasPanel({
  mode,
  placedAssets,
  selectedInstanceId,
  onSelectInstance,
}: Readonly<{
  mode: EditorShellMode;
  placedAssets: ReadonlyArray<PlacedAsset>;
  selectedInstanceId: string | null;
  onSelectInstance: (instanceId: string) => void;
}>) {
  return (
    <SectionCard
      eyebrow="canvas"
      title="central 3d canvas"
      description="placeholder for the room view, with load states and a clear empty-scene prompt."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <SquareMousePointer className="h-4 w-4 text-sky-300" aria-hidden="true" />
            <span>orbit, pan, and zoom controls for the desktop editor</span>
          </div>
          <Button type="button" variant="outline" size="sm">
            reset camera
          </Button>
        </div>

        {mode === 'loading' ? (
          <StatusCard
            tone="loading"
            title="loading room preview"
            description="the canvas placeholder is waiting for the room model and products to load."
          />
        ) : mode === 'error' ? (
          <StatusCard
            tone="error"
            title="room preview unavailable"
            description="the 3d canvas could not be prepared. retry after the room model is available."
            actionLabel="retry canvas"
          />
        ) : placedAssets.length === 0 ? (
          <EmptySceneState />
        ) : (
          <SceneSummary
            placedAssets={placedAssets}
            selectedInstanceId={selectedInstanceId}
            onSelectInstance={onSelectInstance}
          />
        )}
      </div>
    </SectionCard>
  );
}

function InspectorPanel({
  mode,
  selectedInstanceId,
  placedAssets,
}: Readonly<{
  mode: EditorShellMode;
  selectedInstanceId: string | null;
  placedAssets: ReadonlyArray<PlacedAsset>;
}>) {
  const selectedAsset = selectedInstanceId
    ? placedAssets.find((placedAsset) => placedAsset.instanceId === selectedInstanceId)
    : undefined;
  const product = selectedAsset ? findFurnitureAssetById(selectedAsset.assetId) : undefined;

  return (
    <SectionCard
      eyebrow="inspector"
      title="right selected-object inspector"
      description="placeholder controls for selection details, movement, rotation, and deletion."
    >
      {mode === 'loading' ? (
        <StatusCard
          tone="loading"
          title="loading selection"
          description="selection controls will appear once the scene is ready."
        />
      ) : mode === 'error' ? (
        <StatusCard
          tone="error"
          title="inspector unavailable"
          description="the selected-object panel needs a retry before it can render."
          actionLabel="retry inspector"
        />
      ) : (
        <div className="space-y-4">
          {!selectedAsset || !product ? (
            <NoSelectionState />
          ) : (
            <div className="rounded-2xl border border-sky-300/50 bg-sky-400/10 p-5" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Selected instance</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{product.name}</h3>
              <dl className="mt-4 space-y-3 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</dt>
                  <dd className="mt-1">{product.category}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</dt>
                  <dd className="mt-1">AED {new Intl.NumberFormat('en-AE').format(product.priceAed)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Dimensions</dt>
                  <dd className="mt-1">W {product.dimensions.widthMetres.toFixed(2)} m × H {product.dimensions.heightMetres.toFixed(2)} m × D {product.dimensions.depthMetres.toFixed(2)} m</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Instance ID</dt>
                  <dd className="mt-1 break-all">{selectedAsset.instanceId}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Position</dt>
                  <dd className="mt-1">{formatVector(selectedAsset.position)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-400">Y-axis rotation</dt>
                  <dd className="mt-1">{selectedAsset.rotation[1].toFixed(2)} rad</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function MobilePanelToggle({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <details className="group rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-xl shadow-slate-950/30 backdrop-blur lg:hidden">
      <summary className="cursor-pointer list-none rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={panelLabelClasses}>mobile panel</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-open:rotate-180" aria-hidden="true" />
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function EditorShell({
  mode = 'ready',
  errorMessage = 'the editor shell hit a recoverable error while loading placeholder data.',
  retryLabel = 'retry load',
  editorStore,
}: EditorShellProps) {
  const showLoading = mode === 'loading';
  const showError = mode === 'error';
  const catalogueState = mode === 'loading' ? 'loading' : mode === 'error' ? 'error' : 'success';
  const catalogue = getFurnitureCatalogue();
  const storeRef = React.useRef<ReturnType<typeof createEditorStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = editorStore ?? createEditorStore({
      roomId: 'living-room-v1',
      assets: catalogue.map((asset) => ({ id: asset.assetId, name: asset.name, category: asset.category })),
    });
  }

  const store = storeRef.current as ReturnType<typeof createEditorStore>;
  const editorState = React.useSyncExternalStore<EditorStoreState>(
    store.subscribe,
    store.getState,
    store.getState,
  );
  const addAsset = (assetId: string) => store.getState().addAsset(assetId);
  const selectInstance = (instanceId: string) => store.getState().selectInstance(instanceId);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/70">editor</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{siteName}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline">
              <Save className="h-4 w-4" aria-hidden="true" />
              save
            </Button>
            <Button type="button">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              share
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        {showLoading ? (
          <StatusCard
            tone="loading"
            title="loading editor shell"
            description="the catalogue, canvas, and inspector are preparing their placeholder content."
          />
        ) : null}

        {showError ? (
          <div className="mb-4">
            <StatusCard tone="error" title="editor shell error" description={errorMessage} actionLabel={retryLabel} />
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)_minmax(16rem,22rem)]">
          <div className="hidden lg:block">
            <SeededFurnitureCataloguePanel state={catalogueState} catalogue={catalogue} onAddToRoom={addAsset} />
          </div>
          <div className="hidden lg:block">
            <CanvasPanel mode={mode} placedAssets={editorState.placedAssets} selectedInstanceId={editorState.selectedInstanceId} onSelectInstance={selectInstance} />
          </div>
          <div className="hidden lg:block">
            <InspectorPanel mode={mode} selectedInstanceId={editorState.selectedInstanceId} placedAssets={editorState.placedAssets} />
          </div>

          <div className="space-y-4 lg:hidden">
            <MobilePanelToggle
              title="catalogue panel"
              description="browse products and filter by category."
            >
              <SeededFurnitureCataloguePanel state={catalogueState} catalogue={catalogue} onAddToRoom={addAsset} />
            </MobilePanelToggle>
            <MobilePanelToggle
              title="3d canvas"
              description="view the room placeholder and current selection state."
            >
              <CanvasPanel mode={mode} placedAssets={editorState.placedAssets} selectedInstanceId={editorState.selectedInstanceId} onSelectInstance={selectInstance} />
            </MobilePanelToggle>
            <MobilePanelToggle
              title="selected-object inspector"
              description="see object details and quick actions on mobile."
            >
              <InspectorPanel mode={mode} selectedInstanceId={editorState.selectedInstanceId} placedAssets={editorState.placedAssets} />
            </MobilePanelToggle>
          </div>
        </div>
      </div>
    </main>
  );
}
