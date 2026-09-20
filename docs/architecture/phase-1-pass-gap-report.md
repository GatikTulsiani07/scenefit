# SceneFit Phase 1 pass/gap report

**Issue:** #44 — Audit Phase 1 and define the digital-asset handoff  
**Branch:** `issue-44-phase-1-audit`  
**Audit basis:** source and tests in this checkout, `spec.md`, and Issue #44.  
**Browser environment:** no controllable browser was exposed (`browsers: []`). Browser and console observations below are therefore explicitly unverified.

## Executive summary

The four requested business routes exist and are connected to the shared portal shell. `/dashboard` renders deterministic demo data. `/catalog` adapts the ten seeded legacy records into the generic `Catalog`/`CatalogItem` contract and provides search, derived categories, combined status filters, counts, cards, and intentional states. `/catalog/new` and `/catalog/[id]` share the client-side `CatalogItemForm`; the dynamic edit route looks up the URL ID in the adapted demo catalogue and renders an explicit not-found state when it is absent.

The Phase 1 surfaces are development-only. There is no database, repository, API, authentication, storage, upload, or generation provider. A form submission validates and prepares a payload through `catalogItemSchema`; the UI explicitly says it is not permanently saved. The legacy adapter places `thumbnailUrl` and `modelUrl` inside a `digitalAsset` reference with `status: 'no_asset'`. Those paths are metadata and are not evidence that an image/model is uploaded, downloadable, reviewed, or ready.

## Route audit

| Route | Evidence | Passes | Gaps / boundary |
| --- | --- | --- | --- |
| `/dashboard` | `src/app/(portal)/dashboard/page.tsx:5-6` → `BusinessDashboard`; deterministic view model in `src/features/business/dashboard-view-model.ts`. | Welcome, metrics, recent activity, quick-action links, populated/empty/loading/error UI. `src/features/business/dashboard.test.tsx` covers metrics, activity, destinations, headings, and all states. | Demo-only records; no repository/API request, live analytics, persistence, or browser verification in this environment. |
| `/catalog` | `src/app/(portal)/catalog/page.tsx:5-6` → `adaptSeededFurnitureCatalogue()` → `ProductLibrary`. | All ten adapted items; search by name/SKU/category; data-derived categories; combined filters; count; cards; Add Product link; empty/no-results/loading/error states. Pure logic is in `src/features/catalog/product-library-data.ts`; UI evidence is in `product-library.test.tsx` and `product-library-data.test.ts`. | Seeded in memory; placeholder images; the Edit action uses the implemented shared Add/Edit route; Preview is explicitly unavailable. No persistence, upload, ready asset, or browser verification. |
| `/catalog/new` | `src/app/(portal)/catalog/new/page.tsx:3-7` → `CatalogItemForm mode="new"`. | Generic defaults, labels/required indicators, pricing variants, optional dimensions, publication status, image placeholder, asset-status display, inline errors, Cancel, unsaved-state indicator, valid-payload result, and non-persistence notice. `catalog-item-form*.test.*` covers the contracts and rendered states. | The default development submit adapter does not save. No upload or asset-generation action is present by design. Browser interaction and console are unverified. |
| `/catalog/[id]` | `src/app/(portal)/catalog/[id]/page.tsx:7-12` awaits `params`, adapts the seed catalogue, calls `findCatalogItemById`, and selects `ready` or `not_found`. | Implemented Add/Edit route: existing IDs populate the shared edit form; unknown IDs show “Product not found”; edit payload preservation and validation are tested. | No persisted edit, authorization, or reload survival. Browser interaction and console are unverified. |

The shared shell is `src/features/business/portal-shell.tsx`; its navigation marks `/catalog` and `/catalog/[id]` as the Product Library section. The editor remains separate: `src/features/editor/editor-shell.tsx` imports `SeededFurnitureCataloguePanel` from `src/features/assets/furniture-catalogue-panel.tsx`, so the Product Library does not replace or mutate the `/design` catalogue.

## CatalogItem and digital-asset trace

1. **Generic contract.** `src/features/catalog/contracts.ts:15-24` defines publication and digital-asset statuses. `pricingSchema` (`:26-47`) supports fixed, starting-from, custom-quote, and hidden pricing. `dimensionsSchema` (`:49-56`) requires finite positive width/height/depth plus a unit. `digitalAssetReferenceSchema` (`:58-74`) permits an optional `assetId`, `thumbnailUrl`, and `modelUrl`, but requires `assetId` once status is not `no_asset`. `catalogItemSchema` (`:76-90`) owns identity, description, category, SKU, pricing, dimensions, digital-asset reference, and opaque metadata.
2. **Legacy adapter.** `src/features/catalog/legacy-furniture-adapter.ts:46-76` maps each legacy `FurnitureAsset` into a generic `CatalogItem`. It keeps stable IDs/SKUs and dimensions, maps the legacy price into an AED fixed-pricing value, and sets `digitalAsset.status` to `no_asset` while copying legacy thumbnail/model paths. The adapter comment at `:69` is an explicit warning that these paths are not evidence of a downloadable or ready asset. `adaptSeededFurnitureCatalogue()` (`:88-93`) validates the resulting catalog. `legacy-furniture-adapter.test.ts:13-45` proves all seeded records and those path/status mappings.
3. **Catalogue display.** `src/features/catalog/product-library-data.ts:24-25` treats a missing reference as `no_asset`; `product-library.tsx:39-48` renders an accessible image placeholder and retains the path only as a data attribute; `:59-74` displays name, category, SKU, price, publication badge, and digital-asset badge. The UI never turns a legacy path into a ready status.
4. **Add/Edit form.** `src/features/catalog/catalog-item-form-data.ts:41-57` maps existing items into editable values. `:78-106` builds a contract-shaped candidate; `:108-151` validates it with `catalogItemSchema`, including pricing and dimensions, then maps nested Zod failures to inline fields. For edits, `existingItem` metadata and digital-asset fields are merged so non-edited metadata, asset IDs, thumbnail paths, and model paths survive. `src/features/catalog/catalog-item-form.tsx:88-102` handles submission and reports a valid prepared payload as not permanently saved.

## Explicit boundaries

### Catalogue item

A `CatalogItem` is the business-facing offering record: stable `id`/`catalogId`, name, optional description and SKU, business-defined category, publication status, pricing, optional dimensions, optional digital-asset reference, and opaque metadata. It is not a mesh, image file, upload job, scene placement, or customer request. The current form also captures `productType` in metadata because the generic contract intentionally keeps that field extensible rather than adding a furniture-specific schema field.

### Digital asset

A `DigitalAsset` is a separately owned visual artifact or artifact variant associated with a catalogue item: for example a product image, thumbnail, GLB/glTF model, or future texture. The current contract stores only a reference/status projection (`assetId`, `status`, optional paths); it does not prove storage ownership, content type, dimensions, review, or readiness. `ready` must mean a verified, usable asset after Phase 2 checks—not merely a non-empty URL.

### Upload

An upload is an authenticated, validated transfer of a user-selected file into business-owned storage. It needs file-type/size validation, ownership, safe naming, visibility rules, durable storage metadata, and a resulting asset reference. No upload exists in the current repository; the form’s image area is deliberately a placeholder.

### Generation job

A generation job is a provider-neutral, server-owned asynchronous unit of work that takes an authorized source/input and produces an asset candidate. It needs a job ID, queued/processing/succeeded/failed (and retry/review) lifecycle, idempotency/retry semantics, provider details kept server-side, and a link to the resulting `DigitalAsset`. It is not a blocking form submit and must not expose provider credentials. No job/provider/API exists in this checkout.

## Confirmed facts vs recommendations vs unverified checks

### Confirmed from code/tests

- The four routes, shared shell, generic Zod contracts, legacy adapter, Product Library, and shared Add/Edit form described above are present.
- The seeded catalog contains ten adapted records; their legacy image/model paths are retained under `digitalAsset` with `status: 'no_asset'`.
- Catalog search/filter/count logic is pure and tested, including combined filters and distinct empty/no-results states.
- Form defaults, edit population, required fields, pricing variants, dimensions, valid payloads, unknown IDs, unsaved indication, Cancel links, loading/error states, metadata/asset preservation, and sync/async submit failures are covered by tests.
- The form’s successful development result explicitly says the payload is prepared and not permanently saved.
- Existing editor tests continue to cover the `/design` furniture catalogue and editor states.

### Recommendations for Phase 2

- Keep `CatalogItem` and `DigitalAsset` separate; add a versioned asset metadata contract rather than promoting legacy paths to readiness.
- Add a server-side repository boundary with business ownership before accepting real item or asset writes.
- Add storage-backed upload records and signed/authorized delivery; validate MIME/type, byte size, dimensions, and ownership.
- Model generation as an asynchronous provider-neutral job with explicit lifecycle, retry/idempotency, review, and failure reason fields.
- Transition an item from `no_asset`/processing to `ready` only after server verification of the stored artifact and required metadata.
- Keep the existing `/design` adapter working while introducing a generic asset projection for future editor consumers.

### Browser/console checks unverified

A development-server start was attempted for Issue #44 verification, but the computer-use inventory reported no browser surfaces (`browsers: []`), even though Chrome was listed as running. Consequently, each of the following remains **unverified**, with no pass claim:

- `/dashboard` at 1440×900 and 390×844; dashboard navigation.
- `/catalog` at both sizes; search and combined filters.
- `/catalog/new` at both sizes; invalid submission, valid submission result, unsaved-state messaging, and Cancel navigation.
- `/catalog/[id]` at both sizes using a real catalog ID; edit population, invalid/valid submission, unsaved state, Cancel navigation, and unknown-product state.
- Browser-console inspection for all relevant pages.
- `/design` interactive regression check.

Screenshot directory `/tmp/scenefit-issue44-verification/` was created, but it contains no screenshots because no browser surface was available. No screenshot path is claimed.

## Ordered Phase 2 sequence

1. **Contract and ownership:** finalize versioned `DigitalAsset` and asset-job schemas; add business ownership/authorization boundaries and repository interfaces while keeping the demo adapter.
2. **Storage and upload intake:** add server-side upload validation and business-owned storage metadata; return structured upload results without exposing privileged credentials.
3. **Asset processing job:** add a provider-neutral asynchronous job interface with queued/processing/succeeded/failed/review states, retry/idempotency, and safe error reporting. Start with a deterministic development adapter if a real provider is not approved.
4. **Verification and readiness:** verify stored image/GLB/glTF artifacts, create asset variants/thumbnails, and set `ready` only after checks pass. Preserve `no_asset` for legacy paths and unsupported/unverified files.
5. **Review and Product Library integration:** expose processing/review/failure/retry states in generic Product Library cards and the Add/Edit flow; keep provider details server-side.
6. **Editor handoff:** add a generic, authorized asset projection to the editor behind a compatibility adapter; do not change `SceneDataV1` or placement constraints in this Phase 2 slice.
7. **Verification gate:** add API/ownership tests and real-browser checks for upload progress, failure/retry, ready/not-ready display, and `/design` regression before moving to visualization projects.

No persistence, upload, generation provider, dependency, or unrelated UI change is included in this audit.
