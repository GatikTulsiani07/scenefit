# SceneFit

**Bring your offering into your customer's world.**

SceneFit is a subscription-based, multi-tenant B2B visual-commerce and spatial-visualization platform. SceneFit operates the software, APIs, asset-processing technology, hosting, and production infrastructure. Subscribed businesses receive isolated private portals where they manage products, digital assets, visualizations, branding, and customer requests.

Furniture is the current demonstration vertical, not the platform boundary. The same core model is intended to support events, interiors, offices, hospitality, retail, real estate, landscaping, automotive, and other visual businesses.

Each business can publish approved catalogue items to its own branded digital showroom. Customers browse that public experience, visualize offerings in context, compare results, and request a quote or submit an enquiry without seeing the business's internal portal.

## Product loop

```text
Catalog item → digital asset → customer space → visualization
             → save/share → quote or enquiry → business follow-up
```

## Core application

- Business dashboard
- Product/catalogue library
- Add item and generate/upload digital asset
- Visualization projects and editor
- Business-branded customer share experience
- Customer requests and lead follow-up
- Business branding, members, subscription, and usage settings

## Platform model

```text
SceneFit-operated SaaS platform
        ↓
Subscribed business workspace
        ↓
Private portal: catalog, assets, projects, leads
        ↓
Published branded digital showroom
        ↓
Customer visualization and quote/enquiry
```

Businesses do not operate SceneFit's provider APIs or receive secret credentials. Provider integrations, billing webhooks, infrastructure access, and privileged operations remain behind SceneFit's server boundary.

## Current status

The repository already contains a tested furniture-demo editor foundation: catalogue browsing, Zustand scene state, add/select flows, scene serialization/hydration, and a static React Three Fiber room canvas. New work must preserve those foundations while moving future platform contracts and UI language toward generic concepts such as `CatalogItem`, `DigitalAsset`, `Space`, `Scene`, `Placement`, and `CustomerRequest`.

The next delivery stage is Phase 0/1: repository and tenancy audit, a vertical-neutral application shell, dashboard, catalogue, and catalogue-item creation. Authentication, business membership, tenant isolation, and a manually managed development subscription state follow as the business-access foundation. Full payment integration comes only after the core workflow is proven.

## Technology

| Area | Technology |
| --- | --- |
| Application | Next.js, React, strict TypeScript |
| Interface | Tailwind CSS, shadcn/ui, Lucide React |
| 3D | Three.js, React Three Fiber, Drei |
| Editor state | Zustand |
| Validation | Zod |
| Database/storage | Supabase Postgres and Storage where configured |
| Hosting target | Vercel |
| Package manager | pnpm |

SceneFit uses a modular monolith: one deployable Next.js application with feature boundaries for business, catalogue, digital assets, projects, the editor, the customer experience, and customer requests.

## Access surfaces

- **SceneFit platform:** infrastructure, APIs, provider integrations, subscriptions, monitoring, and support.
- **Private business portal:** authenticated, role-based management of one business's catalogue, assets, projects, showroom, requests, team, and billing.
- **Public digital showroom:** branded customer experience containing only published, customer-visible content.

Initial business roles are Owner, Admin, Editor, and Viewer. Authorization must be enforced on the server, and every business-owned query must be tenant-scoped.

## Documentation

- [`spec.md`](./spec.md) — product thesis, domain language, MVP, routes, architecture, phases, and Definition of Done
- [`AGENTS.md`](./AGENTS.md) — implementation rules for coding agents and reviewers
- [`assets/scenefit-v1-architecture.png`](./assets/scenefit-v1-architecture.png) — legacy furniture-demo architecture; retain for historical context until replaced by a generic platform diagram

The assigned GitHub issue and `spec.md` are the implementation sources of truth. Agents must read `AGENTS.md` before making changes.

## Development workflow

1. Define one coherent issue with acceptance criteria and exclusions.
2. Audit existing implementations and backend contracts before adding new ones.
3. Work on a dedicated branch and keep the diff issue-scoped.
4. Add meaningful tests and run all required checks.
5. Verify UI/3D changes in a real browser and inspect the console.
6. Open a draft PR with exact verification and known limitations.
7. A human maintainer reviews and merges.

Required checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Security

- Never commit `.env` files, API keys, tokens, or service-role credentials.
- Provider and Supabase privileged operations remain behind the server boundary.
- Businesses must be isolated from one another's catalogues, assets, projects, and requests.
- Public visualization access must be explicitly authorized and non-guessable.
- Existing schemas and Row Level Security policies must be audited before changes.
- Subscription status and entitlements must be enforced server-side.
- Payment webhooks must be verified and idempotent when billing is implemented.

## Scope discipline

The MVP is a visual-sales workflow, not CAD or a full commerce suite. Do not build an in-house AI foundation model, AR/VR, complex floor planning, billing, a full CRM, or separate architectures for individual industries unless the specification and a dedicated issue explicitly authorize it.

Final architectural approval and merge authority remain with human maintainers.
