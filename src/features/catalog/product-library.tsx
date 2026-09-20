'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PackagePlus, Search } from 'lucide-react';

import type { Catalog, CatalogItem, DigitalAssetStatus, PublicationStatus } from './contracts';
import { DigitalAssetStatusPresentation } from '@/features/digital-assets/digital-asset-status';
import {
  ALL_FILTER_VALUE,
  defaultProductLibraryFilters,
  filterCatalogItems,
  formatCatalogPrice,
  formatDigitalAssetStatus,
  formatPublicationStatus,
  getCatalogCategories,
  type ProductLibraryFilters,
} from './product-library-data';

export type ProductLibraryState = 'success' | 'loading' | 'empty' | 'error';

type ProductLibraryProps = {
  catalog: Catalog;
  state?: ProductLibraryState;
  errorMessage?: string;
  initialFilters?: Partial<ProductLibraryFilters>;
};

const publicationStatuses: ReadonlyArray<PublicationStatus> = ['draft', 'published', 'archived'];
const digitalAssetStatuses: ReadonlyArray<DigitalAssetStatus> = [
  'no_asset',
  'queued',
  'processing',
  'needs_review',
  'ready',
  'failed',
];

function CatalogItemPlaceholder({ item }: { item: CatalogItem }) {
  return (
    <div
      aria-label={`Product image placeholder for ${item.name}`}
      className="flex aspect-[4/3] items-center justify-center rounded-lg bg-stone-100 p-4 text-center text-sm font-medium text-slate-600"
      data-thumbnail-url={item.digitalAsset?.thumbnailUrl}
    >
      Image unavailable
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{label}</span>;
}

function ProductCard({ item }: { item: CatalogItem }) {
  const previewDescriptionId = `preview-unavailable-${item.id}`;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <CatalogItemPlaceholder item={item} />
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={formatPublicationStatus(item.publicationStatus)} />
        </div>
        <DigitalAssetStatusPresentation input={item.digitalAsset} compact />
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{item.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{item.category}</p>
        {item.sku ? <p className="mt-2 text-xs text-slate-500">SKU: {item.sku}</p> : null}
        <p className="mt-4 text-base font-semibold text-slate-900">{formatCatalogPrice(item.pricing)}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/catalog/${item.id}`}
            aria-label={`Edit ${item.name}`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
          >
            Edit
          </Link>
          <span>
            <button
              type="button"
              disabled
              aria-describedby={previewDescriptionId}
              className="cursor-not-allowed rounded-md border border-stone-200 px-3 py-2 text-sm font-medium text-slate-500"
            >
              Preview unavailable
            </button>
            <span id={previewDescriptionId} className="sr-only">Product preview is not available yet.</span>
          </span>
        </div>
      </div>
    </article>
  );
}

function ProductLibraryFilters({
  categories,
  filters,
  onFiltersChange,
}: {
  categories: ReadonlyArray<string>;
  filters: ProductLibraryFilters;
  onFiltersChange: (nextFilters: ProductLibraryFilters) => void;
}) {
  return (
    <fieldset className="mt-8 grid gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <legend className="sr-only">Filter products</legend>
      <label className="block text-sm font-medium text-slate-800" htmlFor="catalog-search">
        Search products
        <span className="relative mt-2 block">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id="catalog-search"
            type="search"
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
            placeholder="Name, SKU, or category"
            className="w-full rounded-md border border-stone-300 py-2 pl-9 pr-3 text-slate-900 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
          />
        </span>
      </label>
      <label className="block text-sm font-medium text-slate-800" htmlFor="catalog-category">
        Category
        <select id="catalog-category" value={filters.category} onChange={(event) => onFiltersChange({ ...filters, category: event.target.value })} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
          <option value={ALL_FILTER_VALUE}>All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-800" htmlFor="catalog-publication-status">
        Publication status
        <select id="catalog-publication-status" value={filters.publicationStatus} onChange={(event) => onFiltersChange({ ...filters, publicationStatus: event.target.value as ProductLibraryFilters['publicationStatus'] })} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
          <option value={ALL_FILTER_VALUE}>All publication statuses</option>
          {publicationStatuses.map((status) => <option key={status} value={status}>{formatPublicationStatus(status)}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-800" htmlFor="catalog-asset-status">
        Digital-asset status
        <select id="catalog-asset-status" value={filters.digitalAssetStatus} onChange={(event) => onFiltersChange({ ...filters, digitalAssetStatus: event.target.value as ProductLibraryFilters['digitalAssetStatus'] })} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
          <option value={ALL_FILTER_VALUE}>All digital-asset statuses</option>
          {digitalAssetStatuses.map((status) => <option key={status} value={status}>{formatDigitalAssetStatus(status)}</option>)}
        </select>
      </label>
    </fieldset>
  );
}

export function ProductLibrary({
  catalog,
  state = 'success',
  errorMessage = 'The product library could not be displayed. Try again later.',
  initialFilters,
}: ProductLibraryProps) {
  const [filters, setFilters] = useState<ProductLibraryFilters>({ ...defaultProductLibraryFilters, ...initialFilters });
  const categories = getCatalogCategories(catalog.items);
  const visibleItems = filterCatalogItems(catalog.items, filters);
  const isEmptyCatalogue = state === 'empty' || (state === 'success' && catalog.items.length === 0);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Catalogue</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Product Library</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Manage the products and digital assets used in your customer visualizations.</p>
        </div>
        <Link href="/catalog/new" className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
          <PackagePlus aria-hidden="true" className="size-4" />
          Add product
        </Link>
      </div>

      {state === 'loading' ? <section aria-label="Loading product library" aria-busy="true" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><p className="sr-only">Loading products.</p>{[1, 2, 3, 4, 5, 6].map((placeholder) => <div key={placeholder} className="h-80 animate-pulse rounded-2xl bg-stone-200" />)}</section> : null}
      {state === 'error' ? <section role="alert" aria-labelledby="product-library-error-heading" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950"><h2 id="product-library-error-heading" className="text-xl font-semibold">Product Library unavailable</h2><p className="mt-2 leading-6">{errorMessage}</p></section> : null}
      {isEmptyCatalogue ? <section aria-labelledby="empty-catalog-heading" className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-8 sm:p-10"><h2 id="empty-catalog-heading" className="text-xl font-semibold">No products yet</h2><p className="mt-2 max-w-xl leading-6 text-slate-600">Add your first product to begin building customer visualizations.</p></section> : null}
      {state === 'success' && !isEmptyCatalogue ? (
        <>
          <ProductLibraryFilters categories={categories} filters={filters} onFiltersChange={setFilters} />
          <p className="mt-5 text-sm text-slate-600" role="status" aria-live="polite">{visibleItems.length} {visibleItems.length === 1 ? 'product' : 'products'} shown</p>
          {visibleItems.length === 0 ? <section aria-labelledby="no-results-heading" className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-white p-8"><h2 id="no-results-heading" className="text-xl font-semibold">No products match these filters</h2><p className="mt-2 text-slate-600">Try another search or filter combination.</p></section> : <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleItems.map((item) => <ProductCard key={item.id} item={item} />)}</div>}
        </>
      ) : null}
    </div>
  );
}
