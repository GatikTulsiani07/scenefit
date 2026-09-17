import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { furnitureCatalogue, getAvailableFurnitureCategories } from './furniture-catalogue';
import {
  CatalogueAddToRoomButton,
  CatalogueRetryButton,
  formatAedPrice,
  formatDimensions,
  FurnitureCataloguePanel,
  getThumbnailPlaceholderLabel,
  getVisibleFurnitureProducts,
} from './furniture-catalogue-panel';

function renderPanel(props: Partial<React.ComponentProps<typeof FurnitureCataloguePanel>> = {}) {
  return renderToStaticMarkup(
    <FurnitureCataloguePanel
      catalogue={furnitureCatalogue}
      {...props}
      onRetry={props.onRetry ?? (() => undefined)}
      onAddToRoom={props.onAddToRoom ?? (() => undefined)}
    />,
  );
}

describe('FurnitureCataloguePanel', () => {
  it('renders every seeded product with its category, AED price, dimensions, and accessible thumbnail placeholder', () => {
    const html = renderPanel();

    expect((html.match(/<article/g) ?? [])).toHaveLength(10);

    for (const asset of furnitureCatalogue) {
      expect(html).toContain(asset.name);
      expect(html).toContain(asset.category);
      expect(html).toContain(formatAedPrice(asset.priceAed));
      expect(html).toContain(formatDimensions(asset.dimensions));
      expect(html).toContain(`aria-label="${getThumbnailPlaceholderLabel(asset.name)}"`);
      expect(html).toContain(`data-thumbnail-url="${asset.thumbnailUrl}"`);
    }

    expect(html).not.toContain('<img');
    expect(html).not.toContain('/_next/image');
  });

  it('formats AED prices and metre dimensions consistently', () => {
    expect(formatAedPrice(3890)).toBe('AED 3,890');
    expect(formatDimensions(furnitureCatalogue[0].dimensions)).toBe(
      'W 2.10 m × H 0.84 m × D 0.92 m',
    );
  });

  it('derives All and every category filter from the supplied catalogue with All selected by default', () => {
    const html = renderPanel();

    expect(html).toContain('All<span class="sr-only"> filter selected</span>');
    expect(html).toContain('aria-pressed="true"');

    for (const category of getAvailableFurnitureCategories(furnitureCatalogue)) {
      expect(html).toContain(`>${category}</button>`);
    }
  });

  it('uses semantic keyboard-accessible buttons for filter controls', () => {
    const html = renderPanel();

    expect((html.match(/<button/g) ?? []).length).toBeGreaterThanOrEqual(
      getAvailableFurnitureCategories(furnitureCatalogue).length + 1,
    );
    expect(html).toContain('aria-label="Furniture category filters"');
    expect(html).toContain('focus-visible:ring-2');
  });

  it('filters products deterministically for every available category and updates the count source', () => {
    expect(getVisibleFurnitureProducts('All', furnitureCatalogue)).toEqual(furnitureCatalogue);

    for (const category of getAvailableFurnitureCategories(furnitureCatalogue)) {
      const filteredProducts = getVisibleFurnitureProducts(category, furnitureCatalogue);

      expect(filteredProducts).not.toHaveLength(0);
      expect(filteredProducts.every((asset) => asset.category === category)).toBe(true);
      expect(filteredProducts).toEqual(
        furnitureCatalogue.filter((asset) => asset.category === category),
      );
    }
  });

  it('renders an understandable empty filtered result when a category has no matching products', () => {
    const html = renderToStaticMarkup(
      <FurnitureCataloguePanel state="success" catalogue={[]} onRetry={() => undefined} onAddToRoom={() => undefined} />,
    );

    expect(html).toContain('0 products shown');
    expect(html).toContain('No products in this category');
  });

  it('renders an announced loading state', () => {
    const html = renderPanel({ state: 'loading' });

    expect(html).toContain('Loading catalogue');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('renders an error state with a semantic retry control', () => {
    const html = renderPanel({ state: 'error', onRetry: vi.fn() });

    expect(html).toContain('Catalogue failed to load');
    expect(html).toContain('<button');
    expect(html).toContain('Retry catalogue');
    expect(html).toContain('role="alert"');
  });

  it('invokes the supplied retry callback', () => {
    const onRetry = vi.fn();
    const retryButton = CatalogueRetryButton({ onRetry });

    retryButton.props.onClick?.({} as React.MouseEvent<HTMLButtonElement>);

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the empty-catalogue state', () => {
    const html = renderToStaticMarkup(
      <FurnitureCataloguePanel state="empty" catalogue={[]} onRetry={() => undefined} onAddToRoom={() => undefined} />,
    );

    expect(html).toContain('No catalogue products yet');
  });

  it('renders enabled semantic placement actions for every product', () => {
    const html = renderPanel();

    expect((html.match(/Add to room/g) ?? [])).toHaveLength(10);
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('aria-label="Add Luma three-seat sofa to room"');
  });

  it('calls the supplied store action with the product asset ID', () => {
    const onAddToRoom = vi.fn();
    const addButton = CatalogueAddToRoomButton({
      asset: furnitureCatalogue[0],
      onAddToRoom,
    });

    addButton.props.onClick?.({} as React.MouseEvent<HTMLButtonElement>);

    expect(onAddToRoom).toHaveBeenCalledWith('sofa-luma-01');
  });

  it('provides an accessible label for the deterministic thumbnail placeholder', () => {
    expect(getThumbnailPlaceholderLabel('Luma three-seat sofa')).toBe(
      'Product thumbnail placeholder for Luma three-seat sofa',
    );
  });
});
