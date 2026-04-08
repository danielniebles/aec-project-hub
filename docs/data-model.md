# Data Model

Schema lives in `prisma/schema.prisma`. Database: PostgreSQL 16 (Docker, port 5433).

---

## Entity Map

```
Resource ──< ResourcePrice
Resource ──< APULine >── APUItem ──< CostItem >── Project
                                    CostItem ──< ProjectExpense
Resource ──< ProjectExpense (optional resource mapping)
```

---

## Tables

### Resource
Atomic cost unit (material, labor, equipment, transport, subcontract).

| Field       | Type            | Notes                              |
|-------------|-----------------|-------------------------------------|
| id          | UUID PK         |                                     |
| code        | String UNIQUE   | Short identifier, e.g. `MAT-001`   |
| description | String          |                                     |
| unit        | String          | e.g. `m²`, `kg`, `GL`, `hora`     |
| type        | ResourceType    | `material \| labor \| equipment \| transport \| subcontract` |
| category    | String          | Free-text grouping                  |
| active      | Boolean         | Default true                        |
| notes       | String?         |                                     |

---

### ResourcePrice
Price record for a resource. Multiple prices per resource; **the most recently created is the active price**.

| Field       | Type              | Notes                                      |
|-------------|-------------------|--------------------------------------------|
| id          | UUID PK           |                                            |
| resourceId  | FK → Resource     |                                            |
| sourceType  | PriceSourceType   | `internal \| camacol \| gobernacion \| supplier \| manual` |
| sourceName  | String            | e.g. "CAMACOL Bogotá Q3 2023"             |
| price       | Decimal(15,2)     | COP                                        |
| currency    | String            | Default `COP`                              |
| validFrom   | DateTime          |                                            |
| validUntil  | DateTime?         |                                            |

---

### APUItem
Unit price analysis template. Represents one billable activity.

| Field              | Type          | Notes                          |
|--------------------|---------------|--------------------------------|
| id                 | UUID PK       |                                |
| code               | String UNIQUE | e.g. `APU-DEM-001`            |
| description        | String        | e.g. "Demolición muro 0.25m"  |
| outputUnit         | String        | Unit of the activity output    |
| category           | String        | e.g. "Demoliciones"           |
| aiuAdminPct        | Decimal(5,2)  | Default 10%                   |
| aiuContingencyPct  | Decimal(5,2)  | Default 5%                    |
| aiuProfitPct       | Decimal(5,2)  | Default 3%                    |
| active             | Boolean       | Default true                  |

---

### APULine
One resource within an APU template.

| Field          | Type          | Notes                                         |
|----------------|---------------|-----------------------------------------------|
| id             | UUID PK       |                                               |
| apuItemId      | FK → APUItem  | Cascade delete                                |
| resourceId     | FK → Resource |                                               |
| quantity       | Decimal(12,4) | Per unit of APU output                        |
| wasteFactorPct | Decimal(5,2)  | Default 0. Applied as `qty × (1 + waste/100)` |
| order          | Int           | Display order within APU                      |

**Line cost:** `resource.activePrice × quantity × (1 + wasteFactorPct / 100)`

---

### Project

| Field       | Type          | Notes                                                          |
|-------------|---------------|----------------------------------------------------------------|
| id          | UUID PK       |                                                                |
| name        | String        |                                                                |
| code        | String UNIQUE | e.g. `PRJ-2024-001`                                           |
| type        | ProjectType   | `architecture \| construction \| civil \| design_build`       |
| status      | ProjectStatus | `prospect → design → permitting → execution → closeout → closed` |
| location    | String?       |                                                                |
| startDate   | DateTime?     |                                                                |
| endDate     | DateTime?     |                                                                |

---

### CostItem
A budget line inside a project. Always linked to an APU template.

| Field             | Type          | Notes                                                        |
|-------------------|---------------|--------------------------------------------------------------|
| id                | UUID PK       |                                                              |
| projectId         | FK → Project  | Cascade delete                                               |
| apuItemId         | FK → APUItem? | Optional — future versions may allow manual budget lines     |
| category          | CostCategory  | `labor \| materials \| equipment \| subcontractor \| design_fees \| admin_permits \| transport \| other` |
| description       | String        | Copied from APUItem at creation                              |
| unit              | String        | Copied from APUItem at creation                              |
| quantityBudgeted  | Decimal(12,4) | How many units of the APU are budgeted                       |
| unitCostBudgeted  | Decimal(15,2) | **Snapshotted** APU unit price at creation time — immutable  |

**Derived (not stored):**
- `totalBudgeted = quantityBudgeted × unitCostBudgeted`
- `totalExecuted = Σ expenses.total`
- `variance = totalExecuted − totalBudgeted`

---

### ProjectExpense
A real cost entry recorded during execution. The CostItem is always the budget anchor.

| Field       | Type              | Notes                                              |
|-------------|-------------------|----------------------------------------------------|
| id          | UUID PK           |                                                    |
| projectId   | String            | Denormalized for query convenience                 |
| costItemId  | FK → CostItem     | Cascade delete — budget anchor                     |
| resourceId  | FK → Resource?    | Optional — maps spend to a specific APU resource   |
| description | String            | Free text, e.g. "FERREMAX materiales"              |
| date        | DateTime          |                                                    |
| quantity    | Decimal(12,4)?    | Optional breakdown                                 |
| unit        | String?           | Optional breakdown                                 |
| unitCost    | Decimal(15,2)?    | Optional breakdown                                 |
| total       | Decimal(15,2)     | Required. Auto-computed if qty × unitCost provided |
| receiptUrl  | String?           | Reserved for future file attachment                |
| notes       | String?           |                                                    |

---

## Planned Model Changes

### Commitment + Abono (next iteration)
To support partial payments, `ProjectExpense` will either be extended or replaced with:
- `Commitment` — total agreed amount with a provider (`description`, `date`, `total`, `costItemId`, `resourceId?`)
- `Abono` — partial payment against a commitment (`commitmentId`, `date`, `amount`)

A simple expense (paid in full) would be a Commitment with a single Abono equaling the total.
Status (`Pagado / Parcial / Pendiente`) is derived: `Σ abonos.amount` vs `commitment.total`.
