import React from 'react';

export function PortalPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <section aria-label={`${title} empty state`} className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12">
        <h2 className="text-lg font-semibold">Nothing here yet</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      </section>
    </div>
  );
}
