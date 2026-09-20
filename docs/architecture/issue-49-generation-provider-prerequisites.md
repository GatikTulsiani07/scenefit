# Issue #49 generation-provider prerequisites audit

## Decision

Issue #49 cannot safely enable generation in this checkout. This is an audit
only; no endpoint, provider, credential, paid request, fake success flow, or
generation UI was added.

The repository contains provider-neutral digital-asset and generation-job
contracts in `src/features/digital-assets/contracts.ts`, and the status UI
can present the six catalogue-reference/asset states in
`src/features/digital-assets/digital-asset-status.tsx`. Those contracts are
validation boundaries, not authenticated ownership, persistence, storage, or
provider execution boundaries.

## Confirmed repository facts

| Prerequisite | Evidence | Finding |
| --- | --- | --- |
| Authenticated business membership | `src/features/business/portal-shell.tsx:44,58` renders “Demo business” and “Demo account”. `src/lib/env.ts:3-10` validates only `NODE_ENV` and an optional public app URL. There are no sign-in routes, sessions, identity provider, membership lookup, or role checks. | Absent. The demo label is not an authenticated principal. |
| Server-enforced catalogue-item ownership | `src/features/catalog/contracts.ts:76-90` has `catalogId` but no business/owner scope. `src/features/catalog/legacy-furniture-adapter.ts:50-75` creates an in-memory seeded catalogue. `/catalog` and `/catalog/[id]` adapt that seed (`src/app/(portal)/catalog/page.tsx:5-6`, `src/app/(portal)/catalog/[id]/page.tsx:7-12`). | Absent. A client-supplied catalogue or item ID cannot prove ownership, and cross-business denial is impossible. |
| Durable generation-job storage | `src/features/digital-assets/contracts.ts:145-205` validates request/job/result shapes only. `find src/app -name route.ts` returns no API routes; there is no database client, migration, repository, server action, or job runner. | Absent. Job IDs and statuses are not persisted or recoverable. |
| Approved asset storage and delivery | The Issue #48 blocker records that no GLB/glTF files, bucket, signed/authorized delivery route, or authenticated ownership boundary exists. Seeded legacy `modelUrl` values remain `no_asset` in `src/features/catalog/legacy-furniture-adapter.ts:69-74`. | Absent. No generated result can be stored or safely served as an approved asset. |
| Server-side provider boundary | `src/app` contains only page/layout routes; there is no generation handler, worker, provider adapter, or server-only provider client. `package.json` has no generation-provider SDK, and `.env.example`/`src/lib/env.ts` have no provider secret or configuration. | Absent. Nothing can submit, poll, cancel, or map provider jobs behind a server boundary. |
| Provider and spending approval | `spec.md:261` gives Meshy/Tripo only as conceptual examples and says the frontend must remain provider-neutral. No repository decision, maintainer approval, account configuration, budget, quota, rate limit, or per-business spending policy names a provider or limit. | Not approved. This audit does not choose a provider or invent a cost limit. |

The Issue #46 report independently reaches the same authentication,
ownership, persistence, and storage blocker. The Issue #48 report confirms
that legacy model paths are not approved model evidence and that preview
delivery is unavailable. The existing status UI correctly keeps unverified
references unavailable; it does not create a generation capability.

## Decisions required before live integration

The maintainers must explicitly decide and record:

- the authentication/session system and business membership roles;
- the durable database and tenant/RLS policy for catalogues, items, assets,
  generation requests, and jobs;
- the private storage and authorized or signed delivery boundary for approved
  model files;
- one provider, permitted model/input policy, data-retention terms, and the
  server-side credential ownership;
- an explicit spending policy: per-request and per-business limits, rate
  limits, duplicate/idempotency rules, timeout/cancellation behavior, and an
  operator kill switch.

Until those decisions exist, a provider cannot be selected on the user's
behalf and no paid or external request should be attempted.

## Smallest ordered foundation issues

1. **Identity and membership boundary.** Add server-verifiable sessions,
   business membership/roles, and structured unauthenticated/forbidden
   responses. Derive business context from the session, never from a browser
   `businessId`.
2. **Tenant-scoped catalogue repository.** Persist businesses, catalogues,
   and items with ownership; authorize every read/write server-side; add
   cross-business denial tests and RLS when the selected database supports it.
3. **Private asset storage and delivery.** Establish the approved storage
   boundary, ownership metadata, safe paths, signed/authorized reads, and
   lifecycle cleanup. Connect approved files to the existing `DigitalAsset`
   contract without promoting legacy `no_asset` paths.
4. **Durable generation-job repository.** Persist requests and jobs with the
   contract lifecycle, provider-job identity kept server-side, idempotency
   keys, retry/cancellation/timeout semantics, structured failures, and an
   audit trail. Prove item/asset ownership before enqueueing.
5. **Provider and budget approval.** After the foundations are reviewable,
   choose one provider and document the model policy, credential boundary,
   cost controls, quotas, retention, and operational kill switch. This is a
   product/operations decision, not an implementation assumption.
6. **Replaceable server adapter and integration.** Implement the approved
   provider behind a server-only interface, map its states/errors into the
   generic contracts, use a deterministic fake provider in tests, and then
   add explicit authorized request/retry/status UI. Never trigger generation
   on page load, tests, or deployment.

## Remaining limitations

This report verifies tracked source and documentation only. External cloud
accounts, deployed services, provider agreements, and untracked environment
configuration were not available for inspection, so their existence cannot
be inferred from this repository. No live-provider or browser verification
was performed, and no generation acceptance criterion is claimed complete.
