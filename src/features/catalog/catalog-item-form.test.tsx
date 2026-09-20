import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { adaptSeededFurnitureCatalogue } from './legacy-furniture-adapter';
import { CatalogItemForm, submitAdapterFailureMessage, submitCatalogItemSafely } from './catalog-item-form';

const catalog = adaptSeededFurnitureCatalogue();

describe('CatalogItemForm', () => {
  it('renders accessible add defaults and required indicators', () => {
    const markup = renderToStaticMarkup(<CatalogItemForm mode="new" catalogId={catalog.id} />);

    expect(markup).toContain('<h1');
    expect(markup).toContain('Add product</h1>');
    expect(markup).toContain('Product name');
    expect(markup).toMatch(/aria-hidden="true"[^>]*>\*<\/span>/);
    expect(markup).toContain('aria-label="Product image placeholder');
    expect(markup).toContain('Digital-asset status');
    expect(markup).toContain('This form prepares a valid catalogue payload');
    expect(markup).toContain('href="/catalog"');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('type="submit"');
  });

  it('populates edit fields and displays the existing digital-asset status', () => {
    const item = catalog.items[0];
    const markup = renderToStaticMarkup(<CatalogItemForm mode="edit" item={item} catalogId={catalog.id} />);

    expect(markup).toContain('Edit product</h1>');
    expect(markup).toContain(`value="${item.name}"`);
    expect(markup).toContain(`value="${item.sku}"`);
    expect(markup).toContain('no asset');
    expect(markup).toContain('Prepare changes');
  });

  it('renders loading, error, and unknown-item states', () => {
    expect(renderToStaticMarkup(<CatalogItemForm mode="new" catalogId={catalog.id} state="loading" />)).toContain('Loading product form');
    expect(renderToStaticMarkup(<CatalogItemForm mode="new" catalogId={catalog.id} state="error" errorMessage="Unable to prepare form." />)).toContain('Unable to prepare form.');
    expect(renderToStaticMarkup(<CatalogItemForm mode="edit" catalogId={catalog.id} state="not_found" />)).toContain('Product not found');
    expect(renderToStaticMarkup(<CatalogItemForm mode="edit" catalogId={catalog.id} />)).toContain('Product not found');
  });

  it('turns synchronous and asynchronous submit-adapter failures into retryable user errors', async () => {
    const item = catalog.items[0];
    const syncFailure = await submitCatalogItemSafely(() => { throw new Error('sync failure'); }, item);
    const asyncFailure = await submitCatalogItemSafely(() => Promise.reject(new Error('async failure')), item);

    expect(syncFailure).toEqual({ success: false, message: submitAdapterFailureMessage });
    expect(asyncFailure).toEqual({ success: false, message: submitAdapterFailureMessage });
  });
});
