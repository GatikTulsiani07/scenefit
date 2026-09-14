import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

import { siteName, siteTagline } from '@/lib/site';

export const metadata: Metadata = {
  title: siteName,
  description: siteTagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
