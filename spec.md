# SceneFit — Product and Technical Specification

**Status:** Draft v1.0  
**Audience:** Founders, product owner, coding agents, reviewers  
**Product:** SceneFit  
**Positioning:** Vertical-agnostic visual commerce and spatial visualization  
**Architecture:** Modular Next.js monolith

---

## 1. Product thesis

SceneFit is the visual layer between a business's offering and its customer's real-world environment.

The core loop is:

```text
Business offering + customer environment
                ↓
       Visualize and configure
                ↓
          Save and share
                ↓
      Enquire, quote, book, or buy
```

SceneFit is not a furniture-only application, a room-design application, a floor-plan tool, or CAD software. Furniture is the initial demonstration content, but the core architecture must also support events, interiors, offices, hospitality, retail, real estate, kitchens, landscaping, automotive, and other visual businesses.

The product promise is:

> Bring your offering into your customer's world.

## 2. Product principles

1. **Vertical-agnostic engine, business-specific experience.** The platform uses generic concepts; each business's catalogue, branding, categories, pricing, and call to action make the experience specific.
2. **The customer's real environment is the hero.** The interface should help users understand an offering in context, not teach them professional 3D software.
3. **Canva-simple, Spline-capable, commerce-oriented.** Manipulation should feel direct and approachable, while the journey ends in a meaningful customer action.
4. **Progressive capability.** A catalogue item may be image-only, 3D-ready, processing, failed, or awaiting review.
5. **Reuse before replacement.** Existing schemas, APIs, storage, authorization, and working editor foundations must be audited and mapped before new equivalents are introduced.
6. **MVP discipline.** Build the smallest complete visual-commerce loop. Do not pre-build CAD, AR, a foundation AI model, complex CRM, checkout, or industry-specific platforms.

## 3. Canonical domain language

Core code and new persisted contracts should prefer these terms:

| Concept | Meaning |
| --- | --- |
| `Business` | The company using SceneFit |
| `Catalog` | A business-owned collection of offerings |
| `CatalogItem` | A product, service, package, or spatial offering |
| `DigitalAsset` | A 2D image, 3D model, thumbnail, texture, or related asset |
| `AssetVariant` | A visual or configurable variation of an asset |
| `VisualizationProject` | A customer-specific visualization container |
| `Space` | The customer's real environment or environment representation |
| `Scene` | The visual state for a project |
| `Placement` | One placed instance of a catalogue item/digital asset |
| `CustomerRequest` | A quote, enquiry, callback, booking, or other action request |
| `Lead` | A business follow-up record derived from customer activity |

Avoid introducing new core concepts named `FurnitureProduct`, `FurnitureRoom`, `SofaPosition`, or other vertical-specific variants. UI copy may use vertical-specific language when it comes from business configuration.

### Compatibility rule

The repository currently contains furniture-oriented demo modules and a `SceneDataV1` contract with `roomId` and `placedAssets`. Do not perform a broad rename or destructive schema migration merely to match this document. Preserve working behaviour and introduce generic boundaries incrementally. Any schema evolution must be versioned, tested, and backwards compatible or accompanied by an explicit migration plan.

## 4. Users and experiences

### Business user

The business user manages catalogue items and digital assets, creates customer visualizations, shares them, and follows up on requests.

### Customer

The customer opens a business-branded link, sees an offering inside a real environment, explores or configures the result, compares it with the original, and submits a request.

### Internal operator

During early MVP stages, an internal operator may seed data, inspect failed asset jobs, and assist with content. Do not build a complex administration suite for this role.

## 5. End-to-end MVP journey

### Business journey

1. Create or access a business profile.
2. Create or import a catalogue.
3. Add a catalogue item and upload images.
4. Optionally upload or request generation of a digital asset.
5. Review the asset status.
6. Create a visualization project.
7. Upload a real customer-space image.
8. Open the visual editor.
9. Select catalogue items and place/configure them.
10. Save and share the visualization.
11. Receive a customer request and follow up.

### Customer journey

1. Open the business-branded shared experience.
2. See the customer's real environment.
3. Browse approved catalogue items.
4. Place and configure offerings.
5. Compare the original and visualized states.
6. Save or share where enabled.
7. Request a quote or submit an enquiry.

The MVP primary action is `REQUEST_QUOTE` or `ENQUIRE`. The action model must remain extensible to callback, consultation, booking, purchase, and contact actions without implementing them now.

## 6. Core screens and routes

The initial product should remain focused. The core business/customer experience is six screen families, implemented through the following routes:

| Screen family | Routes | Purpose |
| --- | --- | --- |
| Business dashboard | `/dashboard` | Summary, recent projects, recent requests, primary actions |
| Product library | `/catalog`, `/catalog/new`, `/catalog/[id]` | Manage catalogue items and digital-asset readiness |
| Visualization projects | `/projects`, `/projects/new` | Create and manage customer-specific projects and spaces |
| Visualization editor | `/projects/[projectId]/editor` | Place and configure catalogue items in a space |
| Customer share/view | `/design/[projectId]` | Business-branded customer experience and compare flow |
| Leads/quotes | `/leads`, `/leads/[id]` | Review customer requests and follow-up status |

Future branded routing may use `/b/[businessSlug]` and `/b/[businessSlug]/design/[projectId]`.

Do not create vertical routes such as `/furniture`, `/sofas`, or `/living-room` as platform primitives.

## 7. Screen requirements

### 7.1 Business dashboard

- Vertical-neutral navigation: Dashboard, Catalog, Projects, Leads, Settings.
- Primary actions: **New visualization** and **Add catalog item**.
- Summary metrics: projects, catalogue items, digital assets, and customer requests.
- Recent visualizations and recent customer requests.
- Action-oriented empty states.

### 7.2 Product library

- Search, configurable category filter, and digital-asset status filter.
- Responsive grid/list of catalogue-item cards.
- Each card shows thumbnail, name, category, price representation, asset status, preview, and edit action.
- Asset states: `NO_ASSET`, `QUEUED`, `PROCESSING`, `NEEDS_REVIEW`, `READY`, `FAILED`, and `ARCHIVED` where applicable.
- Categories are business data, not hard-coded platform enums.
- Currency and pricing format are configurable; never hard-code AED in core components.

### 7.3 Add/edit catalogue item

- Name, description, category, type, SKU/reference.
- Flexible pricing: fixed, starting from, per unit/time/area/event, custom quote, or hidden.
- Optional dimensions and availability metadata.
- Multi-image upload with useful progress and validation.
- Optional digital-asset generation request or manual asset upload.
- Image-only items remain valid.
- Generation provider details and API credentials remain server-side.

### 7.4 Visualization project creation

- Project name and optional customer details.
- Configurable space type.
- Upload a real environment image.
- Clear processing, failure, retry, and replacement states.
- Create the project before opening the editor.

### 7.5 Visualization editor

The editor mental model is `Space + Catalog + Scene + Placements`.

Desktop layout:

- Top bar: back/project, undo, redo, save, share, and preview.
- Left panel: searchable/filterable catalogue.
- Centre: the real customer environment and visual scene.
- Right panel: selected placement properties and actions.
- Compare controls: Original, Visualized, Compare, Reset.

Core editor actions:

- Add a catalogue item to the scene.
- Select a placement.
- Move, rotate, and scale where the asset/project policy allows it.
- Duplicate and delete.
- Change a supported variant.
- Save and recover from save failure without losing local work.

The current furniture demo constrains movement to X/Z, rotation to Y, and disallows arbitrary scale. Preserve those constraints until a later versioned scene/placement contract explicitly supports generic scaling safely.

### 7.6 Customer experience

- Business identity, not internal SaaS chrome.
- Real environment and visualized result are primary.
- Approved catalogue and selected items.
- Responsive-first controls with large touch targets, horizontal item browsing, drawers/bottom sheets, and minimal technical language.
- Original/Visualized/Compare interaction.
- Quote/enquiry form with clear success and failure states.

### 7.7 Customer requests

- Generic table/list: customer, project, selected items, value, status, and date.
- Detail view with visualization, request message, contact details, selected items, and follow-up status.
- Suggested statuses: `NEW`, `CONTACTED`, `QUOTED`, `CONVERTED`, `CLOSED`.

## 8. Conceptual data model

Adapt these entities to the repository and existing backend; do not blindly create duplicate tables.

```text
Business
  └─ Catalog
      └─ CatalogItem
          ├─ DigitalAsset
          └─ AssetVariant

VisualizationProject
  ├─ Customer
  ├─ Space
  ├─ Scene
  │   └─ Placement[]
  └─ CustomerRequest[]
```

### Catalogue item

Conceptual fields include `id`, `businessId`, `name`, `description`, `category`, `type`, `sku`, pricing, dimensions, images, digital assets, variants, metadata, availability, and status.

`CatalogItem` and `DigitalAsset` are separate concepts. One item may have no asset, multiple images, a 3D model, variants, or future generated media.

### Placement

```ts
type Placement = {
  id: string;
  catalogItemId: string;
  digitalAssetId?: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
  variantId?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
};
```

This is a conceptual future-facing shape, not authorization to mutate `SceneDataV1` inside an unrelated issue.

### Scene

```ts
type Scene = {
  id: string;
  projectId: string;
  backgroundAsset?: DigitalAssetReference;
  placements: Placement[];
  camera?: CameraState;
  lighting?: LightingState;
  settings?: Record<string, unknown>;
};
```

Persisted schemas are versioned and validated with Zod. Hydration must be atomic. Unsupported versions and unknown assets return structured errors.

## 9. Digital-asset lifecycle

The frontend must be provider-neutral. A backend service may expose actions such as `requestDigitalAssetGeneration()` while delegating to Meshy, Tripo, or another provider.

- Secret keys never enter client code.
- Long-running work is represented as a job/status, not a blocking request.
- Users can retry failures and review generated output.
- Full assets are loaded only when required.
- GLB/glTF is the preferred 3D delivery format for the current engine.
- The MVP does not train or host its own 3D foundation model.

## 10. Technical architecture

### Approved stack

- Next.js, React, and strict TypeScript.
- Tailwind CSS and shadcn/ui primitives.
- Lucide React icons.
- Three.js, React Three Fiber, and Drei.
- Zustand for editor state.
- Zod for runtime contracts.
- Supabase Postgres and Storage where the existing backend uses them.
- Vercel hosting target.
- `pnpm` package management.

Use one modular Next.js application. Add separate services or workers only when a concrete long-running integration requires them.

### Feature boundaries

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

Existing `features/assets` code may remain until migrated deliberately. New generic business logic should not be added to a furniture-specific module merely because it already exists.

### Frontend/backend boundary

Frontend owns UI, navigation, forms, local editor interaction, rendering, and loading/error presentation. Backend owns authentication, authorization, persistence, storage, asset-generation orchestration, projects, scenes, placements, customer requests, and business data.

## 11. Security and tenancy

- A business may access only its own catalogue, assets, projects, and requests.
- A customer may access only the public visualization authorized by its share link.
- Audit existing Supabase Row Level Security before changing policies.
- Never expose service-role or provider credentials to the browser.
- Treat names, metadata, uploads, and request messages as untrusted input.
- Validate upload type/size and persisted scene data server-side.
- Public share identifiers must be non-guessable and revocable where supported.

Authentication and full multi-tenant enforcement must be complete before the product is represented as production-safe for multiple businesses.

## 12. Performance and accessibility

- Lazy-load 3D assets; never load an entire catalogue of models eagerly.
- Use thumbnails in browsing surfaces.
- Compress images and optimize GLB/glTF assets.
- Use progressive loading and useful status messages.
- Debounce autosave and avoid server writes during pointer movement.
- Avoid React state updates on every animation frame.
- Keep standard controls keyboard-accessible with visible focus.
- Provide labels for icon-only controls and textual alternatives for the canvas.
- Colour cannot be the only selection or status indicator.
- Respect reduced-motion preferences.

## 13. Design direction

SceneFit should feel premium, minimal, modern, visual, professional, simple, and fast.

Avoid excessive gradients, neon/gamer aesthetics, heavy glassmorphism, huge shadows, tiny controls, technical jargon, clutter, and decorative animation. Business screens are desktop-first; the public customer experience is responsive-first. Do not compress a complex desktop editor into a tiny mobile three-column layout.

## 14. Required states

Every primary surface needs intentional loading, empty, failure, and recovery behaviour.

Examples:

- **Catalog:** “No catalog items yet” with **Add catalog item**.
- **Projects:** “No visualizations yet” with **Create visualization**.
- **Requests:** “No customer requests yet.”
- **Asset generation failed:** **Try again**.
- **Space processing failed:** **Upload another**.
- **Save failed:** preserve local work and offer **Try again**.
- **WebGL unavailable:** keep the surrounding application and textual scene information usable.

Do not expose raw stack traces or provider internals to normal users.

## 15. MVP scope

The MVP proves this complete loop:

1. A business adds a catalogue item and an image.
2. The item receives an uploaded or externally generated digital asset.
3. The business creates a visualization and uploads a real customer-space image.
4. The business places and configures an asset in the editor.
5. The project is saved and shared.
6. The customer opens the branded experience, compares the result, and submits a quote/enquiry request.
7. The business sees and follows up on the request.

### Explicitly deferred

- Full CAD, BIM, architectural drawing, or complex floor planning.
- An in-house AI 3D foundation model.
- Depth estimation, surface detection, perspective matching, occlusion, and lighting estimation unless separately approved.
- AR, VR, 360 environments, and video visualization.
- Complex product configuration, dynamic pricing, packages, and bundles.
- Checkout, billing, ERP, full CRM, enterprise analytics, and real-time collaboration.
- Dozens of vertical-specific workflows or separate industry codebases.

## 16. Delivery phases

Preserve already merged foundations, but align new work to these phases. Each phase ends with testing, browser verification, and a stop/report point.

### Phase 0 — Alignment and repository audit

- Adopt this product language and document legacy mappings.
- Audit routes, schemas, Supabase, storage, APIs, auth, existing components, and completed editor work.
- Decide whether open furniture-specific issues should be generalized, deferred, or closed.
- Do not rewrite working features merely for naming consistency.

### Phase 1 — Generic platform foundation

- App shell and vertical-neutral navigation.
- `/dashboard`.
- `/catalog`, `/catalog/new`, and `/catalog/[id]`.
- Generic catalogue-item UI, configurable categories, pricing presentation, and asset states.
- Reuse the existing seeded catalogue through an adapter if backend persistence is not ready.
- Stop after the phase and report gaps before starting digital-asset integration.

### Phase 2 — Digital assets

- Provider-neutral generation/upload contract.
- Processing, review, ready, and failure states.
- 3D preview and optimized GLB/glTF loading.

### Phase 3 — Visualization projects

- `/projects` and `/projects/new`.
- Project, customer, space image, metadata, and editor entry flow.

### Phase 4 — Visualization editor

- `/projects/[projectId]/editor`.
- Real environment, catalogue, scene placements, transforms, duplicate/delete, properties, save, and controlled autosave.
- Generalize the existing `/design` editor foundation without discarding tested store and serialization work.

### Phase 5 — Customer experience

- `/design/[projectId]`.
- Business branding, approved catalogue, visualization, selected items, and compare interaction.

### Phase 6 — Customer requests

- `/leads` and `/leads/[id]`.
- Quote/enquiry submission, request status, selected items, visualization context, and follow-up.

## 17. Testing and verification

Required checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- Add unit tests for contracts, schemas, adapters, stores, serialization, and pure editor helpers.
- Add component tests for visible business/customer behaviour and all critical states.
- Add API tests for validation, authorization, ownership, and structured errors.
- Add end-to-end coverage for the catalogue → project → editor → share → request loop as those phases land.
- UI and 3D changes require real-browser verification at relevant desktop/mobile sizes and browser-console inspection.
- Never claim visual or interactive verification when it could not be completed.

## 18. Definition of done

A phase or issue is complete only when:

- Acceptance criteria are satisfied without unrelated scope.
- Domain language follows this specification or an explicit compatibility mapping is documented.
- Loading, empty, failure, and recovery states exist where relevant.
- Runtime inputs are validated and tenant/security boundaries are preserved.
- Relevant automated tests pass.
- Lint, typecheck, test, and build pass.
- UI/3D behaviour is verified in a real browser.
- Documentation and public contracts are updated when behaviour changes.
- The PR reports exact files, checks, screenshots, limitations, and deferred work.

## 19. Decision hierarchy

When instructions conflict:

1. Latest explicit human-maintainer instruction.
2. An approved issue that intentionally changes product scope.
3. This specification.
4. `AGENTS.md`.
5. Existing conventions and implementation.

Do not use an ambiguous issue as permission to invent product behaviour or duplicate backend structures.
