import React from 'react';
import {
  ChevronDown,
  Layers3,
  LoaderCircle,
  PanelRight,
  RotateCcw,
  Save,
  Share2,
  SquareMousePointer,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { siteName } from '@/lib/site';

type EditorShellMode = 'ready' | 'loading' | 'error';

export type EditorShellProps = {
  mode?: EditorShellMode;
  errorMessage?: string;
  retryLabel?: string;
};

type CatalogueItem = {
  name: string;
  category: string;
  price: string;
  dimensions: string;
};

const catalogueItems: CatalogueItem[] = [
  {
    name: 'Placeholder sofa',
    category: 'Seating',
    price: 'AED 3,800',
    dimensions: '2.1 × 0.9 × 0.8 m',
  },
  {
    name: 'Placeholder floor lamp',
    category: 'Lighting',
    price: 'AED 950',
    dimensions: '0.4 × 0.4 × 1.5 m',
  },
  {
    name: 'Placeholder side table',
    category: 'Tables',
    price: 'AED 1,200',
    dimensions: '0.6 × 0.6 × 0.5 m',
  },
];

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

function CataloguePanel({ mode }: Readonly<{ mode: EditorShellMode }>) {
  return (
    <SectionCard
      eyebrow="catalogue"
      title="left catalogue panel"
      description="placeholder controls for browsing products, filtering by category, and adding items into the room."
    >
      {mode === 'loading' ? (
        <StatusCard
          tone="loading"
          title="loading catalogue"
          description="catalogue items will appear here once the product list is ready."
        />
      ) : mode === 'error' ? (
        <StatusCard
          tone="error"
          title="catalogue failed to load"
          description="the catalogue could not be loaded. retry to restore the product list."
          actionLabel="retry catalogue"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="catalogue filters">
            {['All', 'Seating', 'Lighting', 'Tables'].map((filter) => (
              <span
                key={filter}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
              >
                {filter}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {catalogueItems.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-white/10 bg-slate-900/90 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-12 w-12 shrink-0 rounded-xl border border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-sky-200">{item.price}</p>
                </div>
                <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">dimensions</dt>
                    <dd className="mt-1">{item.dimensions}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">action</dt>
                    <dd className="mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-0"
                        aria-label={`Add ${item.name} to room`}
                      >
                        add to room
                      </Button>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function CanvasPanel({ mode }: Readonly<{ mode: EditorShellMode }>) {
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
        ) : (
          <EmptySceneState />
        )}
      </div>
    </SectionCard>
  );
}

function InspectorPanel({ mode }: Readonly<{ mode: EditorShellMode }>) {
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
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">selected sofa</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                  seating · AED 3,800
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100">
                  selected
                </span>
                <PanelRight className="h-4 w-4 text-sky-300" aria-hidden="true" />
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">dimensions</dt>
                <dd className="mt-1">2.1 × 0.9 × 0.8 m</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.24em] text-slate-500">mode</dt>
                <dd className="mt-1">move / rotate</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm">
                <SquareMousePointer className="h-4 w-4" aria-hidden="true" />
                move
              </Button>
              <Button type="button" variant="secondary" size="sm">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                rotate
              </Button>
              <Button type="button" variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                delete
              </Button>
            </div>
          </div>
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
    <details className="group rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-xl shadow-slate-950/30 backdrop-blur md:hidden">
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
}: EditorShellProps) {
  const showLoading = mode === 'loading';
  const showError = mode === 'error';

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
          <div className="hidden md:block">
            <CataloguePanel mode={mode} />
          </div>
          <div className="hidden md:block">
            <CanvasPanel mode={mode} />
          </div>
          <div className="hidden md:block">
            <InspectorPanel mode={mode} />
          </div>

          <div className="space-y-4 md:hidden">
            <MobilePanelToggle
              title="catalogue panel"
              description="browse placeholder items and add them to the room."
            >
              <CataloguePanel mode={mode} />
            </MobilePanelToggle>
            <MobilePanelToggle
              title="3d canvas"
              description="view the room placeholder and current selection state."
            >
              <CanvasPanel mode={mode} />
            </MobilePanelToggle>
            <MobilePanelToggle
              title="selected-object inspector"
              description="see object details and quick actions on mobile."
            >
              <InspectorPanel mode={mode} />
            </MobilePanelToggle>
          </div>
        </div>
      </div>
    </main>
  );
}
