# Issue #48 on-demand model preview blocker

**Decision:** Issue #48 remains blocked. This branch contains documentation only; it does not implement a preview.

The ten seeded furniture records contain legacy `modelUrl` strings, but the adapter explicitly stores them under `digitalAsset.status: 'no_asset'` (`src/features/catalog/legacy-furniture-adapter.ts:69-74`). Those paths are metadata, not approved files. No GLB/glTF files are tracked, and the repository has no storage bucket, signed or otherwise authorized delivery route, API, or authenticated business ownership boundary (`docs/architecture/current-state-audit.md:38-42`).

The existing Product Library and catalogue detail status UI therefore keep seeded references explicitly unavailable. There is no preview component, model loader, working Preview link, or loading, retry, WebGL, or cleanup lifecycle in this branch. A real preview requires an approved stored model, server-authorized delivery, and an authenticated owner/item association before an on-demand loader can be implemented.

No external model URL, credential, eager catalogue loading, placement control, persistence, or `/design` change was introduced. Desktop/mobile preview interaction, keyboard open/close, retry, WebGL, cleanup, and console checks are unverified and not applicable to this documentation-only change because no approved model, delivery boundary, or controllable browser is available. No screenshots are claimed.
