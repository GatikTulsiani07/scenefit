# Issue #46 product-image upload blocker

**Branch:** `issue-46-product-image-upload`  
**Decision:** Block the upload implementation until authentication, tenant ownership, and approved storage boundaries exist.  
**Scope:** This report audits the current checkout and records the smaller prerequisite issues. No upload endpoint, persistence, image-serving path, or upload UI was added.

## Prerequisite audit

| Boundary | Evidence in this checkout | Consequence for Issue #46 |
| --- | --- | --- |
| Authentication and business identity | `src/features/business/portal-shell.tsx:44` renders a literal “Demo business” label and `:58` renders a “Demo account” placeholder. `src/lib/env.ts:3-10` validates only `NODE_ENV` and optional `NEXT_PUBLIC_APP_URL`. There is no middleware, session code, sign-in route, identity provider, membership lookup, or auth dependency. | The demo label is not an authenticated principal and cannot authorize an upload. |
| Catalogue/item ownership | `src/features/catalog/contracts.ts:76-90` gives a `CatalogItem` an `id` and `catalogId`, but no business/owner scope. `src/features/catalog/legacy-furniture-adapter.ts:50-75` creates the in-memory seeded catalogue under `seeded-furniture-catalog` and explicitly keeps image/model paths as `digitalAsset.status: 'no_asset'`. The catalog routes only adapt this seed (`src/app/(portal)/catalog/page.tsx:5-6`; `src/app/(portal)/catalog/[id]/page.tsx:7-12`). | There is no server-verifiable relationship between an authenticated business, a catalogue, an item, and an image. A client-supplied business or item ID would not prove ownership, and cross-business access cannot be rejected. |
| Server and persistence boundary | `find src/app -name route.ts` returns no API route; the repository has no server action, database client, migration, repository, Supabase configuration, or storage client. The existing architecture audit records the same absence in `docs/architecture/current-state-audit.md:38-43`. | There is nowhere to enforce authorization before a write or read, and nowhere approved to persist image metadata. |
| Image storage and delivery | The seeded values are application-relative strings (`src/features/catalog/legacy-furniture-adapter.ts:69-74`), not stored files. `src/features/catalog/product-library.tsx:39-48` renders an accessible placeholder and keeps the path only in `data-thumbnail-url`; it does not load an image. No bucket, signed URL, private delivery route, or tracked public image asset exists. | An upload would either be publicly writable, fake persistence, or expose an unapproved file path. None is acceptable for this issue. |
| Add/Edit write path | `/catalog/new` passes a seeded catalog ID to the client form (`src/app/(portal)/catalog/new/page.tsx:3-7`). The edit route finds an item in a newly adapted in-memory seed (`src/app/(portal)/catalog/[id]/page.tsx:7-12`). `CatalogItemForm` defaults to `developmentSubmit` (`src/features/catalog/catalog-item-form.tsx:31-33,63`) and reports “Valid payload prepared. Nothing has been permanently saved.” (`:88-100`). Payload construction is local and contract-validated in `src/features/catalog/catalog-item-form-data.ts:77-133`. | There is no persisted item or image mutation to attach an upload to. A success message claiming a stored image would be misleading; failure/retry cannot be connected to a real storage operation yet. |

## Blocking conclusion

Issue #46 cannot safely proceed in this repository. The current “business” is demo copy, not authentication; the seeded `catalogId` and item ID are not ownership proofs; and no server-enforced storage or image-delivery boundary exists. I therefore did not add a public upload endpoint, client-only ownership check, fake persistent image, or misleading success state. `SceneDataV1` and `/design` remain untouched.

## Ordered prerequisite issues

1. **Authenticate the business user and resolve membership.** Add a server-verifiable session boundary, business membership/role model, and structured unauthenticated/forbidden responses. Prove the request business context from the session, never from a client-supplied `businessId`.
2. **Persist tenant-scoped catalogues and items.** Add business ownership to the persisted `Catalog`/`CatalogItem` records, a repository boundary, and server-side queries/mutations scoped by the authenticated business. Add cross-business denial tests and RLS when the approved database is introduced.
3. **Establish approved private storage and delivery.** Configure the chosen server-side storage boundary, private bucket/path policy, ownership metadata, and signed or authorized image delivery. Keep privileged credentials server-only; define deletion/replacement and orphan cleanup semantics.
4. **Connect the digital-asset contract to persisted image records.** Add an image asset/reference repository that links a stored asset to exactly one owned catalogue item, records status and approved file metadata, and preserves `no_asset` for unverified legacy paths. Add ownership and association tests.
5. **Implement the upload operation.** Add a server endpoint or action that authenticates first, authorizes the target item, validates byte size and actual file content/MIME, stores through the approved boundary, and returns structured progress/success/failure results with retry-safe behavior.
6. **Integrate Add/Edit and Product Library.** Only after steps 1–5, add real progress, failure/retry, replacement behavior, stored-thumbnail loading, and an accessible image-error fallback. Verify desktop/mobile interactions and browser-console output before calling the issue complete.

Until steps 1–4 exist, Issue #46 should remain blocked rather than introducing an upload flow that cannot prove who owns the target item or image.
