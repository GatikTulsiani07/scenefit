import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EditorShell } from './editor-shell';

describe('EditorShell', () => {
  it('renders the three editor regions on desktop', () => {
    const html = renderToStaticMarkup(<EditorShell />);

    expect(html).toContain('Furniture catalogue');
    expect(html).toContain('central 3d canvas');
    expect(html).toContain('right selected-object inspector');
    expect(html).toContain('save');
    expect(html).toContain('share');
  });

  it('renders an intentional empty-scene state', () => {
    const html = renderToStaticMarkup(<EditorShell />);

    expect(html).toContain('empty scene');
    expect(html).toContain('no furniture has been placed yet');
    expect(html).toContain('no object selected');
    expect(html).not.toContain('Selected sofa');
    expect((html.match(/<details/g) ?? []).length).toBe(3);
  });

  it('renders loading and error states with accessible text', () => {
    const loadingHtml = renderToStaticMarkup(<EditorShell mode="loading" />);
    const errorHtml = renderToStaticMarkup(<EditorShell mode="error" />);

    expect(loadingHtml).toContain('loading editor shell');
    expect(loadingHtml).toContain('Loading catalogue');
    expect(errorHtml).toContain('editor shell error');
    expect(errorHtml).toContain('retry load');
  });

  it('renders a retry action for error states', () => {
    const html = renderToStaticMarkup(<EditorShell mode="error" retryLabel="retry catalogue" />);

    expect(html).toContain('retry catalogue');
    expect(html).toContain('role="alert"');
  });

  it('includes mobile-friendly panel toggles', () => {
    const html = renderToStaticMarkup(<EditorShell />);

    expect(html).toContain('mobile panel');
    expect(html).toContain('<details');
    expect(html).toContain('lg:hidden');
    expect(html).toContain('hidden lg:block');
  });
});
