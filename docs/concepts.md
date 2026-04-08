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
A single line in a project's budget. Created by selecting an APU template and specifying a quantity. At creation time, the APU unit price is **snapshotted** into `unitCostBudgeted` — this value never changes even if resource prices are updated later. The budgeted total is always `quantityBudgeted × unitCostBudgeted`.

### Unit Price Snapshot
When a CostItem is created, the system computes the current APU unit price from live resource prices and stores it in `unitCostBudgeted`. This freezes the estimate at the moment of budget approval, preventing price drift from affecting historical budgets.

### totalBudgeted
Derived field (not stored): `quantityBudgeted × unitCostBudgeted` per CostItem.

### totalExecuted
Derived field (not stored): sum of all `ProjectExpense.total` records linked to a CostItem.

### variance
`totalExecuted − totalBudgeted`. Positive = over budget. Negative = under budget.

---

## Execution Tracking

### ProjectExpense
A real cost entry recorded during project execution. Always belongs to a CostItem (the budget anchor). Can optionally reference a specific Resource from the APU lines — this links the spend to a specific material or labor type for more granular tracking.

Key fields:
- `description` — free text (e.g. "FERREMAX materiales semana 3", "Pago jornales")
- `date` — when the cost was incurred
- `total` — the amount (required)
- `quantity`, `unit`, `unitCost` — optional breakdown; if provided, total is auto-computed as `quantity × unitCost`
- `resourceId` — optional mapping to an APU resource

### Commitment / Abono (Planned — not yet built)
Some expenses are not paid in full upfront. A **commitment** represents the total agreed amount with a provider; **abonos** are partial payments against it. This model is planned as the next iteration of ProjectExpense.

---

## Locale & Formatting

- Currency: **COP** (Colombian Peso), formatted with `es-CO` locale (`$1.200.000`)
- Dates: formatted with `es-CO` locale (`15 oct. 2023`)
- All monetary values stored as `Decimal(15, 2)` in the database
