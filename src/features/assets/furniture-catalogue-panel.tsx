'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';

import {
  filterFurnitureAssetsByCategory,
  getAvailableFurnitureCategories,
  type FurnitureAsset,
} from './furniture-catalogue';

type CatalogueState = 'loading' | 'error' | 'empty' | 'success';

export type FurnitureCataloguePanelProps = {
  state?: CatalogueState;
  catalogue?: ReadonlyArray<FurnitureAsset>;
  onRetry: () => void;
};

const panelLabelClasses = 'text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70';

export function formatAedPrice(priceAed: number): string {
  return `AED ${new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(priceAed)}`;
}

export function formatDimensions(dimensions: FurnitureAsset['dimensions']): string {
  const formatMetres = (value: number) => `${value.toFixed(2)} m`;

  return `W ${formatMetres(dimensions.widthMetres)} × H ${formatMetres(dimensions.heightMetres)} × D ${formatMetres(dimensions.depthMetres)}`;
}

export function getVisibleFurnitureProducts(
  category: string,
  catalogue: ReadonlyArray<FurnitureAsset>,
): FurnitureAsset[] {
  return category === 'All' ? [...catalogue] : filterFurnitureAssetsByCategory(category, catalogue);
}

export function getThumbnailPlaceholderLabel(assetName: string): string {
  return `Product thumbnail placeholder for ${assetName}`;
}

export function CatalogueRetryButton({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
      Retry catalogue
    </Button>
  );
}

function ProductThumbnail({ asset }: Readonly<{ asset: FurnitureAsset }>) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-800 px-2 text-center text-xs leading-4 text-slate-300"
      role="img"
      aria-label={getThumbnailPlaceholderLabel(asset.name)}
      data-thumbnail-url={asset.thumbnailUrl}
    >
      product image placeholder
    </div>
  );
}

function ProductCard({ asset }: Readonly<{ asset: FurnitureAsset }>) {
  const explanationId = `placement-unavailable-${asset.assetId}`;

  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
      <div className="flex items-start gap-3">
        <ProductThumbnail asset={asset} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {asset.category}
          </p>
          <p className="mt-2 text-sm font-semibold text-sky-200">{formatAedPrice(asset.priceAed)}</p>
        </div>
      </div>
      <dl className="mt-4 space-y-1 text-sm text-slate-300">
        <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">dimensions</dt>
        <dd>{formatDimensions(asset.dimensions)}</dd>
      </dl>
      <div className="mt-4">
        <Button type="button" variant="outline" size="sm" disabled aria-describedby={explanationId}>
          Add to room
        </Button>
        <p id={explanationId} className="mt-2 text-xs leading-5 text-slate-400">
          Placement is not available yet. It is coming in the next issue.
        </p>
      </div>
    </article>
  );
}

export function FurnitureCataloguePanel({
  state = 'success',
  catalogue = [],
  onRetry,
}: Readonly<FurnitureCataloguePanelProps>) {
  const [activeCategory, setActiveCategory] = React.useState('All');
  const categories = getAvailableFurnitureCategories(catalogue);
  const visibleProducts = getVisibleFurnitureProducts(activeCategory, catalogue);

  React.useEffect(() => {
    if (activeCategory !== 'All' && !categories.includes(activeCategory)) {
      setActiveCategory('All');
    }
  }, [activeCategory, categories]);

  return (
    <section
      className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-xl shadow-slate-950/30 backdrop-blur"
      aria-labelledby="catalogue-heading"
    >
      <div className="mb-4 space-y-2">
        <p className={panelLabelClasses}>catalogue</p>
        <div className="space-y-1">
          <h2 id="catalogue-heading" className="text-lg font-semibold text-white">
            Furniture catalogue
          </h2>
          <p className="text-sm leading-6 text-slate-400">
            Browse the available pieces for this room.
          </p>
        </div>
      </div>

      {state === 'loading' ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5" role="status" aria-live="polite">
          <h3 className="text-base font-semibold text-white">Loading catalogue</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">Products will appear here shortly.</p>
        </div>
      ) : null}

      {state === 'error' ? (
        <div className="rounded-2xl border border-amber-300/30 bg-slate-900/80 p-5" role="alert">
          <h3 className="text-base font-semibold text-white">Catalogue failed to load</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            The product list could not be loaded. Please try again.
          </p>
          <CatalogueRetryButton onRetry={onRetry} />
        </div>
      ) : null}

      {state === 'empty' ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/70 p-5" role="status">
          <h3 className="text-base font-semibold text-white">No catalogue products yet</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Products will be available here when the catalogue is ready.
          </p>
        </div>
      ) : null}

      {state === 'success' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Furniture category filters">
            {['All', ...categories].map((category) => {
              const isActive = activeCategory === category;

              return (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={isActive ? 'secondary' : 'outline'}
                  aria-pressed={isActive}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                  {isActive ? <span className="sr-only"> filter selected</span> : null}
                </Button>
              );
            })}
          </div>

          <p className="text-sm text-slate-300" role="status" aria-live="polite">
            {visibleProducts.length} {visibleProducts.length === 1 ? 'product' : 'products'} shown
            {activeCategory === 'All' ? '' : ` in ${activeCategory}`}
          </p>

          {visibleProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/70 p-5" role="status">
              <h3 className="text-base font-semibold text-white">No products in this category</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Choose another category to see available furniture.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleProducts.map((asset) => (
                <ProductCard key={asset.assetId} asset={asset} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function SeededFurnitureCataloguePanel(
  props: Readonly<Omit<FurnitureCataloguePanelProps, 'onRetry'>>,
) {
  return <FurnitureCataloguePanel {...props} onRetry={() => undefined} />;
}
