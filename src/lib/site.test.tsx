import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePage from '@/app/page';
import { homePageContent, siteName, siteTagline } from './site';

describe('site copy', () => {
  it('identifies the product as SceneFit', () => {
    expect(siteName).toBe('SceneFit');
    expect(siteTagline).toBe('See it in your space.');
  });

  it('renders the placeholder home page without errors', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('SceneFit');
    expect(html).toContain(homePageContent.primaryCta);
    expect(html).toContain(homePageContent.demoLabel);
  });
});
