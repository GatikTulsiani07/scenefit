import React from 'react';
import { ArrowRight } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('renders a semantic button element with the default type', () => {
    const html = renderToStaticMarkup(
      <Button>
        Continue <ArrowRight />
      </Button>,
    );

    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('Continue');
  });

  it('supports rendering as a child element', () => {
    const html = renderToStaticMarkup(
      <Button asChild>
        <a href="/design">Design your room</a>
      </Button>,
    );

    expect(html).toContain('<a href="/design"');
    expect(html).not.toContain('<button');
  });
});
