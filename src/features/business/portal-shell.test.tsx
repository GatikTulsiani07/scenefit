import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { PortalShell, portalNavigation } from './portal-shell';

vi.mock('next/navigation', () => ({ usePathname: () => '/catalog' }));

describe('business portal shell', () => {
  it('renders all routes in desktop and mobile navigation with the current route marked', () => {
    const markup = renderToStaticMarkup(<PortalShell><h1>Products</h1></PortalShell>);
    for (const item of portalNavigation) {
      expect(markup.match(new RegExp(`href="${item.href}"`, 'g'))).toHaveLength(item.href === '/dashboard' ? 3 : 2);
    }
    expect(markup.match(/aria-current="page"/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="Business portal"');
    expect(markup).toContain('aria-label="Mobile business portal"');
    expect(markup).toContain('<summary');
    expect(markup).toContain('Demo business');
    expect(markup).toContain('Demo account');
    expect(markup).toContain('Products</h1>');
  });
});
