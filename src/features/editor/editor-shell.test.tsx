import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { createEditorStore } from '@/stores/editor-store';

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

  it('renders a textual scene summary and selected-instance inspector metadata', () => {
    const store = createEditorStore({
      generateInstanceId: () => 'sofa-instance-1',
      roomId: 'living-room-v1',
    });
    store.getState().addAsset('sofa-luma-01');

    const html = renderToStaticMarkup(<EditorShell editorStore={store} />);

    expect(html).toContain('1 item in the scene');
    expect(html).toContain('Luma three-seat sofa');
    expect(html).toContain('Instance: sofa-instance-1');
    expect(html).toContain('Selected instance');
    expect(html).toContain('AED 3,890');
    expect(html).toContain('W 2.10 m × H 0.84 m × D 0.92 m');
    expect(html).toContain('(0.00, 0.00, 0.00)');
    expect(html).toContain('0.00 rad');
    expect(html).toContain('aria-label="Select Luma three-seat sofa instance sofa-instance-1"');
  });

  it('updates the selected inspector when an instance is selected through store-backed summary actions', () => {
    const generatedIds = ['sofa-instance-1', 'lamp-instance-1'];
    const store = createEditorStore({ generateInstanceId: () => generatedIds.shift() ?? '' });
    store.getState().addAsset('sofa-luma-01');
    store.getState().addAsset('lamp-luma-01');
    store.getState().selectInstance('sofa-instance-1');

    const html = renderToStaticMarkup(<EditorShell editorStore={store} />);

    expect(html).toContain('2 items in the scene');
    expect(html).toContain('Instance: lamp-instance-1');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('<h3 class="mt-2 text-lg font-semibold text-white">Luma three-seat sofa</h3>');
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
