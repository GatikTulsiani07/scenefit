import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { BusinessDashboard } from './dashboard';
import {
  emptyDashboardViewModel,
  errorDashboardViewModel,
  loadingDashboardViewModel,
  populatedDashboardViewModel,
  type DashboardViewModel,
} from './dashboard-view-model';

function renderDashboard(viewModel: DashboardViewModel = populatedDashboardViewModel) {
  return renderToStaticMarkup(<BusinessDashboard viewModel={viewModel} />);
}

describe('business dashboard', () => {
  it('renders the welcome summary, metrics, recent activity, and accessible destinations', () => {
    const markup = renderDashboard();

    expect(markup).toContain('Welcome back, Northstar Studio');
    expect(markup).toContain('A visual-commerce workspace for bringing your catalogue into customer spaces.');
    expect(markup).toContain('Demo data');
    expect(markup).toContain('Total products</dt><dd');
    expect(markup).toContain('>6</dd>');
    expect(markup).toContain('Ready digital assets</dt><dd');
    expect(markup).toContain('>4</dd>');
    expect(markup).toContain('Visualizations created</dt><dd');
    expect(markup).toContain('>3</dd>');
    expect(markup).toContain('Customer requests received</dt><dd');
    expect(markup).toContain('>2</dd>');
    expect(markup).toContain('Requests received in this workspace');
    expect(markup).toContain('Recent visualizations</h2>');
    expect(markup).toContain('Harbor welcome area');
    expect(markup).toContain('Recent customer requests</h2>');
    expect(markup).toContain('Jordan Lee');
    expect(markup).toContain('Quote request · Harbor welcome area');

    for (const [href, label] of [
      ['/catalog/new', 'Add product'],
      ['/catalog', 'View catalogue'],
      ['/projects/new', 'Create visualization'],
      ['/requests', 'View customer requests'],
    ]) {
      expect(markup).toContain(`href="${href}"`);
      expect(markup).toContain(label);
    }

    expect(markup).toContain('<h1');
    expect(markup).toContain('id="dashboard-metrics-heading"');
    expect(markup).toContain('aria-labelledby="recent-visualizations-heading"');
    expect(markup).toContain('aria-labelledby="recent-requests-heading"');
    expect(markup).toContain('id="quick-actions-heading"');
  });

  it('renders an intentional empty state with zero metrics', () => {
    const markup = renderDashboard(emptyDashboardViewModel);

    expect(markup).toContain('Start building your workspace');
    expect(markup).toContain('Add a product first');
    expect(markup).toContain('>0</dd>');
    expect(markup).not.toContain('Recent visualizations</h2>');
  });

  it('renders an explicit loading state without activity data', () => {
    const markup = renderDashboard(loadingDashboardViewModel);

    expect(markup).toContain('aria-label="Loading dashboard"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('Loading dashboard overview.');
    expect(markup).not.toContain('Recent visualizations</h2>');
  });

  it('renders an explicit error state with a safe recovery path', () => {
    const markup = renderDashboard(errorDashboardViewModel);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('Dashboard unavailable');
    expect(markup).toContain('The dashboard demo could not be displayed.');
    expect(markup).toContain('href="/catalog"');
    expect(markup).not.toContain('Recent customer requests</h2>');
  });
});
