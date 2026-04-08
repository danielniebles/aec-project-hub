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

**Components:**
- `ProjectCard` — status-bordered card with budget total and APU item count
- `ProjectForm` — create project modal
- `AddAPUItemModal` — search APU templates, set quantity, preview total, add to budget
- `ExpenseForm` — log execution expense against a CostItem; optional resource mapping

**Budget table (Presupuesto tab):**
- Each row = one CostItem (APU code, description, unit, budgeted qty, unit cost, total budgeted, total executed, variance indicator)
- Rows are independently expandable (multiple can be open simultaneously)
- Expanded panel shows expense sub-table + "Agregar gasto" button per CostItem

**API:**
- `GET /api/projects` — list with `totalBudgeted` and `totalExecuted` derived per project
- `POST /api/projects` — create
- `GET /api/projects/[id]` — full detail: CostItems with APU lines + resources + expenses. Derives `totalBudgeted`, `totalExecuted`, `variance` per CostItem
- `POST /api/projects/[id]/cost-items` — add APU item to budget; snapshots unit price at creation
- `DELETE /api/projects/[id]/cost-items?costItemId=` — remove budget line
- `GET /api/projects/[id]/cost-items/[costItemId]/expenses` — list expenses
- `POST /api/projects/[id]/cost-items/[costItemId]/expenses` — log expense
- `DELETE /api/projects/[id]/cost-items/[costItemId]/expenses?expenseId=` — remove expense

---

## Shared Utilities

| File | Purpose |
|---|---|
| `src/lib/prisma.ts` | Singleton Prisma client with dev hot-reload cache |
| `src/lib/format.ts` | `formatCOP(n)` — `es-CO` currency. `formatDate(s)` — `es-CO` short date |
| `src/lib/projectStatus.ts` | `STATUS_LABEL`, `STATUS_BADGE` (Tailwind classes), `STATUS_BORDER`, `TYPE_LABEL` maps |

---

## UI Conventions

- **Sidebar:** dark (`#1a1d23`), teal active item (`#0d9488`)
- **Modals:** `fixed inset-0 bg-black/40 backdrop-blur-sm` backdrop, white `rounded-2xl` panel
- **Icons:** inline SVGs (no icon library installed). Do not use emoji or unicode symbols for functional icons.
- **Buttons:** primary = teal `#0d9488` with white text, secondary = white with `border-gray-200`
- **Type badges:** `material`=teal, `labor`=blue, `equipment`=gray, `transport`=purple
- **Status badges:** defined in `projectStatus.ts`
