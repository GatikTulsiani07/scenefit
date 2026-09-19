import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { adaptSeededFurnitureCatalogue } from './legacy-furniture-adapter';
import { ProductLibrary } from './product-library';
import { formatCatalogPrice, getCatalogCategories } from './product-library-data';

function renderLibrary(props: Partial<React.ComponentProps<typeof ProductLibrary>> = {}) {
  return renderToStaticMarkup(<ProductLibrary catalog={adaptSeededFurnitureCatalogue()} {...props} />);
}

describe('ProductLibrary', () => {
  it('renders every adapted seed item with generic card details and actions', () => {
    const catalog = adaptSeededFurnitureCatalogue();
    const markup = renderLibrary();

    expect((markup.match(/<article/g) ?? [])).toHaveLength(catalog.items.length);
    expect(markup).toContain('10 products shown');

    for (const item of catalog.items) {
      expect(markup).toContain(item.name);
      expect(markup).toContain(item.category);
      expect(markup).toContain(formatCatalogPrice(item.pricing));
      expect(markup).toContain(`aria-label="Product image placeholder for ${item.name}"`);
      expect(markup).toContain(`href="/catalog/${item.id}"`);
      expect(markup).toContain(`aria-label="Edit ${item.name}"`);
    }

    expect((markup.match(/Published/g) ?? []).length).toBeGreaterThanOrEqual(catalog.items.length);
    expect((markup.match(/No Asset/g) ?? []).length).toBeGreaterThanOrEqual(catalog.items.length);
    expect((markup.match(/Preview unavailable/g) ?? []).length).toBeGreaterThanOrEqual(catalog.items.length);
    expect(markup).toContain('disabled=""');
  });

  it('derives accessible filter options and exposes an add-product link', () => {
    const markup = renderLibrary();

    expect(markup).toContain('<h1');
    expect(markup).toContain('Product Library</h1>');
    expect(markup).toContain('for="catalog-search"');
    expect(markup).toContain('for="catalog-category"');
    expect(markup).toContain('for="catalog-publication-status"');
    expect(markup).toContain('for="catalog-asset-status"');
    expect(markup).toContain('href="/catalog/new"');
    expect(markup).toContain('Add product');

    for (const category of getCatalogCategories(adaptSeededFurnitureCatalogue().items)) {
      expect(markup).toContain(`value="${category}"`);
    }
  });

  it('renders a distinct no-results state and displayed count for an unmatched search', () => {
    const markup = renderLibrary({ initialFilters: { search: 'does-not-exist' } });

    expect(markup).toContain('0 products shown');
    expect(markup).toContain('No products match these filters');
    expect(markup).not.toContain('No products yet');
    expect(markup).not.toContain('<article');
  });

  it('automatically renders the empty-catalogue state when there are no items', () => {
    const catalog = adaptSeededFurnitureCatalogue();
    const markup = renderLibrary({ catalog: { ...catalog, items: [] } });

    expect(markup).toContain('No products yet');
    expect(markup).not.toContain('No products match these filters');
    expect(markup).not.toContain('0 products shown');
  });

  it('renders intentional loading, empty-catalogue, and error states', () => {
    expect(renderLibrary({ state: 'loading' })).toContain('aria-label="Loading product library"');
    expect(renderLibrary({ state: 'empty' })).toContain('No products yet');

    const errorMarkup = renderLibrary({ state: 'error', errorMessage: 'The sample library is unavailable.' });
    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain('Product Library unavailable');
    expect(errorMarkup).toContain('The sample library is unavailable.');
  });
});
