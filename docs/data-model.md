# Data Model

Schema lives in `prisma/schema.prisma`. Database: PostgreSQL 16 (Docker, port 5433).

---

## Entity Map

```
Resource ──< ResourcePrice
Resource ──< APULine >── APUItem ──< CostItem >── Project
                                    CostItem ──< Commitment ──< Payment
Resource ──< Commitment (optional resource mapping)
Project  ──< Commitment
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
- `totalCommitted = Σ commitment.totalCommitted`
- `totalPaid = Σ commitment.totalPaid`
- `totalPending = Σ commitment.totalPending`

---

### Commitment
An agreed spend against a CostItem — either a simple fully-paid expense or a multi-installment contract with a provider. Replaces `ProjectExpense`.

| Field          | Type              | Notes                                              |
|----------------|-------------------|----------------------------------------------------|
| id             | UUID PK           |                                                    |
| projectId      | FK → Project      | Denormalized for query convenience. Cascade delete |
| costItemId     | FK → CostItem     | Cascade delete — budget anchor                     |
| resourceId     | FK → Resource?    | Optional — maps spend to a specific APU resource   |
| description    | String            | Free text, e.g. "FERREMAX materiales"              |
| date           | DateTime          | Commitment date (contract or purchase date)        |
| totalCommitted | Decimal(15,2)     | Total agreed amount                                |
| notes          | String?           | Reference number, contract ID, etc.                |

**Derived (not stored):**
- `totalPaid = Σ payment.amount`
- `totalPending = max(0, totalCommitted − totalPaid)`
- `status = totalPaid === 0 → "Pendiente" | totalPaid >= totalCommitted → "Pagado" | else → "Parcial"`

A "simple expense" (paid in full) is created as a Commitment with `fullyPaid: true`, which auto-creates one Payment equaling `totalCommitted`.

---

### Payment
A partial or full disbursement against a Commitment.

| Field        | Type              | Notes                              |
|--------------|-------------------|------------------------------------|
| id           | UUID PK           |                                    |
| commitmentId | FK → Commitment   | Cascade delete                     |
| date         | DateTime          | Payment date                       |
| amount       | Decimal(15,2)     | Amount paid in this installment    |
| notes        | String?           | e.g. "Transferencia #12345"        |
