# Modules & API Routes

## Stack

- **Framework:** Next.js 16 App Router (TypeScript)
- **ORM:** Prisma with PostgreSQL
- **Styling:** Tailwind CSS v4 (no component library — plain HTML + Tailwind)
- **DB:** PostgreSQL 16-alpine via Docker Compose (port 5433, container `aec_project_hub_db`)
- **Locale:** `es-CO`, currency COP

---

## Page Map

| Route | Module | Status |
|---|---|---|
| `/catalogo` | Resource catalog | Done |
| `/plantillas-apu` | APU list | Done |
| `/plantillas-apu/[id]` | APU detail & builder | Done |
| `/proyectos` | Project list | Done |
| `/proyectos/[id]` | Project detail + budget execution | Done |
| `/clientes` | Client list | Done |
| `/clientes/[id]` | Client detail (projects + invoices) | Done |
| `/facturas` | Invoice dashboard | Done |
| `/facturas/nueva` | New invoice form | Done |
| `/cotizaciones` | Quotations | Not started |
| `/proveedores` | Suppliers | Not started |
| `/gastos-generales` | General overhead | Not started |
| `/reportes` | Reports | Not started |

---

## Module Details

### Catálogo de Insumos (`/catalogo`)
Browse, search, and manage resources. Side panel shows price history per resource and allows adding new price records.

**Components:**
- `ResourceTable` — sortable list with type badges and active price
- `ResourcePricePanel` — side panel with price history cards (source-colored) and inline add form
- `ResourceForm` — create resource modal

**API:**
- `GET /api/resources` — list with `?search=`, `?type=`, `?category=` filters
- `POST /api/resources` — create resource
- `GET /api/resources/[id]/prices` — price history
- `POST /api/resources/[id]/prices` — add price record

---

### Plantillas APU (`/plantillas-apu`, `/plantillas-apu/[id]`)
Create and manage APU templates. Detail page shows resource lines, AIU inputs, and a live unit price summary.

**Components:**
- `APUForm` — create APU modal
- `APULineTable` — resource lines with qty, waste %, live unit price, line total
- `APUSummaryPanel` — dark panel showing direct cost, AIU breakdown, total unit price
- `AddLineModal` — search resources, set qty and waste %

**Unit price computation** happens client-side using live resource prices fetched with the APU. The same formula runs server-side during CostItem creation for snapshotting.

**API:**
- `GET /api/apu-items` — list (includes lines + resource prices for client-side price computation)
- `POST /api/apu-items` — create
- `GET /api/apu-items/[id]` — full detail with lines and resource prices
- `PUT /api/apu-items/[id]` — update AIU percentages and metadata
- `POST /api/apu-items/[id]/lines` — add resource line
- `DELETE /api/apu-items/[id]/lines?lineId=` — remove line

---

### Proyectos (`/proyectos`, `/proyectos/[id]`)
Project list with status filter cards. Detail page has tab navigation (Resumen, Presupuesto, Fases, Contratos) — only Presupuesto is built.

**Data fetching pattern:** `proyectos/[id]/page.tsx` is an async Server Component. It calls `getProject(id)` from `src/lib/data/projects.ts` directly (no HTTP fetch), wraps the result in `<Suspense>`, and passes the enriched project to `ProjectDetailClient` as a prop. Mutations use `router.refresh()` to re-run the server component and get fresh data.

**Components:**
- `ProjectCard` — status-bordered card with budget total and APU item count
- `ProjectForm` — create project modal
- `AddCostItemModal` — 3-tab modal: APU (pick template + qty), Insumo directo (pick resource + qty, no AIU), Manual (free-form description/unit/qty/cost). Replaces `AddAPUItemModal`.
- `AssignAPUModal` — APU picker shown when user clicks "Asignar APU" on a manual Varios item; updates description, unit, and re-snapshots price
- `CommitmentForm` — modal with "Gasto simple" / "Compromiso" toggle. Simple mode creates a commitment + a matching payment in one request (`fullyPaid: true`). Commitment mode creates the commitment only; payments are added later via PaymentForm
- `PaymentForm` — modal to add an abono to an existing commitment; shows pending balance as the max hint

**Budget ledger (Presupuesto tab):**
- Cost-ledger layout: commitments are primary rows, grouped under CostItem headers
- Summary chips: Presupuesto total | Comprometido | Pagado | Pendiente
- **APU group headers**: teal APU code pill, description, commitment count, progress bar, "Agregar" button
- **Varios section**: divider row + same group structure for APU-less items. Resource-linked items show a blue resource code pill; truly manual items show a gray "VARIOS" pill and an "Asignar APU" link
- Commitment rows: status badge (Pagado / Parcial / Pendiente), description, date, Comprometido / Pagado / Pendiente amounts, optional resource tag, actions (Abonar, delete)
- Payment sub-rows (expandable): numbered cards with date, amount, delete

**Server-side data function:** `src/lib/data/projects.ts → getProject(id)`
- Queries Prisma directly; enriches each commitment with `totalPaid`, `totalPending`, `status` (all `number`, Decimals converted)
- Enriches each costItem with `totalBudgeted`, `totalCommitted`, `totalPaid`, `totalPending`
- Returns project-level aggregates: `totalPresupuesto`, `totalComprometido`, `totalPagado`, `totalPendiente`
- Type exported as `ProjectDetail = Awaited<ReturnType<typeof getProject>>`

**API:**
- `GET /api/projects` — list with `totalBudgeted` and `totalCommitted` derived per project
- `POST /api/projects` — create
- `GET /api/projects/[id]` — full detail (kept for completeness; server component uses `getProject` directly)
- `POST /api/projects/[id]/cost-items` — create budget line; body: `{ mode: "apu"|"resource"|"manual", ... }`; snapshots unit price at creation
- `PATCH /api/projects/[id]/cost-items/[costItemId]` — assign APU to a Varios item; body: `{ apuItemId }`
- `DELETE /api/projects/[id]/cost-items?costItemId=` — remove budget line
- `POST /api/projects/[id]/commitments` — create commitment; body: `{ costItemId, description, date, totalCommitted, resourceId?, notes?, fullyPaid, paidDate }`
- `DELETE /api/projects/[id]/commitments?commitmentId=` — delete commitment (payments cascade)
- `POST /api/projects/[id]/commitments/[commitmentId]/payments` — add payment; body: `{ date, amount, notes? }`
- `DELETE /api/projects/[id]/commitments/[commitmentId]/payments?paymentId=` — delete a single payment

---

## Shared Utilities

| File | Purpose |
|---|---|
| `src/lib/prisma.ts` | Singleton Prisma client with dev hot-reload cache |
| `src/lib/format.ts` | `formatCOP(n)` — `es-CO` currency. `formatDate(s)` — `es-CO` short date |
| `src/lib/projectStatus.ts` | `STATUS_LABEL`, `STATUS_BADGE` (Tailwind classes), `STATUS_BORDER`, `TYPE_LABEL` maps |
| `src/lib/data/projects.ts` | `getProject(id)` — server-side Prisma query with full enrichment; called directly by Server Components |
| `src/lib/data/clients.ts` | `getClients(search?)`, `getClient(id)` — server-side client queries |
| `src/lib/data/invoices.ts` | `getInvoices(filters)` — server-side invoice queries for the dashboard |
| `src/lib/apu.ts` | `computeUnitPrice(apuItemId)` — shared helper; queries Prisma for APU lines + resource prices, applies AIU markup |
| `src/lib/billing.ts` | `computeDueDate(issueDate, client)` — payment term → due date; `generateInternalRef(tx, year)` — atomic INT-YYYY-NNN sequence |
| `src/lib/email.ts` | Resend wrappers: `sendInvoiceSentEmail`, `sendReminderEmail` — both send directly to `client.email` |

---

## UI Conventions

- **Sidebar:** dark (`#1a1d23`), teal active item (`#0d9488`)
- **Modals:** `fixed inset-0 bg-black/40 backdrop-blur-sm` backdrop, white `rounded-2xl` panel
- **Icons:** inline SVGs (no icon library installed). Do not use emoji or unicode symbols for functional icons.
- **Buttons:** primary = teal `#0d9488` with white text, secondary = white with `border-gray-200`
- **Type badges:** `material`=teal, `labor`=blue, `equipment`=gray, `transport`=purple
- **Status badges:** defined in `projectStatus.ts`
