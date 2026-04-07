# AEC Project Hub — Project Setup & Coding Context

> **Purpose of this document:** Complete context for resuming development of the AEC Project Hub application. Everything gathered during discovery sessions with the client is captured here — data models, module specs, architecture decisions, and open questions. Read this fully before writing a single line of code.

---

## 1. Business Context

### Who is the client?
A small **family-owned AEC (Architecture, Engineering & Construction) firm** based in Colombia. They handle the full spectrum of project types:
- Architectural design only
- Construction execution
- Civil / infrastructure work
- Full design + build (end to end)

### Team size
4–8 people (core team, not counting subcontractors).

### How many projects at once?
Typically **1–3 active projects** simultaneously.

### Current tooling (what we are replacing)
- Excel spreadsheets for budgets (APU/presupuesto) and cost tracking
- Paper / physical documents for some contracts
- WhatsApp + memory for vendor/subcontractor coordination
- No formal cash flow forecasting
- No overhead allocation to projects

### Primary pain points (priority order)
1. **Cash flow uncertainty** — no visibility into when money comes in vs. goes out
2. **Budget drift** — actual costs disconnected from original APU/presupuesto
3. **Vendor & subcontractor management** — payment schedules not linked to project progress
4. **Overhead invisibility** — fixed company costs (rent, utilities, salaries) not tracked per project, hiding true profitability

---

## 2. Application Overview

**Name:** AEC Project Hub
**Type:** Web application (mobile-friendly, but desktop-first)
**Users:** Small internal team (no public-facing features needed at this stage)
**Language/Region:** Colombia — use COP currency formatting, Spanish labels preferred in UI (but this doc uses English for technical clarity)

### Core value proposition
A single platform that models **any client payment structure** (lump sum, milestone-based, calendar-based, % complete, acta de cobro, or combinations) and uses that model to generate a **real-time cash flow projection** — showing the gap between incoming payments and outgoing obligations weeks before it happens.

---

## 3. Modules

The application is organized into 7 modules. They are **tightly interconnected** — a change in a contract payment schedule ripples into cash flow automatically.

| # | Module | Core responsibility |
|---|--------|---------------------|
| 00 | **Price Catalog & Estimating** | Resource catalog, APU activity library, parametric quotation templates |
| 01 | **Projects** | Central hub for all project metadata, status, team, and timeline |
| 02 | **Contracts** | Client contracts with flexible payment plans |
| 03 | **Budget & Costs** | APU-based budgets, cost categories, actual vs. budgeted tracking |
| 04 | **Cash Flow** | Projected and actual cash flow across all projects + overhead |
| 05 | **Vendors & Subcontractors** | Vendor registry, sub contracts, POs, outgoing payment schedules |
| 06 | **Overhead** | Fixed company costs, optional allocation to projects, profitability reports |

### Build order (phased roadmap)

```
Phase 1 (~8 weeks) — MVP
  └─ Module 01: Projects
  └─ Module 02: Contracts + payment plans
  └─ Module 04: Cash flow dashboard

Phase 2 (~6 weeks)
  └─ Module 00: Price catalog, APU library, quotation templates
  └─ Module 03: Budget & cost tracking (APU import, actual vs budgeted)
              ↑ Module 00 feeds into Module 03 (quotation → project budget)

Phase 3 (~4 weeks)
  └─ Module 05: Vendors & subcontractors

Phase 4 (~3 weeks)
  └─ Module 06: Overhead allocation + true profitability

Phase 5 (~5 weeks)
  └─ Gantt scheduling + milestone-linked payment triggers
```

---

## 4. Data Models

### Key design principles
- The `PaymentScheduleItem` entity is the **heart of the cash flow system**. Its `trigger_type` field handles every payment plan variation the client uses.
- The `APUItem` entity is the **heart of the estimating system**. It links resources with quantities to produce a derived unit price.
- These two systems connect when a finalized quotation is imported into a project as `CostItem` rows.

---

### 4.1 Client

```
Client
├── id                UUID (PK)
├── name              string
├── type              enum: persona_natural | empresa
├── nit               string (Colombian tax ID)
├── contact_name      string
├── contact_email     string
├── contact_phone     string
├── address           string
├── created_at        timestamp
└── updated_at        timestamp
```

---

### 4.2 Project

```
Project
├── id                UUID (PK)
├── name              string
├── code              string (e.g. "PRY-2024-001", user-defined)
├── type              enum: architecture | construction | civil | design_build
├── status            enum: prospect | design | permitting | execution | closeout | closed
├── client_id         FK → Client
├── description       text (optional)
├── location          string
├── start_date        date (planned)
├── end_date          date (planned)
├── actual_start      date (nullable)
├── actual_end        date (nullable)
├── total_contract_value  decimal (sum of all linked contract values, derived)
├── total_budget      decimal (sum of all cost items, budgeted)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  ├── has many → Contract
  ├── has many → ProjectPhase
  ├── has many → CostItem
  └── assigned to many → User (team members)
```

**Project status flow:**
```
prospect → design → permitting → execution → closeout → closed
```

---

### 4.3 ProjectPhase (Milestones)

Phases represent logical stages of a project. They are also used as **payment triggers** in contracts.

```
ProjectPhase
├── id                UUID (PK)
├── project_id        FK → Project
├── name              string (e.g. "Diseño arquitectónico", "Estructura", "Acabados")
├── order             integer (display/sequence order)
├── planned_start     date
├── planned_end       date
├── actual_start      date (nullable)
├── actual_end        date (nullable)
├── completion_pct    decimal 0–100 (manually updated or derived)
├── status            enum: pending | in_progress | completed
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp
```

---

### 4.4 Contract

One project can have multiple contracts (e.g. separate contract per phase, or addendums).

```
Contract
├── id                UUID (PK)
├── project_id        FK → Project
├── client_id         FK → Client
├── contract_number   string (from the physical document)
├── title             string
├── total_value       decimal
├── currency          string (default: "COP")
├── payment_type      enum: lump_sum | milestone | percentage | calendar | mixed
├── signed_date       date
├── start_date        date
├── end_date          date
├── retention_pct     decimal (% retenido — common in Colombian construction, e.g. 5%)
├── iva_pct           decimal (IVA on services, typically 19% in Colombia)
├── notes             text
├── file_url          string (link to scanned contract document, optional)
├── status            enum: draft | active | completed | cancelled
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → PaymentScheduleItem
```

> **Important Colombian context:** Contracts often include:
> - `retention_pct` — a percentage withheld until project completion (fondo de retención/garantía)
> - `iva_pct` — VAT on professional services
> - `retefuente` — income tax withholding at source (common for professional fees)
> These affect the actual amounts received and need to be tracked.

---

### 4.5 PaymentScheduleItem ⭐ (Core entity — cash flow)

Each row represents ONE expected payment installment from the client.

```
PaymentScheduleItem
├── id                UUID (PK)
├── contract_id       FK → Contract
├── label             string (e.g. "Anticipo", "Acta 1", "Pago final")
├── amount            decimal (gross amount before retenciones)
├── net_amount        decimal (derived: amount minus retention and withholdings)
├── trigger_type      enum: (see below)
├── trigger_date      date (used when trigger_type = 'calendar_date')
├── trigger_phase_id  FK → ProjectPhase (used when trigger_type = 'milestone')
├── trigger_pct       decimal (used when trigger_type = 'completion_pct')
├── invoice_number    string (acta de cobro number, filled when submitted)
├── invoice_date      date (when the acta was submitted)
├── status            enum: pending | invoiced | approved | paid | overdue
├── expected_date     date (best estimate of when payment will arrive)
├── actual_paid_date  date (nullable, filled when payment confirmed)
├── actual_amount     decimal (nullable, what was actually received)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp
```

**trigger_type values:**
```
calendar_date   — payment due on a specific date (trigger_date required)
milestone       — payment due when a phase is completed (trigger_phase_id required)
completion_pct  — payment due when project reaches X% completion (trigger_pct required)
acta_submitted  — payment due when an invoice/acta is submitted (manual trigger)
upfront         — payment at contract signing (effectively calendar_date = signed_date)
```

---

### 4.6 CostItem (Budget line)

Represents one budgeted line in the project, one per APU activity.
Generated automatically from an approved Quotation (see Module 00) or entered manually.
Actuals are NOT stored here — they are derived from linked `ProjectExpense` entries.

```
CostItem
├── id                UUID (PK)
├── project_id        FK → Project
├── phase_id          FK → ProjectPhase (optional)
├── quotation_id      FK → Quotation (nullable — set if generated from a quotation)
├── apu_item_id       FK → APUItem (nullable — set if generated from a quotation)
├── category          enum: labor | materials | equipment | subcontractor |
│                          design_fees | admin_permits | transport | other
├── description       string
├── unit              string (e.g. "m²", "ml", "global", "hora", "mes")
├── quantity_budgeted decimal
├── unit_cost_budgeted decimal
├── total_budgeted    decimal (derived: quantity × unit_cost)
├── total_actual      decimal (derived: sum of linked ProjectExpense.total)
├── variance          decimal (derived: total_actual − total_budgeted; positive = over budget)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → ProjectExpense
```

---

### 4.6a ProjectExpense (Execution entry)

Each row is one real-world purchase or spending event recorded during project execution,
mapped back to a `CostItem` (APU budget line) so actuals can be compared to the budget.
Multiple expenses can map to the same `CostItem`.

```
ProjectExpense
├── id                UUID (PK)
├── project_id        FK → Project
├── cost_item_id      FK → CostItem    ← required: which APU budget line this consumes
├── resource_id       FK → Resource    ← optional: which specific resource was purchased
├── vendor_id         FK → Vendor      ← optional: who it was bought from
├── description       string           (e.g. "Compra cerámica Corona — factura 4521")
├── date              date             (when the purchase/expense occurred)
├── quantity          decimal          (nullable — not all expenses are quantity-based)
├── unit              string           (nullable)
├── unit_cost         decimal          (nullable)
├── total             decimal          (always required — the actual amount spent)
├── receipt_url       string           (optional — scan of invoice or receipt)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp
```

> **TODO #14:** Confirm whether a single expense can span multiple CostItems (e.g. one
> invoice covering materials for 3 APU activities). If yes, a split/allocation
> mechanism is needed. For now, assume one expense → one CostItem.
>
> **TODO #15:** Confirm if phase-level tracking is needed on ProjectExpense directly,
> or if inheriting the phase from the linked CostItem is sufficient.

---

### 4.7 Vendor / Subcontractor

```
Vendor
├── id                UUID (PK)
├── name              string
├── type              enum: subcontractor | supplier | consultant | equipment_rental
├── nit               string (Colombian tax ID)
├── specialty         string
├── contact_name      string
├── contact_email     string
├── contact_phone     string
├── address           string
├── notes             text
├── active            boolean (default: true)
├── created_at        timestamp
└── updated_at        timestamp
```

---

### 4.8 VendorContract

```
VendorContract
├── id                UUID (PK)
├── vendor_id         FK → Vendor
├── project_id        FK → Project
├── title             string
├── scope             text
├── total_value       decimal
├── contract_number   string
├── signed_date       date
├── start_date        date
├── end_date          date
├── status            enum: draft | active | completed | cancelled
├── notes             text
├── file_url          string (optional)
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → VendorPaymentItem
```

---

### 4.9 VendorPaymentItem

```
VendorPaymentItem
├── id                UUID (PK)
├── vendor_contract_id FK → VendorContract (nullable if standalone PO)
├── purchase_order_id  FK → PurchaseOrder (nullable)
├── vendor_id         FK → Vendor
├── project_id        FK → Project
├── label             string
├── amount            decimal
├── trigger_type      enum: (same as PaymentScheduleItem)
├── trigger_date      date
├── trigger_phase_id  FK → ProjectPhase
├── trigger_pct       decimal
├── status            enum: pending | approved | paid | overdue
├── expected_date     date
├── actual_paid_date  date (nullable)
├── actual_amount     decimal (nullable)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp
```

---

### 4.10 PurchaseOrder

```
PurchaseOrder
├── id                UUID (PK)
├── vendor_id         FK → Vendor
├── project_id        FK → Project
├── po_number         string
├── description       text
├── total_value       decimal
├── issue_date        date
├── expected_delivery date
├── status            enum: draft | issued | partial | complete | cancelled
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → VendorPaymentItem
```

---

### 4.11 OverheadExpense

```
OverheadExpense
├── id                UUID (PK)
├── category          enum: rent | utilities | salaries | accounting |
│                          software | equipment | other
├── description       string
├── amount            decimal (monthly amount)
├── frequency         enum: monthly | quarterly | annual | one_time
├── period_start      date
├── period_end        date (nullable — null means ongoing)
├── allocated_to_projects boolean (default: false)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → OverheadAllocation
```

---

### 4.12 OverheadAllocation

```
OverheadAllocation
├── id                UUID (PK)
├── overhead_id       FK → OverheadExpense
├── project_id        FK → Project
├── period_month      date (first day of the month, e.g. 2024-03-01)
├── allocated_amount  decimal
├── allocation_method enum: equal | by_contract_value | by_duration | manual
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp
```

---

### 4.13 User

```
User
├── id                UUID (PK)
├── name              string
├── email             string (unique)
├── role              enum: admin | project_manager | accountant | viewer
├── password_hash     string
├── active            boolean
├── created_at        timestamp
└── updated_at        timestamp
```

---

### 4.14 Resource ⭐ (Core entity — estimating)

The atomic priceable unit in the estimating system. A material, labor type, equipment
piece, or transport charge. Prices are stored separately in ResourcePrice.

```
Resource
├── id                UUID (PK)
├── code              string (e.g. "MAT-PVC-001", "MO-OFIC-PLO", "EQP-TALADRO-01")
├── description       string (e.g. "Tubo PVC presión 1/2"", "Oficial plomero")
├── unit              string (un, m, m², m³, kg, hora, viaje, global...)
├── resource_type     enum: material | labor | equipment | transport | subcontract
├── category          string (e.g. "Plomería", "Acabados", "Estructura")
├── active            boolean (default: true)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → ResourcePrice
  └── referenced by many → APULine
```

---

### 4.15 ResourcePrice

Multiple price records per resource, from different sources and time periods.
This is what allows comparing internal historical prices vs CAMACOL vs supplier quotes.

```
ResourcePrice
├── id                UUID (PK)
├── resource_id       FK → Resource
├── source_type       enum: internal | camacol | gobernacion | supplier | manual
├── source_name       string (e.g. "CAMACOL Antioquia 2025-Q1", "Homecenter Mar-2025")
├── price             decimal
├── currency          string (default: "COP")
├── valid_from        date
├── valid_until       date (nullable — null means still valid)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp
```

> **Source types explained:**
> - `internal` — extracted from their own historical project APUs
> - `camacol` — from CAMACOL (Cámara Colombiana de la Construcción) published lists
> - `gobernacion` — official regional government price lists (required for public sector projects)
> - `supplier` — quote from a specific supplier or vendor
> - `manual` — one-off entry that doesn't fit the above

---

### 4.16 APUItem ⭐ (Core entity — estimating)

A named unit of work composed of resources. This is the actual APU analysis — it
justifies a unit price by showing exactly which resources go into one unit of output.

```
APUItem
├── id                UUID (PK)
├── code              string (e.g. "APU-PLO-001")
├── description       string (e.g. "Cambio de grifo monocomando")
├── output_unit       string (the unit this activity produces: un, m², ml...)
├── category          string (e.g. "Plomería", "Acabados", "Estructura Civil")
├── aiu_admin_pct     decimal (Administración — typically 10–15%)
├── aiu_contingency_pct decimal (Imprevistos — typically 3–5%)
├── aiu_profit_pct    decimal (Utilidad — typically 5–10%)
├── active            boolean (default: true)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → APULine
```

**Derived unit price formula:**
```
line_cost     = resource.resolved_price × quantity × (1 + waste_factor_pct / 100)
direct_cost   = sum(all APULine.line_cost)
aiu_total_pct = aiu_admin_pct + aiu_contingency_pct + aiu_profit_pct
unit_price    = direct_cost × (1 + aiu_total_pct / 100)
```

> **AIU context:** In Colombian construction, AIU (Administración, Imprevistos,
> Utilidad) is a standard markup structure added on top of direct costs. For private
> projects the percentages are negotiated; for public sector projects there are
> legal limits (typically AIU ≤ 30% total). Always show AIU breakdown separately
> in client-facing documents.

---

### 4.17 APULine

One resource contribution inside an APU activity.

```
APULine
├── id                UUID (PK)
├── apu_item_id       FK → APUItem
├── resource_id       FK → Resource
├── quantity          decimal (amount of resource per one output unit)
├── waste_factor_pct  decimal (e.g. 5.0 for 5% material waste — common for tiles, paint)
├── order             integer (display order within the APU)
├── notes             text
└── created_at        timestamp
```

---

### 4.18 AssemblyTemplate

A named, parameterized bundle of APU activities. Used to generate quick quotations.
Example: "Remodelación de cocina — Estándar" takes `area_m2` as input and
auto-calculates quantities for all contained APU activities.

```
AssemblyTemplate
├── id                UUID (PK)
├── name              string (e.g. "Remodelación de cocina")
├── category          string (e.g. "Cocinas", "Baños", "Obra civil")
├── tier              enum: básico | estándar | premium (nullable — not all templates use tiers)
├── description       text
├── params            JSON  (defines what inputs the template accepts)
│                          e.g. [{ "key": "area_m2", "label": "Área (m²)", "type": "number" },
│                                { "key": "perimeter_ml", "label": "Perímetro (ml)", "type": "number" }]
├── active            boolean (default: true)
├── notes             text
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → AssemblyLine
```

---

### 4.19 AssemblyLine

One APU activity contribution inside an assembly template.
The `quantity_formula` is evaluated at quotation time using the template's input params.

```
AssemblyLine
├── id                UUID (PK)
├── template_id       FK → AssemblyTemplate
├── apu_item_id       FK → APUItem
├── quantity_formula  string  (arithmetic expression on params, e.g. "area_m2 * 1.15",
│                             "ceil(perimeter_ml / 0.6)", "2", "area_m2 / 6")
├── order             integer
├── notes             text
└── created_at        timestamp
```

> **Formula rules:** Keep expressions as simple arithmetic on declared params.
> Supported: +, -, *, /, ceil(), floor(), round(). Do NOT build a scripting
> language — if a line can't be expressed this way, it becomes a manual override
> field in the quotation.

---

### 4.20 Quotation

An instance of one or more templates applied to specific params for a project.
Before approval it is a live draft (prices recalculate). After approval, prices
are frozen into QuotationLine snapshots.

```
Quotation
├── id                UUID (PK)
├── project_id        FK → Project (nullable — quotations can exist before a project is created)
├── title             string
├── status            enum: draft | submitted | approved | rejected | imported
├── price_strategy    enum: prefer_internal | prefer_cheapest_supplier |
│                          prefer_specific_supplier | prefer_camacol |
│                          prefer_gobernacion | manual
├── strategy_ref      string (nullable — supplier name if prefer_specific_supplier)
├── reference_date    date (only use ResourcePrice records valid on this date)
├── notes             text
├── approved_at       timestamp (nullable — set when status → approved)
├── created_at        timestamp
└── updated_at        timestamp

Relations:
  └── has many → QuotationPriceOverride
  └── has many → QuotationLine (written at approval time)
```

---

### 4.21 QuotationPriceOverride

Per-resource price pin for a specific quotation.
Used when the strategy auto-picks a price but the user wants a different one for
a specific resource (e.g. a fresh supplier quote just received).

```
QuotationPriceOverride
├── id                UUID (PK)
├── quotation_id      FK → Quotation
├── resource_id       FK → Resource
├── resource_price_id FK → ResourcePrice (the specific price to use)
├── reason            text (optional note)
└── created_at        timestamp
```

---

### 4.22 QuotationLine

Frozen snapshot of each line item at the moment a quotation is approved.
Once written, these records never recalculate — they are the permanent record
of what was quoted and at what price.

```
QuotationLine
├── id                    UUID (PK)
├── quotation_id          FK → Quotation
├── apu_item_id           FK → APUItem
├── apu_item_description  string (snapshot — in case APUItem is later edited)
├── resource_id           FK → Resource
├── resource_description  string (snapshot)
├── quantity              decimal
├── waste_factor_pct      decimal
├── unit_price_snapshot   decimal (price locked at approval — never recalculates)
├── line_total_snapshot   decimal
├── source_used           string (e.g. "CAMACOL Antioquia 2025-Q1")
├── aiu_admin_pct         decimal (snapshot)
├── aiu_contingency_pct   decimal (snapshot)
├── aiu_profit_pct        decimal (snapshot)
└── created_at            timestamp
```

> When the user clicks "Importar al presupuesto del proyecto", QuotationLine rows
> are transformed into CostItem rows on the project, with `quotation_id` set so
> the origin is traceable.

---

## 5. Entity Relationship Summary

```
Client ──────────────────────── has many ──► Project
                                                │
                          ┌─────────────────────┤
                          │                     │
                    has many                has many
                          │                     │
                          ▼                     ▼
                      Contract            ProjectPhase ◄──── triggers
                          │                                       │
                    has many                                       │
                          │                                       │
                          ▼                                       │
              PaymentScheduleItem ────────────────────────────────┘
              (MONEY IN)

Project ──────────── has many ──► CostItem ──────────► Vendor
   │                               ▲                      │
   │                               │ imported from        │
   │                           Quotation                  │
   │                               │                      │
   └── has many ──► VendorContract ──────────────────────►│
                          │
                    has many
                          │
                          ▼
              VendorPaymentItem
              (MONEY OUT)

Project ──── (via OverheadAllocation) ──── OverheadExpense
              (MONEY OUT — fixed costs)


CASH FLOW = PaymentScheduleItem (IN) − VendorPaymentItem (OUT) − OverheadAllocation (OUT)


ESTIMATING HIERARCHY:

ResourcePrice ──► Resource
                     ▲
                     │ (qty + waste)
                  APULine
                     │
                  APUItem (+ AIU %) ──► computed unit_price
                     ▲
                     │ (qty formula + params)
              AssemblyLine
                     │
           AssemblyTemplate ──► Quotation ──► QuotationLine (frozen)
                                                     │
                                              imported into
                                                     │
                                                  CostItem (Module 03)
```

---

## 6. Module Specifications

### Module 00 — Price Catalog & Estimating

**Screens:**
- Resource catalog list (searchable, filterable by type and category)
- Resource detail side panel (all price records, add price button)
- APU activity list (filterable by category)
- APU activity detail (resource breakdown lines, live unit price computation, AIU fields)
- Assembly template list (card grid by category and tier)
- Assembly template detail (edit params, edit formula lines)
- New quotation wizard (3 steps: select templates → input params + price strategy → review & approve)
- Approved quotation view (read-only snapshot, export PDF, import to project budget)

**Key behaviors:**
- Resource prices recalculate all APU activities that reference them — but only in draft quotations. Approved quotations are immutable.
- Price strategy is set once per quotation; individual resources can be overridden via `QuotationPriceOverride`.
- If a resource has no valid price for the chosen strategy, the system flags it with a warning (does not silently fall back).
- The fallback chain when preferred source has no valid price: show a warning badge, let user manually pick or override.
- AIU percentages default to the values set on the APUItem but can be adjusted per quotation before approval.
- When a quotation is approved, all lines are written to `QuotationLine` as immutable snapshots.
- "Import to project" converts `QuotationLine` rows into `CostItem` rows with `quotation_id` set for traceability.
- Public sector projects: use `prefer_gobernacion` price strategy. Gobernación price lists are imported via CSV with `source_type = gobernacion`.

**Data sourcing strategy (in priority order):**

| Source | How to load | Update frequency |
|--------|-------------|-----------------|
| Historical internal APUs | One-time Excel import exercise | As projects close |
| CAMACOL price lists | Manual CSV import per edition | Quarterly |
| Gobernación price lists | Manual CSV import when published | Per project / as needed |
| Supplier quotes | Manual entry per resource | Per project / ad hoc |
| Project actuals feedback | At project closeout, offer to update ResourcePrice | Automatic prompt |

**APU import challenge:**
The client's existing Excel APUs are inconsistent — some are flat lines ("Instalación cocina — 12m² — $X"), others have a full resource breakdown. The import strategy should handle both:
- Flat lines → create an APUItem with a single manual-entry line (no resource breakdown), flagged for future decomposition
- Broken down → create proper Resource + APULine records

---

### Module 01 — Projects

**Screens:**
- Project list (table/card view, filterable by status and type)
- Project detail (overview, phases, linked contracts, cost summary, team)
- New / edit project form
- Project dashboard (mini cash flow, budget health, milestone status)

**Key behaviors:**
- When a project is created, prompt user to define phases immediately (these become payment triggers)
- `total_contract_value` is derived — sum of all linked active contracts
- `total_budget` is derived — sum of all `CostItem.total_budgeted`
- Status changes should be manually triggered (not automatic)

---

### Module 02 — Contracts & Payment Plans

**Screens:**
- Contract list per project
- Contract detail with payment schedule table
- New contract form (with payment plan builder)
- Payment schedule editor (add/edit/remove installments)
- Acta de cobro registration (mark an item as invoiced)

**Key behaviors:**
- Payment plan builder must support mixed trigger types in one contract
- When a `PaymentScheduleItem` status changes to `paid`, update `actual_paid_date` and `actual_amount`
- `expected_date` on each item is the best-estimate date used in cash flow projections — pre-filled based on trigger logic but editable
- Overdue detection: if `expected_date` < today and status ≠ `paid`, mark as `overdue`
- Retention amounts should be shown separately — the contract value includes them but actual receipts exclude them until final payment

---

### Module 03 — Budget & Costs

**Screens:**
- Budget overview per project (category totals: budgeted vs actual, variance)
- APU detail table (all cost items for a project, grouped by category)
- Add/edit cost item
- Actual expense registration form
- Budget health indicator (% over/under per category)

**Key behaviors:**
- Cost items can be created manually or imported from an approved Quotation (Module 00)
- When imported from a quotation, `CostItem.quotation_id` is set — the source is always traceable
- Budget variance = `total_actual - total_budgeted` (positive = over budget, shown in red)
- Cost items linked to a vendor automatically create a suggested `VendorPaymentItem`
- Provide a CSV export of the full APU for sharing with clients or banks

---

### Module 04 — Cash Flow Dashboard

**Screens:**
- Monthly cash flow view (bar chart: IN vs OUT per month, net position)
- Cash flow detail table (list of all expected transactions, IN and OUT, sorted by date)
- Cash flow settings (adjust forecast horizon, toggle which items to include)

**Key behaviors:**
- This is a **read-only derived view** — no data is entered here directly
- Data sources:
  - **IN:** All `PaymentScheduleItem` rows with status ≠ `paid`, grouped by `expected_date` month
  - **OUT:** All `VendorPaymentItem` rows with status ≠ `paid`, grouped by `expected_date` month
  - **OUT:** Monthly `OverheadExpense` amounts for current period
- The chart shows future months (forecast) AND past months (actual) in different visual styles
- Alert system: if any month has `net = IN - OUT < 0`, highlight it prominently (cash flow gap)
- Default forecast horizon: 6 months forward
- Actual vs projected comparison: once a month has passed, show what was projected vs what actually happened

---

### Module 05 — Vendors & Subcontractors

**Screens:**
- Vendor directory (searchable list with specialty filter)
- Vendor detail (profile + all contracts and POs across projects)
- New / edit vendor form
- Vendor contract list per project
- New vendor contract form (with payment schedule builder — same UX as client contracts)
- Purchase order list per project
- New / edit PO form
- Outgoing payments calendar (all pending VendorPaymentItems across all projects)

**Key behaviors:**
- Vendor directory is company-wide and reusable across projects
- VendorContract payment schedule uses the same `trigger_type` logic as client contracts
- When a VendorPaymentItem is marked as `paid`, it immediately affects the cash flow projection
- POs without a formal contract use `VendorPaymentItem` with `trigger_type = calendar_date`

---

### Module 06 — Overhead & Profitability

**Screens:**
- Overhead expense list (grouped by category, with monthly totals)
- New / edit overhead expense form
- Overhead allocation manager (distribute monthly costs across active projects)
- Profitability report per project (revenue − direct costs − allocated overhead = net margin)
- Company-level P&L summary (all projects + unallocated overhead)

**Key behaviors:**
- Overhead expenses recur monthly unless marked with a specific `period_end`
- Allocation methods: equal | by_contract_value | by_duration | manual
- True profitability formula per project:
  ```
  Revenue      = sum of PaymentScheduleItem.actual_amount (paid)
  Direct costs = sum of CostItem.total_actual
  Overhead     = sum of OverheadAllocation.allocated_amount
  Net margin   = Revenue − Direct costs − Overhead
  Margin %     = Net margin / Revenue × 100
  ```

---

## 7. Suggested Tech Stack

### Option A — Full-stack JavaScript (Recommended for solo dev)

```
Frontend:   React + Vite
Styling:    Tailwind CSS
State:      Zustand or React Query (TanStack Query)
Charts:     Recharts or Chart.js
Tables:     TanStack Table

Backend:    Node.js + Express (or Fastify)
ORM:        Prisma
Database:   PostgreSQL
Auth:       JWT + bcrypt (simple, no OAuth needed for internal tool)

Hosting:    Railway, Render, or Supabase (for DB) + Vercel (for frontend)
```

### Option B — Python backend

```
Frontend:   React + Vite (same as above)
Backend:    FastAPI (Python)
ORM:        SQLAlchemy + Alembic (migrations)
Database:   PostgreSQL
```

### Database recommendation
**PostgreSQL** is strongly recommended over SQLite because:
- Decimal precision is critical (currency amounts in COP can be 9+ digits)
- Date/time operations for cash flow projections are more robust
- The relational model is complex enough to benefit from proper FK constraints

---

## 8. Suggested Folder Structure (Node/React)

```
aec-project-hub/
├── README.md
├── .env.example
│
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── catalog/          ← Module 00 (resources, APU items, templates)
│   │   │   ├── quotations/       ← Module 00 (quotation workflow)
│   │   │   ├── projects/         ← Module 01
│   │   │   ├── contracts/        ← Module 02
│   │   │   ├── costs/            ← Module 03
│   │   │   ├── cashflow/         ← Module 04
│   │   │   ├── vendors/          ← Module 05
│   │   │   └── overhead/         ← Module 06
│   │   └── shared/
│   │       ├── utils/
│   │       └── constants/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── router.jsx
    │   ├── components/
    │   │   ├── ui/
    │   │   └── layout/
    │   ├── modules/
    │   │   ├── catalog/
    │   │   ├── quotations/
    │   │   ├── projects/
    │   │   ├── contracts/
    │   │   ├── costs/
    │   │   ├── cashflow/
    │   │   ├── vendors/
    │   │   └── overhead/
    │   ├── hooks/
    │   ├── services/
    │   └── store/
    ├── index.html
    └── package.json
```

---

## 9. API Design (Key Endpoints)

### Price Catalog & Estimating (Module 00)
```
GET    /api/resources                         List all resources
POST   /api/resources                         Create resource
GET    /api/resources/:id                     Resource detail
PUT    /api/resources/:id                     Update resource
GET    /api/resources/:id/prices              All price records for a resource
POST   /api/resources/:id/prices              Add a price record

GET    /api/apu-items                         List all APU activities
POST   /api/apu-items                         Create APU activity
GET    /api/apu-items/:id                     APU detail with lines + computed unit price
PUT    /api/apu-items/:id                     Update APU activity
POST   /api/apu-items/:id/lines               Add a resource line

GET    /api/assembly-templates                List all templates
POST   /api/assembly-templates                Create template
GET    /api/assembly-templates/:id            Template detail with lines
PUT    /api/assembly-templates/:id            Update template

POST   /api/quotations                        Create quotation (apply templates + params)
GET    /api/quotations/:id                    Quotation detail with live-computed lines
PUT    /api/quotations/:id/override-price     Set a per-resource price override
POST   /api/quotations/:id/approve            Approve quotation (writes QuotationLine snapshots)
POST   /api/quotations/:id/import             Import approved quotation into project as CostItems
```

### Projects (Module 01)
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
GET    /api/projects/:id/phases
POST   /api/projects/:id/phases
GET    /api/projects/:id/summary
```

### Contracts & Payment Schedules (Module 02)
```
GET    /api/projects/:id/contracts
POST   /api/projects/:id/contracts
GET    /api/contracts/:id
PUT    /api/contracts/:id
GET    /api/contracts/:id/schedule
POST   /api/contracts/:id/schedule
PUT    /api/schedule-items/:id
```

### Cash Flow (Module 04)
```
GET    /api/cashflow?months=6
GET    /api/cashflow/items?from=&to=
GET    /api/cashflow/projects/:id
```

### Vendors (Module 05)
```
GET    /api/vendors
POST   /api/vendors
GET    /api/projects/:id/vendor-contracts
POST   /api/projects/:id/vendor-contracts
```

### Overhead (Module 06)
```
GET    /api/overhead
POST   /api/overhead
GET    /api/overhead/allocations?month=
POST   /api/overhead/:id/allocate
GET    /api/reports/profitability
```

---

## 10. Cash Flow Calculation Logic

```javascript
async function getCashFlow(fromDate, toDate) {

  // MONEY IN — client payments expected in range
  const incoming = await PaymentScheduleItem.findAll({
    where: {
      expected_date: { between: [fromDate, toDate] },
      status: { not: 'paid' }
    }
  });

  // MONEY IN — already received (actual)
  const received = await PaymentScheduleItem.findAll({
    where: {
      actual_paid_date: { between: [fromDate, toDate] },
      status: 'paid'
    }
  });

  // MONEY OUT — vendor/sub payments expected in range
  const outgoing = await VendorPaymentItem.findAll({
    where: {
      expected_date: { between: [fromDate, toDate] },
      status: { not: 'paid' }
    }
  });

  // MONEY OUT — overhead for each month in range
  const overhead = await computeMonthlyOverhead(fromDate, toDate);

  const months = eachMonthInRange(fromDate, toDate);
  return months.map(month => ({
    month,
    projected_in:  sum(incoming filtered to month),
    actual_in:     sum(received filtered to month),
    projected_out: sum(outgoing filtered to month) + overhead[month],
    net:           projected_in - projected_out,
    is_gap:        net < 0
  }));
}
```

---

## 11. Price Resolution Logic (Module 00)

When a quotation is in draft state, the system must resolve which `ResourcePrice`
record to use for each `APULine`. The resolution order:

```
1. Check QuotationPriceOverride for this quotation + resource → use it if found
2. Otherwise apply price_strategy:
   - prefer_internal       → latest valid ResourcePrice where source_type = 'internal'
   - prefer_cheapest_supplier → lowest price where source_type = 'supplier'
   - prefer_specific_supplier → latest where source_type = 'supplier' AND source_name = strategy_ref
   - prefer_camacol        → latest valid where source_type = 'camacol'
   - prefer_gobernacion    → latest valid where source_type = 'gobernacion'
   - manual                → no auto-selection, user must pick every line
3. "Latest valid" = valid_from ≤ reference_date AND (valid_until IS NULL OR valid_until ≥ reference_date)
4. If no matching price found → flag resource with WARNING status, do not silently fall back
```

---

## 12. UI/UX Notes

### Navigation structure
```
Sidebar:
  ├── Dashboard (cash flow overview)
  ├── Proyectos
  │    └── [Project name]
  │         ├── Vista general
  │         ├── Fases y cronograma
  │         ├── Contratos
  │         ├── Presupuesto y costos
  │         └── Flujo de caja
  ├── Cotizaciones
  ├── Catálogo de insumos
  ├── Plantillas APU
  ├── Proveedores
  ├── Gastos generales
  └── Reportes
```

### Key UI patterns
- **Cash flow chart:** Grouped bar chart, green for IN, amber/orange for OUT, red outline on negative net months. Forecast = lighter/dashed, actual = solid.
- **Payment schedule table:** Inline status editing, color-coded badges (pending=gray, invoiced=blue, approved=yellow, paid=green, overdue=red).
- **APU breakdown table:** Resource lines with live unit price, waste factor, line total. AIU summary panel below. Price source pill on each line (green=Interno, blue=CAMACOL, amber=Proveedor, red=Sin precio).
- **Budget table:** APU-style with category grouping, budget vs actual columns, variance column (green if under, red if over).
- **Project cards:** Status badge, % complete, budget health indicator, next payment due date.

### Colombian-specific formatting
```javascript
const formatCOP = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
// → "$ 48.000.000"

const formatDate = (date) =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(date);
// → "15/03/2024"
```

---

## 13. Stitch UI Design Prompt (Module 00)

Use this prompt to generate UI mockups for the Price Catalog & Estimating module.

```
Design a web application UI for an internal project management tool used by a
small Colombian Architecture, Engineering & Construction (AEC) firm. The app is
called "AEC Project Hub". All UI labels should be in Spanish. The visual style
should be professional, clean, and data-dense — similar to tools like Linear or
Notion but with more table-heavy layouts since users are working with budgets and
financial data daily. Use a neutral dark sidebar with white content areas. Primary
accent color: a muted teal or slate blue. Currency is always COP (Colombian pesos),
formatted as "$ 48.000.000".

---

Design the following screens for the "Catálogo de Precios y Cotizaciones" module:

---

SCREEN 1 — Resource Catalog List ("Catálogo de Insumos")

A full-page table listing all resources (materials, labor, equipment, transport).
Columns: Code, Description, Unit, Type (badge: Material / Mano de obra / Equipo /
Transporte), Active Price (the current best price), Price Source (small label showing
where the active price comes from, e.g. "Interno", "CAMACOL", "Proveedor"), Last
Updated, Actions (edit, view prices).

Top bar has: search input, filter by Type dropdown, filter by Category dropdown,
and a primary button "Nuevo insumo".

Clicking a row opens a side panel (not a new page) showing all price records for
that resource in a mini table: Source Type, Source Name, Price, Valid From, Valid
Until, with an "Add price" button at the bottom.

---

SCREEN 2 — APU Activity Detail ("Detalle APU")

A detail page for one APU activity (e.g. "Cambio de grifo monocomando — unidad").

Top section: activity metadata (Code, Description, Output unit, Category).

Main section: a table of resource lines with columns: Resource (linked name),
Type badge, Quantity, Unit, Waste %, Unit Price (live, pulled from active price),
Line Total. Footer row shows: Direct Cost subtotal.

Below the table: an AIU breakdown panel showing three editable percentage fields —
Administración (%), Imprevistos (%), Utilidad (%) — and a computed summary:
  Costo directo:     $ X
  AIU (18%):         $ X
  Precio unitario:   $ X  ← prominent, large font

A "Recalcular" button that recomputes when prices change.

---

SCREEN 3 — New Quotation Flow ("Nueva Cotización")

A 3-step wizard:

Step 1 — "Seleccionar plantillas":
A card grid of available Assembly Templates grouped by category (Cocinas, Baños,
Obra civil, Instalaciones...). Each card shows name, tier badge (Básico / Estándar
/ Premium), and a short description. User can select multiple templates. Selected
cards get a teal checkmark border.

Step 2 — "Parámetros":
For each selected template, show a compact form card with the template name as
header and input fields for its required params (e.g. "Área (m²)", "Perímetro (ml)").
Below all template params, a "Configuración de precios" section with a segmented
control or radio group to pick the price resolution strategy:
  ○ Precio interno (histórico)
  ○ Proveedor más económico
  ○ Proveedor específico → (text input appears: "Nombre del proveedor")
  ○ Referencia CAMACOL
  ○ Lista gobernación
  ○ Manual (selección línea por línea)
And a date picker: "Fecha de referencia de precios".

Step 3 — "Revisar cotización":
A detailed breakdown table grouped by APU activity. Columns: Activity, Unit,
Quantity, Unit Price, Source (small colored pill — green for Interno, blue for
CAMACOL, amber for Proveedor, red for "Sin precio"), Total.

A warning banner appears at top if any resource has no price for the selected
strategy: "3 insumos sin precio en la fuente seleccionada — haz clic para revisar".

Rows with a price source pill that is amber or red have a small edit icon that
opens an inline override dropdown showing all available prices for that resource
with their source and date, plus a "Fijar este precio" option.

Footer summary card:
  Subtotal:           $ X
  AIU promedio:       $ X
  Total cotización:   $ X  ← large
Two buttons: "Guardar borrador" and "Aprobar y fijar precios" (primary, teal).

---

SCREEN 4 — Approved Quotation View ("Cotización Aprobada")

A read-only version of Screen 3 Step 3, but with a prominent status banner at top:
"Cotización aprobada — precios fijados el 07/04/2026".

Each price source pill now shows the snapshot value and source. No edit icons.
A "Exportar PDF" button and an "Importar al presupuesto del proyecto" button in
the top right.

---

Global design notes:
- All tables should support hover highlight on rows
- Status badges/pills should be color-coded consistently across all screens
- Empty states should have a helpful illustration and a CTA button
- The sidebar nav should show: Dashboard, Proyectos, Cotizaciones, Catálogo de
  insumos, Plantillas APU, Proveedores, Gastos generales, Reportes
- Mobile layout is not required — desktop only, minimum 1280px width assumed
```

---

## 14. Open Questions (Gather Before Coding)

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | Can you share an anonymized client contract? | Need to see exact payment clause wording to confirm `trigger_type` enum covers all cases |
| 2 | What does your current APU/presupuesto Excel look like? | Determines CSV import format — some are flat lines, others have full resource breakdowns |
| 3 | Do you use `retefuente` (income tax withholding) on invoices? | Affects `net_amount` calculation on `PaymentScheduleItem` |
| 4 | Do you use `retención de garantía` (retention guarantee)? | Affects when 100% of contract value is actually collected |
| 5 | Who will use the app — just one person or the whole team? | Determines whether role-based access is needed in Phase 1 |
| 6 | Do you use Siigo, Alegra, or another accounting tool? | Determines if we need export/integration |
| 7 | How do you handle IVA (19%) on professional services fees? | Needs to be modeled in both contracts and vendor contracts |
| 8 | What does a typical project phase breakdown look like? | Helps pre-populate phase templates |
| 9 | How do you currently name/number your projects and contracts? | Determines `code` and `contract_number` format conventions |
| 10 | Do you ever work with foreign clients or in USD? | Determines if multi-currency support is needed |
| 11 | For public sector projects, which gobernación price lists apply? | Determines which regional lists to import as reference data |
| 12 | What AIU percentages do you typically use for private vs public projects? | Pre-populates APUItem AIU defaults |
| 13 | Are your existing Excel APUs broken down by resource, or flat lines? | Determines complexity of the initial data migration |
| 14 | **TODO** Can a single `ProjectExpense` entry span multiple APU items? (e.g. one supplier invoice covering materials for 3 different activities) | Determines if `ProjectExpense` needs a split/allocation mechanism or if manual splitting is acceptable |
| 15 | **TODO** Is execution tracking always at the project level, or also per phase? | Determines if `ProjectExpense` needs its own `phase_id` or inherits it from the linked `CostItem` |

---

## 15. Decisions Already Made

| Decision | Rationale |
|----------|-----------|
| Web app, not mobile app | Team works primarily from office/desktop |
| Single-tenant (one company) | No SaaS multi-tenancy needed |
| No public client portal (Phase 1) | Internal only for now |
| Spanish labels in UI | All users are Spanish-speaking Colombian AEC professionals |
| COP as default currency | All projects are in Colombia; USD support deferred |
| Manual data entry (no accounting integrations in Phase 1) | Client uses no consistent accounting software |
| No real-time collaboration needed | 4–8 users, mostly sequential work |
| 3-tier estimating model (Resource → APUItem → AssemblyTemplate) | Matches how proper APU analysis works in Colombian construction; allows price updates to cascade, supports both private and public sector pricing sources |
| Quotation prices are immutable after approval | Prevents retroactive changes to submitted quotations |
| Price resolution strategy per quotation + per-resource override | One-click strategy covers 90% of cases; overrides handle exceptions without forcing line-by-line work |
| Gobernación price lists as a separate source_type | Needed for public sector projects; not mandatory in Phase 1 but the data model supports it from the start |

---

## 16. Session Notes

### Session 1 — Discovery (March 2026)
- The firm handles all four AEC project types — data model must be type-agnostic
- They already have APU/presupuesto discipline — can import from existing Excel files
- Payment structures are highly variable per client — `trigger_type` enum must cover all cases
- Overhead is the biggest blind spot — no idea how much office costs "per project"
- "We manage it in WhatsApp and Excel" came up multiple times
- Cash flow is the #1 priority — they have had months where client payments were delayed and they nearly couldn't pay subcontractors

### Session 2 — APU & Estimating Design (April 2026)
- Client wants to standardize APUs and enable quick parametric quotations (e.g. kitchen by m²)
- They do both private and public sector projects — gobernación price lists needed eventually
- Existing Excel APUs are inconsistent: some flat lines, some with full resource breakdowns
- Agreed on 3-tier model: Resource → APUItem (with AIU) → AssemblyTemplate (with formulas)
- Price resolution: strategy set at quotation level, per-resource override available, prices frozen at approval
- AIU (Administración, Imprevistos, Utilidad) must be shown as a separate breakdown in client-facing documents
- Stitch UI design prompt written for Module 00 (see Section 13)
- Next step: circle back with client to confirm open questions (Section 14), then begin data migration from existing Excel APUs

---

*Ready to resume: open this file as the first message context when starting a new coding or migration session.*
