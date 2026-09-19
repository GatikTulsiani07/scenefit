import React from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, ImagePlus, Inbox, PackagePlus } from 'lucide-react';

import {
  getDashboardMetrics,
  type DashboardMetrics,
  type DashboardViewModel,
} from './dashboard-view-model';

const quickActions = [
  { href: '/catalog/new', label: 'Add product', description: 'Add an item to your catalogue.', icon: PackagePlus },
  { href: '/catalog', label: 'View catalogue', description: 'Browse your products and digital assets.', icon: Boxes },
  { href: '/projects/new', label: 'Create visualization', description: 'Start a customer-space visualization.', icon: ImagePlus },
  { href: '/requests', label: 'View customer requests', description: 'Review incoming customer activity.', icon: Inbox },
] as const;

const metricDefinitions: ReadonlyArray<{ key: keyof DashboardMetrics; label: string; description: string }> = [
  { key: 'totalProducts', label: 'Total products', description: 'Catalogue items in this workspace' },
  { key: 'readyDigitalAssets', label: 'Ready digital assets', description: 'Products ready for visualization' },
  { key: 'visualizationsCreated', label: 'Visualizations created', description: 'Customer-space visualizations' },
  { key: 'customerRequestsReceived', label: 'Customer requests received', description: 'Requests received in this workspace' },
];

function DashboardHeading({ business }: Pick<DashboardViewModel, 'business'>) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Business overview</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {business.name}</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">{business.summary}</p>
    </header>
  );
}

function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading" className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="quick-actions-heading" className="text-xl font-semibold tracking-tight">Quick actions</h2>
        <span className="text-sm text-slate-500">Choose where to work next</span>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="group flex h-full gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-700" />
              <span>
                <span className="flex items-center gap-1 font-medium text-slate-900">{label}<ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Metrics({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <section aria-labelledby="dashboard-metrics-heading" className="mt-10">
      <h2 id="dashboard-metrics-heading" className="sr-only">Workspace metrics</h2>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricDefinitions.map(({ key, label, description }) => (
          <div key={key} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <dt className="text-sm font-medium text-slate-600">{label}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{metrics[key]}</dd>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <section aria-labelledby="empty-dashboard-heading" className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-8 sm:p-10">
      <h2 id="empty-dashboard-heading" className="text-xl font-semibold">Start building your workspace</h2>
      <p className="mt-2 max-w-2xl leading-6 text-slate-600">Add a product first, then create a visualization to see activity and customer requests here.</p>
    </section>
  );
}

function RecentActivity({ viewModel }: { viewModel: Extract<DashboardViewModel, { state: 'populated' }> }) {
  return (
    <div className="mt-10 grid gap-6 xl:grid-cols-2">
      <section aria-labelledby="recent-visualizations-heading" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-visualizations-heading" className="text-xl font-semibold tracking-tight">Recent visualizations</h2>
          <Link href="/projects" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">View all</Link>
        </div>
        <ul className="mt-4 divide-y divide-stone-200">
          {viewModel.visualizations.map((visualization) => (
            <li key={visualization.id} className="py-4 first:pt-0 last:pb-0">
              <p className="font-medium text-slate-900">{visualization.name}</p>
              <p className="mt-1 text-sm text-slate-600">{visualization.spaceLabel} · {visualization.updatedLabel}</p>
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="recent-requests-heading" className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-requests-heading" className="text-xl font-semibold tracking-tight">Recent customer requests</h2>
          <Link href="/requests" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700">View all</Link>
        </div>
        <ul className="mt-4 divide-y divide-stone-200">
          {viewModel.customerRequests.map((request) => (
            <li key={request.id} className="py-4 first:pt-0 last:pb-0">
              <p className="font-medium text-slate-900">{request.customerName}</p>
              <p className="mt-1 text-sm text-slate-600">{request.requestType} · {request.visualizationName}</p>
              <p className="mt-1 text-sm text-slate-500">{request.receivedLabel}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function BusinessDashboard({ viewModel }: { viewModel: DashboardViewModel }) {
  const isDataState = viewModel.state === 'populated' || viewModel.state === 'empty';
  const metrics = isDataState ? getDashboardMetrics(viewModel) : undefined;

  return (
    <div className="mx-auto max-w-7xl">
      <DashboardHeading business={viewModel.business} />
      {viewModel.state === 'populated' ? (
        <p className="mt-6 text-sm font-medium text-slate-600">Demo data</p>
      ) : null}
      {viewModel.state === 'loading' ? (
        <section aria-label="Loading dashboard" aria-busy="true" className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricDefinitions.map(({ key }) => <div key={key} className="h-36 animate-pulse rounded-xl bg-stone-200" />)}
          <p className="sr-only">Loading dashboard overview.</p>
        </section>
      ) : null}
      {viewModel.state === 'error' ? (
        <section role="alert" aria-labelledby="dashboard-error-heading" className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-950">
          <h2 id="dashboard-error-heading" className="text-xl font-semibold">Dashboard unavailable</h2>
          <p className="mt-2 leading-6">{viewModel.message}</p>
        </section>
      ) : null}
      {metrics ? <Metrics metrics={metrics} /> : null}
      {viewModel.state === 'empty' ? <EmptyDashboard /> : null}
      {viewModel.state === 'populated' ? <RecentActivity viewModel={viewModel} /> : null}
      <QuickActions />
    </div>
  );
}
