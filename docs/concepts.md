# Domain Concepts

This glossary defines the key terms used throughout the AEC Project Hub. Understanding these is essential before reading the data model or module docs.

---

## Estimating & Pricing

### Resource (Insumo)
The atomic unit of cost. Represents a single material, labor type, piece of equipment, transport service, or subcontract. Each resource has a unit (m², kg, GL, hora, etc.) and one or more price records over time.

### ResourcePrice
A price entry for a resource from a specific source. A resource can have multiple prices from different sources (e.g. CAMACOL index, a supplier quote, an internal estimate). The **most recently created price** is used as the active price when computing APU costs.

**Price source types:** `internal`, `camacol`, `gobernacion`, `supplier`, `manual`

### APU — Análisis de Precios Unitarios
A unit price analysis template. Defines how much it costs to produce one unit of a specific activity (e.g. one m² of "Pintura vinilo tipo 1" or one m³ of "Demolición de muro"). An APU is composed of:
- A list of **APULines** (resources + quantities)
- **AIU** percentages applied on top of the direct cost

### APULine
One resource within an APU template, with a quantity and an optional waste factor. The line cost is: `resource.activePrice × quantity × (1 + wasteFactorPct / 100)`.

### AIU — Administración, Imprevistos, Utilidad
Three overhead percentages applied on top of the direct cost of an APU:
- **Administración** — overhead and management costs
- **Imprevistos** — contingency
- **Utilidad** — profit margin

**APU unit price formula:**
```
directCost = Σ (resourcePrice × qty × (1 + waste%))
unitPrice  = directCost × (1 + (admin% + contingency% + profit%) / 100)
```

### Waste Factor (% Desp / Desperdicio)
A percentage added to a resource's quantity to account for material loss during construction. Applied per APULine, not globally.

---

## Projects & Budget

### Project
A billable engagement. Has a type (architecture, construction, civil, design-build), a lifecycle status (prospect → design → permitting → execution → closeout → closed), and a set of CostItems that form its budget.

### CostItem
A single line in a project's budget. Can be created three ways:
- **APU-based** — select an APU template + quantity; unit price is snapshotted with AIU markup applied
- **Resource-based** — select a single resource + quantity; unit price snapshotted from the resource's latest price (no AIU)
- **Manual** — provide description, unit, quantity, and unit cost directly; no APU or resource reference

The budgeted total is always `quantityBudgeted × unitCostBudgeted`. APU-less items (resource or manual) appear under the **"Varios"** group in the ledger. A manual item can later be assigned an APU, which updates its description, unit, and re-snapshots the price.

### Unit Price Snapshot
When a CostItem is created, the unit price is computed from live prices and stored in `unitCostBudgeted`. This value never changes after creation, freezing the estimate at the moment of budget entry and preventing price drift.

### totalBudgeted
Derived field (not stored): `quantityBudgeted × unitCostBudgeted` per CostItem.

### totalCommitted / totalPaid / totalPending
Derived fields (not stored) per CostItem, aggregated from its Commitments and Payments.

---

## Execution Tracking

### Commitment
A real cost entry recorded during project execution. Represents a total agreed amount with a provider. Always belongs to a CostItem (the budget anchor). Can optionally reference a specific Resource from the APU lines.

Key fields:
- `description` — free text (e.g. "FERREMAX materiales semana 3", "Contrato Movimiento Tierras")
- `date` — commitment date (contract or purchase date)
- `totalCommitted` — total agreed amount
- `resourceId` — optional mapping to a specific APU resource
- `notes` — reference number, contract ID, etc.

A **simple expense** (fully paid upfront) is a Commitment with one Payment equaling `totalCommitted`. Created by selecting "Gasto simple" in the UI.

### Payment (Abono)
A partial or full disbursement against a Commitment. One Commitment can have multiple Payments.

- `amount` — amount paid in this installment
- `date` — payment date
- `notes` — e.g. "Transferencia #12345"

**Derived status per Commitment:**
- `Pendiente` — no payments yet
- `Parcial` — some payments, total paid < totalCommitted
- `Pagado` — total paid ≥ totalCommitted

---

## Locale & Formatting

- Currency: **COP** (Colombian Peso), formatted with `es-CO` locale (`$1.200.000`)
- Dates: formatted with `es-CO` locale (`15 oct. 2023`)
- All monetary values stored as `Decimal(15, 2)` in the database
