import React from 'react';
import { homePageContent } from '@/lib/site';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur md:p-12">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-sky-300/90">
            {homePageContent.demoLabel}
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
              {homePageContent.title}
            </h1>
            <p className="text-xl text-slate-300 md:text-2xl">
              {homePageContent.tagline}
            </p>
          </div>
          <p className="max-w-xl text-base leading-7 text-slate-400 md:text-lg">
            {homePageContent.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sky-100">
              {homePageContent.primaryCta}
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2">
              single-app Next.js foundation
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
