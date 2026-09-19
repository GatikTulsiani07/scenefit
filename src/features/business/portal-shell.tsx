'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const portalNavigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/catalog', label: 'Product Library' },
  { href: '/projects', label: 'Visualizations' },
  { href: '/requests', label: 'Customer Requests' },
  { href: '/settings', label: 'Settings' },
] as const;

export function PortalNavigation({ pathname }: { pathname: string }) {
  return (
    <ul className="space-y-1">
      {portalNavigation.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${active ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col lg:flex-row">
        <aside className="shrink-0 bg-slate-950 text-white lg:w-64">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:px-6 lg:py-8">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400">SceneFit</Link>
            <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">Demo business</span>
          </div>
          <nav aria-label="Business portal" className="hidden px-3 pb-8 lg:block">
            <PortalNavigation pathname={pathname} />
          </nav>
          <details key={pathname} className="border-t border-slate-800 lg:hidden">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-cyan-400">Menu</summary>
            <nav aria-label="Mobile business portal" className="px-3 pb-4">
              <PortalNavigation pathname={pathname} />
            </nav>
          </details>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center justify-end border-b border-stone-200 bg-white px-5 lg:px-10">
            <span aria-label="Account placeholder" className="rounded-full border border-stone-200 px-4 py-2 text-sm text-slate-600">Demo account</span>
          </header>
          <main id="portal-content" className="w-full flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
