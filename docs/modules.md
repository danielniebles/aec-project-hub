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

### Clientes (`/clientes`, `/clientes/[id]`)
Client list with search. Detail page shows client info cards, linked projects, and invoices.

**Components:**
- `ClientCard` — name, NIT, contact, email, payment term badge, project/invoice counts
- `ClientForm` — create client modal; payment terms select with conditional `fixedDay` input (1–28)

**API:**
- `GET /api/clients` — list with `?search=`, `?active=`
- `POST /api/clients`
- `GET /api/clients/[id]`
- `PATCH /api/clients/[id]`
- `DELETE /api/clients/[id]` — rejected if client has linked projects or invoices

---

### Facturas (`/facturas`, `/facturas/nueva`)
Invoice dashboard with KPI chips (Facturado / Recaudado / Vencido) and a full invoice table. New invoice form at `/facturas/nueva` with `?projectId=` prefill.

**Invoice lifecycle:**
```
draft → [Enviar] → sent → [Marcar pagada] → paid
                 ↘ overdue (set only by cron)
```
- **Enviar** — calls `POST /api/invoices/[id]/send`; sends `new_invoice` Resend template to `client.email`; sets `sentAt`; returns `suggestedProjectStatus: "closeout"` if project is in `execution`
- **Marcar pagada** — `PATCH /api/invoices/[id]` with `{ status: "paid" }`; sets `paidAt`
- **Notificar** — `POST /api/invoices/[id]/remind`; sends `payment_reminder` Resend template; enforces a 7-day cooldown via `reminderSentAt`; returns 429 with `nextAllowedAt` if in cooldown, 422 if client has no email
- **Delete** — only allowed on `draft` invoices

**Status suggestion pattern:** certain billing events return a `suggestedProjectStatus` that triggers an inline amber banner ("Actualizar estado" / "Ignorar"). The user must accept explicitly — no silent auto-transitions.

| Billing event | API endpoint | Project must be in | Suggested project status |
|---|---|---|---|
| Purchase Order added | `POST /api/projects/[id]/purchase-orders` | `prospect`, `design`, `permitting` | `execution` |
| Invoice sent | `POST /api/invoices/[id]/send` | `execution` | `closeout` |

**Components:**
- `InvoiceTableClient` — client component used by `/facturas/page.tsx`; receives `InvoiceItem[]` from Server Component; handles all row actions and inline reminder feedback
- `InvoiceStatusBadge` — draft=gray | sent=blue | paid=green | overdue=red | void=slate
- `InvoiceForm` — full-page form; client dropdown → project dropdown → optional PO dropdown; live due date preview using client-side `computeDueDate`; submits to `POST /api/invoices`
- `StatusSuggestionBanner` — inline amber banner used in both `BillingTab` and `InvoiceTableClient`

**API:**
- `GET /api/invoices` — `?clientId=`, `?projectId=`, `?status=`, `?dueBefore=`
- `POST /api/invoices` — computes `dueDate` from client payment terms; computes tax; auto-generates `internalRef` (INT-YYYY-NNN) atomically; defaults status to `draft`
- `GET /api/invoices/[id]`
- `PATCH /api/invoices/[id]` — rejects `status: "overdue"` (cron only); on `sent` returns `suggestedProjectStatus`
- `DELETE /api/invoices/[id]` — draft only
- `POST /api/invoices/[id]/send` — sends `new_invoice` email template; sets `status = "sent"`, `sentAt`
- `POST /api/invoices/[id]/remind` — 7-day-gated manual reminder; sends `payment_reminder` email template
- `POST /api/invoices/reminders` — cron route (Bearer `CRON_SECRET`); queries `status = sent AND dueDate ≤ today + 3 days AND (reminderSentAt IS NULL OR reminderSentAt < 7 days ago)`; sends `payment_reminder` to each eligible client; updates `reminderSentAt`; returns `{ sent, skipped, errors }`

**Cron schedule (`vercel.json`):** `0 13 * * 1-5` — weekdays at 13:00 UTC (8:00 AM Bogotá).

**Email templates (Resend):**
- `new_invoice` — invoice issued notification; variables: `contact_name`, `project_name`, `project_code`, `invoice_description`, `issue_date`, `due_date`, `total_amount`, `internal_ref`
- `payment_reminder` — payment reminder; variables: `contact_name`, `urgency_text`, `invoice_number`, `project_name`, `project_code`, `invoice_description`, `due_date`, `total_amount`, `internal_ref`; `urgency_text` is computed server-side (e.g. "vence mañana", "vence en 3 días")

**Facturación tab (project detail):** `BillingTab` renders inside `ProjectDetailClient` when the Facturación tab is active. Shows PO list + invoice list with the same row actions as `InvoiceTableClient`. Invoices are lazy-loaded via `GET /api/invoices?projectId=` on mount and reloaded after each mutation.

**Purchase Orders:**
- `GET /api/projects/[id]/purchase-orders`
- `POST /api/projects/[id]/purchase-orders` — returns `suggestedStatus: "execution"` if project is in `prospect | design | permitting`
- `DELETE /api/projects/[id]/purchase-orders/[poId]`

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
| `src/lib/email.ts` | Resend wrappers: `sendInvoiceSentEmail` (template `new_invoice`), `sendReminderEmail` (template `payment_reminder`) — both send directly to `client.email`; silent skip if email is null |
| `scripts/test-email.ts` | Manual email test script: `npx tsx scripts/test-email.ts <template_id>` — sends to hardcoded address with sample variables; no arg = plain HTML connectivity check |

---

## UI Conventions

- **Sidebar:** dark (`#1a1d23`), teal active item (`#0d9488`)
- **Modals:** `fixed inset-0 bg-black/40 backdrop-blur-sm` backdrop, white `rounded-2xl` panel
- **Icons:** `lucide-react` — `<Icon size={N} strokeWidth={1.75} />`. Do not use inline SVGs, emoji, or unicode symbols for functional icons.
- **Buttons:** primary = teal `#0d9488` with white text, secondary = white with `border-gray-200`
- **Type badges:** `material`=teal, `labor`=blue, `equipment`=gray, `transport`=purple
- **Status badges:** defined in `projectStatus.ts`
