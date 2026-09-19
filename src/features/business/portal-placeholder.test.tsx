import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { PortalPlaceholder } from './portal-placeholder';
import CatalogPage from '@/app/(portal)/catalog/page';
import ProjectsPage from '@/app/(portal)/projects/page';
import RequestsPage from '@/app/(portal)/requests/page';
import SettingsPage from '@/app/(portal)/settings/page';
import NewCatalogItemPage from '@/app/(portal)/catalog/new/page';
import NewVisualizationPage from '@/app/(portal)/projects/new/page';

describe('portal empty state', () => {
  it('renders a labelled page and intentional empty message', () => {
    const markup = renderToStaticMarkup(<PortalPlaceholder title="Settings" description="Coming soon." />);
    expect(markup).toContain('<h1');
    expect(markup).toContain('Settings</h1>');
    expect(markup).toContain('aria-label="Settings empty state"');
    expect(markup).toContain('Nothing here yet');
    expect(markup).toContain('Coming soon.');
  });
});

it.each([
  ['Product Library', CatalogPage],
  ['Visualizations', ProjectsPage],
  ['Customer Requests', RequestsPage],
  ['Settings', SettingsPage],
])('renders the %s route placeholder', (title, Page) => {
  const markup = renderToStaticMarkup(<Page />);
  expect(markup).toContain(`${title}</h1>`);
  expect(markup).toContain('Nothing here yet');
});

it.each([
  ['Add product', 'Product creation will be available here in a future update.', NewCatalogItemPage],
  ['Create visualization', 'Visualization creation will be available here in a future update.', NewVisualizationPage],
])('renders the labelled %s creation placeholder', (title, description, Page) => {
  const markup = renderToStaticMarkup(<Page />);
  expect(markup).toContain(`${title}</h1>`);
  expect(markup).toContain(description);
});
