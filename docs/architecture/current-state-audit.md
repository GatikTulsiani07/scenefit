# SceneFit current-state architecture audit

**Baseline:** `main` at `481c29c9577b5fb45cec715f360cfe7847ed5934` (documentation merge, PR #31).

**Scope:** Issue #32, read-only assessment of tracked repository files. A deployed environment, external services, and untracked local configuration were not audited.

## Executive summary

The repository is a single Next.js application with two routes: a static landing page (`/`) and a client-side furniture demo editor (`/design`). The editor has a ten-item in-memory catalogue, a Zustand store for placing and selecting item instances, a validated version-one scene format, and a procedural React Three Fiber room. The room geometry is a static preview; placed items are represented in an accessible text list and inspector, not rendered as 3D furniture.

The repository has **no implemented business portal, identity, tenant boundary, persistence, uploads, API endpoints, or customer share flow**. `spec.md` and `README.md` describe planned Supabase integration and SaaS access, but there is no Supabase package, configuration, migration, policy, client, or server implementation in this checkout. The current demo is suitable as a reusable editor foundation, not as an isolated business workspace or production multi-tenant service.

## Tracked application inventory

| Area | Current implementation | Consequence for the new product |
| --- | --- | --- |
| Routes | `src/app/page.tsx` renders static introductory content; `src/app/design/page.tsx` renders `EditorShell`. `src/app/layout.tsx` sets common metadata and global CSS. | `/dashboard`, `/catalog`, `/projects`, `/leads`, `/settings`, `/design/[projectId]`, and other specified portal/customer routes do not exist. `/design` is a local demo, not a shared customer view. |
| Rendering boundary | `src/features/editor/editor-shell.tsx` and the room-canvas components are client components; `src/features/editor/room-canvas.tsx` dynamically imports the Three.js canvas with `ssr: false`. | Keep rendering/interaction isolated from future server-owned data, authorization, and persistence. |
| UI/styling | Tailwind configuration and global styles, `src/components/ui/button.tsx`, Lucide icons, three desktop panels (`hidden lg:block`) and three mobile disclosures (`lg:hidden`) in the editor. | The components are reusable; business portal navigation, generic catalogue cards, and customer presentation require new screens. |
| Catalogue | `src/features/assets/furniture-catalogue.ts` validates exactly ten seeded items with Zod; fields include `assetId`, SKU, category, `priceAed`, dimensions, thumbnail/model paths, and optional furniture metadata. `furniture-catalogue-panel.tsx` supplies filtering and add-to-room controls. | Catalogue data is hard-coded, furniture-specific, single-currency, and not owned by a business. Paths are metadata; the referenced product images/models are not tracked as delivered files. |
| Editor state | `src/stores/editor-store.ts` creates a per-editor vanilla Zustand store with project/room placeholders, catalogue metadata, placed instances, selection, interaction mode, dirty/save/loading/error flags, and add/select/move/rotate/delete/clear actions. | Useful local interaction boundary. There is no server save, project repository, cross-session recovery, or tenant identity. Movement constrains X/Z; rotation constrains Y. |
| Scene contract | `src/lib/validation/scene-data.ts` defines strict `SceneDataV1`: `version: 1`, `roomId`, up to 100 uniquely identified `placedAssets`, and optional camera. Coordinates are finite and bounded; each placement has `instanceId`, `assetId`, position, and rotation. | Preserve version-one compatibility. Conceptual `Space`, `Scene`, and `Placement` models in `spec.md` require explicit adapters or a separately planned versioned evolution. |
| Serialization | `src/features/editor/scene-serialization.ts` serializes scene-owned state; hydration validates structure/version and verifies every asset against the seeded furniture catalogue before mutating the store. `editor-store.ts` resets transient selection/status on successful hydration. | Validation and atomic hydration are worth keeping. Asset lookup is furniture-specific; camera is accepted by the schema but not retained by the current store. No persistence endpoint consumes the result. |
| 3D | `room-canvas.tsx` handles loading, WebGL-unavailable and error states; `static-room-canvas.tsx` renders a floor, walls, a fixed mesh, lighting, shadows, constrained orbit/pan/zoom, and camera reset. `editor-shell.tsx` keeps a textual list of placed assets below the canvas. | Reuse the WebGL boundary and fallback. The scene does not load GLB models, display placements in 3D, use customer images, or implement 3D transforms. |
| Environment | `src/lib/env.ts` validates `NODE_ENV` and optional `NEXT_PUBLIC_APP_URL`; `.env.example` documents those values. | There are no database, storage, auth, payment, or generation-provider settings in this repository. |
| Automation | `.github/workflows/ci.yml` installs via pnpm and runs lint, typecheck, test, and build on PRs and pushes to `main`. | Continue using these checks; add API ownership tests and browser flows when those surfaces exist. |

### Dependencies and tests

The runtime dependencies in `package.json` are Next.js 15, React 19, Tailwind 3, Radix Slot, class-variance-authority, clsx, tailwind-merge, Lucide, Zod 4, Zustand 5, Three.js, React Three Fiber, and Drei. ESLint, TypeScript, Vitest, and React/Node types support development. No Supabase SDK, database client, auth library, billing SDK, image-upload service, generation provider, or job runner is installed.

The repository's `*.test.ts` and `*.test.tsx` files cover: the button primitive; site copy and environment parsing; furniture catalogue data and catalogue-panel states/filtering; editor-shell layout, state, and add/select flows; room-canvas states; `SceneDataV1` validation; serialization/hydration; and editor-store operations. These are unit/component tests, not API, tenant-isolation, end-to-end, or real-browser interaction tests. The CI job runs the four standard commands; it does not conduct browser verification.

## Backend and access audit

| Capability | Current repository evidence | Gap |
| --- | --- | --- |
| Authentication and business membership | No sign-in routes, session code, identity provider, memberships, or role checks. | Owner/Admin/Editor/Viewer are product plans, not implemented roles. |
| Tenant isolation and authorization | No `businessId` in catalogue items or scene payloads; no server-side business ownership checks. | Every future business-owned read/write needs server-enforced tenant scoping. Client-side workspace selection cannot provide isolation. |
| Database and migrations | No Supabase client/configuration, SQL, migrations, ORM, or data repository. | There are no persisted businesses, catalogues, projects, scenes, subscriptions, or requests. No existing RLS policies are available here to audit. |
| Storage and uploads | Product image/model URLs are seeded application-relative strings; no tracked `public` assets, storage buckets, upload handlers, or signed URLs. | Validate type, size, ownership, and visibility before real uploads. Do not assume seed paths refer to deployed files. |
| APIs and server actions | No `route.ts` API endpoints or server actions; the only implemented server render is the normal Next.js page/layout boundary. | Validate inputs and authorize ownership server-side before adding persistent operations. |
| Public sharing | No share-token issuance, revocation, customer route, or published-only catalogue query. The editor's Save/Share buttons are placeholders. | Keep private portal and public customer experience separate; use scoped, non-guessable access to shared projects. |
| Subscriptions and entitlements | README describes a subscription model; no billing integration, subscription state, or server checks exist. | Do not market the current demo as a multi-business subscription service. Manually managed development entitlements can precede payments if explicitly specified. |
| Secrets and provider integration | No generation worker/provider or server-side key management; `.env.example` lists only app URL and environment. | Keep privileged credentials off the client when providers are introduced. |

These findings describe the tracked `main` revision only. They do not assert that external Supabase projects, deployed services, or infrastructure accounts are absent.

## Legacy-to-canonical mapping and treatment

| Existing path or concept | Canonical concept | Treatment | Reason / migration boundary |
| --- | --- | --- | --- |
| Seeded furniture list in `features/assets/furniture-catalogue.ts` | `Catalog` containing `CatalogItem` | **Adapt** | Add a generic data contract and an explicit seed adapter; retain the demo data and stable IDs. Do not force every business to have exactly ten items or use AED. |
| `FurnitureAsset` fields `thumbnailUrl`, `modelUrl`, dimensions, SKU, metadata | `CatalogItem` plus `DigitalAsset` references | **Adapt** | Separate item identity/pricing from media and readiness; file paths currently represent metadata, not proof of uploaded usable assets. |
| `SeededFurnitureCataloguePanel` | Business `CatalogItem` library and editor catalogue picker | **Keep** for `/design`; **adapt** in new surfaces | Reuse filtering and display behavior, but place generic new logic in `features/catalog`, not the furniture module. |
| `EditorAssetCatalogItem` and `assets` store field | Editor-facing projection of `CatalogItem` | **Adapt** | Load permitted items through a later tenant-scoped repository; preserve current demo projection while migrating incrementally. |
| `projectId`, `projectName` on editor store | `VisualizationProject` | **Migrate later** | Currently placeholders, with no project lifecycle or persisted owner; introduce project storage/ownership in a dedicated phase. |
| `roomId` in `SceneDataV1` and demo `living-room-v1` | `Space` reference | **Migrate later** | A real customer space needs project association and uploaded environment media. Keep `roomId` intact in v1. |
| `SceneDataV1`, `placedAssets`, serialize/hydrate helpers | `Scene` and `Placement[]` | **Keep**, then **adapt** | The validated format and atomic hydration are valuable. A broader placement/scene shape needs a dedicated versioned schema with compatibility tests. |
| Static room preview in `room-canvas.tsx` and `static-room-canvas.tsx` | Scene presentation and WebGL fallback | **Keep**, then **adapt** | Procedural floor/bounds, controls, and fallback work, but customer-space images and actual asset models are future work. |
| Editor inspector and placed-item text list | Placement selection/properties | **Keep** | Accessible selection and metadata remain useful even when 3D rendering is added. |
| Save/Share buttons and initial loading/error UI | Project persistence and customer share flow | **Migrate later** | Existing controls are presentation placeholders; implement server persistence and scoped public sharing in dedicated issues. |
| Static home page in `src/app/page.tsx` | Public SceneFit entry | **Keep** for now | Portal/customer routes can be added without changing or removing the demo landing page. |
| Furniture-only labels and demo-specific copy | Business-configured language | **Remove later** from generic surfaces | Keep legacy `/design` copy until corresponding generic flows replace it; do not do a broad cosmetic rename in a feature issue. |

## Security and tenant-isolation gaps to close

1. Establish a server-verifiable user session and business membership with a defined role and business context; reject access to another business even when supplied IDs are valid.
2. Introduce tenant keys and ownership on every persisted catalogue, asset, project, scene, customer request, and eventual subscription. Scope queries and mutations on the server, with database RLS when Supabase is adopted.
3. Separate published customer-visible items/projects from private draft data and internal business management routes.
4. Authorize uploads and downloads by business and visibility; enforce allowed types, sizes, and safe asset delivery. Avoid exposing generated-provider credentials or privileged storage keys.
5. Validate and version server-accepted scene payloads. Current local hydration checks known seeded assets but does not establish business ownership or authorize an API write.
6. Issue revocable, non-guessable share access for a specific customer visualization and ensure public endpoints never leak private business/customer data.
7. Enforce subscriptions/entitlements on server-owned operations before opening multi-business access; payments can follow an explicitly limited manual development state.

## Recommended next implementation sequence

| Order | Slice | Dependency and stop point |
| --- | --- | --- |
| 1 | Define vertical-neutral Zod domain contracts and a seeded furniture adapter. | Preserve existing editor and `SceneDataV1`; prove identifiers, dimensions, pricing, and asset-state mapping in tests. |
| 2 | Build the responsive business portal shell and generic dashboard. | Consume seed/view-model data only; present portal routes as development surfaces until auth exists. |
| 3 | Build generic catalogue browsing and add/edit form contracts. | Reuse the adapter; label any temporary/non-persistent submit behavior honestly. |
| 4 | Specify and implement business identity, membership/roles, tenant-scoped persistence, and storage. | Review actual database/RLS configuration when introduced; validate cross-business denial before real customer/business data is accepted. |
| 5 | Add image/digital-asset upload or generation integration and review/ready/failure states. | Keep provider credentials on the server and verify asset ownership. |
| 6 | Add visualization projects, real customer spaces, and an editor integration using a versioned scene evolution plan. | Keep the v1 demo working; prove saved project ownership and recovery. |
| 7 | Build published customer share/compare and quote/enquiry follow-up. | Verify public visibility boundary and link revocation. |
| 8 | Add entitlement management and, after the complete workflow works, payment integration. | Gate subscription operations server-side; verify billing webhooks when added. |

Proceed through these as separate reviewable issues/PRs. Reassess assumptions at the end of the generic portal/catalogue phase, particularly the absence of an existing backend and the choice of tenant persistence/storage.
