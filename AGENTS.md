# SceneFit Agent Guide

## 1. Mission

Build SceneFit as a vertical-agnostic visual-commerce and spatial-visualization platform.

The engine remains generic; a business's catalogue, branding, categories, pricing, and calls to action make each experience specific. Furniture is demonstration content, not the permanent core abstraction.

Before every issue, read the complete assigned issue, `spec.md`, this file, and the directly relevant implementation/tests.

## 2. Source-of-truth order

1. Latest explicit human-maintainer instruction.
2. Assigned issue when it intentionally changes scope.
3. `spec.md`.
4. This file.
5. Existing conventions.

Ask one focused question or report a blocker when ambiguity would materially change behaviour, data, security, or scope.

## 3. Domain-language rules

For new platform contracts and reusable components, prefer:

- `Business`
- `Catalog`, `CatalogItem`, `CatalogItemCard`
- `DigitalAsset`, `AssetVariant`, `AssetStatus`
- `VisualizationProject`
- `Space`
- `Scene`, `SceneObject`
- `Placement`, `PlacementControls`
- `CustomerRequest`

Do not introduce new core architecture named for furniture, sofas, living rooms, event stages, or another vertical.

Existing furniture-oriented demo files and `SceneDataV1` are compatibility constraints. Do not perform a repository-wide rename or schema migration inside a feature issue. Use adapters and incremental boundaries, and change persisted schemas only in a dedicated, versioned, tested issue.

## 4. MVP boundaries

The target MVP proves:

```text
Business catalogue item
→ image and optional digital asset
→ customer-space visualization
→ place/configure
→ save/share
→ customer quote or enquiry
→ business follow-up
```

Do not implement without explicit approval:

- Full CAD, BIM, architectural drafting, or complex floor planning.
- An in-house AI 3D foundation model.
- AR, VR, 360 environments, or video visualization.
- Depth/perspective/occlusion/lighting AI pipelines.
- Full CRM, ERP, billing, checkout, or enterprise analytics.
- Separate applications or core architectures per industry.
- Speculative microservices, queues, or provider abstractions with no current use.

## 5. Approved technical direction

- `pnpm`.
- Next.js, React, and strict TypeScript.
- Tailwind CSS and shadcn/ui.
- Lucide React icons.
- Three.js, React Three Fiber, and Drei.
- Zustand editor state.
- Zod runtime validation.
- Supabase Postgres and Storage where already configured.
- Vercel hosting target.
- GLB/glTF for 3D assets.
- One modular Next.js application with explicit feature boundaries.

Do not replace approved technology or add a material dependency without showing why the existing stack is insufficient.

## 6. Feature boundaries

Prefer:

```text
src/
├── app/
├── components/ui/
├── features/business/
├── features/catalog/
├── features/digital-assets/
├── features/projects/
├── features/editor/
├── features/customer-experience/
├── features/customer-requests/
├── lib/supabase/
├── lib/validation/
├── lib/env/
├── stores/
└── types/
```

Rules:

- Keep domain logic out of page components.
- Keep normal UI separate from Three.js scene logic.
- Keep persisted schemas versioned and separate from transient state.
- Infer types from Zod schemas where practical.
- Centralize server-only clients and environment validation.
- Keep provider secrets and Supabase service-role credentials out of client bundles.
- Reuse existing code through adapters before duplicating it.
- Do not add generic business logic to a furniture-specific module merely because it exists.

## 7. Mandatory repository audit

Before starting a new phase or backend-facing feature, inspect:

- Framework, routing, and rendering boundaries.
- Existing database/schema and migrations.
- Authentication and authorization.
- Supabase clients, storage, and Row Level Security.
- APIs/server actions and validation.
- Current domain types and persisted scene versions.
- Existing UI components and styling.
- Existing 3D libraries and canvas behaviour.
- Tests, incomplete work, and relevant technical debt.

Map existing concepts before creating new tables, APIs, or stores. Do not perform destructive migrations without a dedicated approved plan.

## 8. Delivery phases

Follow the active phase in `spec.md`. Preserve already merged foundations.

- Phase 0: alignment and audit.
- Phase 1: app shell, dashboard, catalogue, catalogue-item creation.
- Phase 2: digital-asset generation/upload and preview.
- Phase 3: visualization projects and customer spaces.
- Phase 4: generic visualization editor and persistence.
- Phase 5: business-branded customer experience and compare.
- Phase 6: customer requests and follow-up.

Do not automatically continue into the next phase. Finish, verify, report, and wait for approval.

## 9. Issue workflow

For every issue:

1. Read the issue, `spec.md`, `AGENTS.md`, and relevant code/tests.
2. Inspect `git status --short --branch` and the branch diff.
3. Confirm testable acceptance criteria and exclusions.
4. Write a concise implementation plan.
5. Use one dedicated branch.
6. Implement only the assigned deliverable.
7. Add/update meaningful tests.
8. Run targeted checks while iterating.
9. Run all required checks once the implementation stabilizes.
10. Inspect the final diff and remove unrelated changes.
11. Open a draft PR with exact results, screenshots, limitations, and follow-ups.

Never push directly to `main`, merge your own PR, combine unrelated issues, rewrite history, weaken strictness, or commit secrets/generated credentials.

## 10. Required checks

Before a PR is ready for human review:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

Do not repeatedly rerun an unchanged failure. Inspect it, form a hypothesis, make one focused change, and rerun the narrowest useful check.

## 11. Testing expectations

- Unit tests for schemas, adapters, status transitions, stores, serialization, hydration, and pure editor constraints.
- Component tests for user-visible catalogue, project, editor, customer, and request behaviour.
- API tests for validation, ownership, tenant isolation, structured errors, and retry-safe operations.
- End-to-end tests for the catalogue → project → editor → share → request loop as phases land.
- Regression tests for bugs when stable automation is practical.

Avoid snapshot-only coverage and brittle pixel-level WebGL tests.

## 12. UI and browser verification

Compilation and unit tests are insufficient for UI/3D work.

For every relevant PR:

- Start the application and inspect the affected flow in a real browser.
- Check desktop and relevant mobile layouts.
- Inspect the browser console for application errors and warnings.
- Exercise keyboard, pointer, loading, empty, failure, retry, and success states.
- For 3D work, verify camera/transform interactions, floor placement, selection, scale policy, model failure, and WebGL fallback.
- Save screenshots or a short recording outside the repository unless an issue requests otherwise.

Never claim interactive or console verification when it could not be completed.

## 13. 3D and performance rules

- Treat the real customer environment as the primary experience.
- Keep rendering separate from commerce and persistence logic.
- Use stable placement/instance IDs.
- Lazy-load models; do not eagerly load the full catalogue.
- Use thumbnails for catalogue browsing.
- Optimize images and GLB/glTF assets outside runtime.
- Avoid React state updates on every animation frame.
- Keep transforms local while dragging; persist only controlled commits/autosave.
- Dispose Three.js resources and clean up listeners.
- Preserve the current `SceneDataV1` transform constraints until a dedicated versioned issue changes them.

## 14. Data, API, and security rules

- Validate untrusted input with Zod.
- Reject non-finite transforms, unknown asset IDs, duplicate placement IDs, and unsupported scene versions.
- Hydration is atomic; failures cannot partially mutate state.
- Validate upload type/size and scene payload limits.
- Use explicit structured success/error results.
- Enforce business ownership for catalogue, assets, projects, scenes, and requests.
- Audit RLS before changing Supabase policies.
- Public share access must be non-guessable and scoped.
- Never log or expose secrets, raw authorization headers, provider credentials, or sensitive customer data.
- External asset-generation providers are accessed server-side through a replaceable interface.

## 15. UX rules

- Business UI is desktop-first; customer visualization is responsive-first.
- Use configurable categories, pricing, currency, and primary action.
- Never hard-code AED in reusable pricing components.
- Provide action-oriented empty states.
- Preserve local work on save failures.
- Do not expose stack traces or provider internals to users.
- Use accessible primitives, visible focus, adequate touch targets, and textual canvas alternatives.
- Avoid heavy gradients, neon/gamer styling, excessive glassmorphism, tiny controls, clutter, and unnecessary animation.

## 16. Cost-aware agent policy

Keep issues small and cohesive. Use targeted repository searches, inspect direct dependencies, and avoid pasting lockfiles, binaries, generated output, raw webhook payloads, or unrelated diffs into model context.

Do not start parallel agents for one issue unless a human explicitly requests it. Do not spend retries on missing permissions, unavailable services, missing assets, or ambiguous requirements; report the blocker.

If the deployment has a configured model/budget policy, follow it. Never upgrade models, purchase credits, or trigger paid external generation automatically.

## 17. Pull request standard

Every draft PR includes:

- Linked issue.
- Problem statement and approved plan.
- Material changes and exact files.
- Tests added/updated.
- Exact verification commands/results.
- Screenshots/recording for UI or 3D work.
- Browser-console result.
- Known limitations and deferred work.
- Confirmation that unrelated or excluded scope was not introduced.

## 18. Definition of done

An issue is complete only when acceptance criteria are satisfied, relevant tests pass, required checks pass, loading/error/recovery behaviour is covered, UI/3D work is visually verified, the diff is clean, contracts/docs are updated when needed, and a human-reviewable draft PR reports all limitations accurately.

Coding agents prepare work for review. Final architectural approval and merge authority remain with human maintainers.
