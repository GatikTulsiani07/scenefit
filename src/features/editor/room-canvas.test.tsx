import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RoomCanvasBoundary } from './room-canvas';

describe('RoomCanvasBoundary', () => {
  it('renders a loading boundary without initializing WebGL during server rendering', () => {
    const html = renderToStaticMarkup(<RoomCanvasBoundary initialState="loading" />);

    expect(html).toContain('Loading room preview');
    expect(html).toContain('room-canvas-description');
    expect(html).not.toContain('<canvas');
  });

  it('renders an accessible WebGL fallback while keeping the surrounding editor usable', () => {
    const html = renderToStaticMarkup(<RoomCanvasBoundary initialState="webgl-unavailable" />);

    expect(html).toContain('3D preview unavailable');
    expect(html).toContain('does not support WebGL');
    expect(html).toContain('Interactive 3D preview of a static living room');
    expect(html).not.toContain('<canvas');
  });

  it('exposes a semantic reset-camera control and a stable responsive wrapper', () => {
    const html = renderToStaticMarkup(<RoomCanvasBoundary initialState="ready" />);

    expect(html).toContain('<button');
    expect(html).toContain('Reset camera');
    expect(html).toContain('h-[22rem]');
    expect(html).toContain('sm:h-[28rem]');
    expect(html).toContain('min-w-0 overflow-hidden');
  });

  it('renders an actionable retry state after unexpected initialization failure', () => {
    const html = renderToStaticMarkup(<RoomCanvasBoundary initialState="error" />);

    expect(html).toContain('Room preview could not start');
    expect(html).toContain('Retry 3D preview');
    expect(html).toContain('role="alert"');
  });
});
