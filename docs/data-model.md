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

Client ──< Project
Client ──< PurchaseOrder >── Project
Client ──< Invoice >── Project
Invoice ──< PurchaseOrder (optional)
InvoiceSequence (singleton per year — auto-ref generation)
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
| clientId    | FK → Client?  | Optional — links project to a billing client                   |

---

### CostItem
A budget line inside a project. Can be backed by an APU template, a single resource, or created manually.

| Field             | Type          | Notes                                                        |
|-------------------|---------------|--------------------------------------------------------------|
| id                | UUID PK       |                                                              |
| projectId         | FK → Project  | Cascade delete                                               |
| apuItemId         | FK → APUItem? | Set when created from an APU template; null for resource/manual items |
| resourceId        | FK → Resource? | Set when created from a single resource; null otherwise      |
| category          | CostCategory  | `labor \| materials \| equipment \| subcontractor \| design_fees \| admin_permits \| transport \| other` |
| description       | String        | From APU/resource at creation, or user-provided for manual items |
| unit              | String        | From APU/resource at creation, or user-provided for manual items |
| quantityBudgeted  | Decimal(12,4) | How many units are budgeted                                  |
| unitCostBudgeted  | Decimal(15,2) | **Snapshotted** price at creation time — immutable           |

**Creation modes:**
- `apu` — `apuItemId` set, price computed via `computeUnitPrice()` (with AIU markup)
- `resource` — `resourceId` set, price snapshotted from latest `ResourcePrice` (no AIU)
- `manual` — both null, user provides description, unit, and unit cost directly

**APU re-assignment:** A manual (`apuItemId = null`) item can later be assigned an APU via `PATCH /api/projects/[id]/cost-items/[costItemId]`. This updates `apuItemId`, `description`, `unit`, and re-snapshots `unitCostBudgeted`. Clears `resourceId`.

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

---

## MODULE 02 — Billing / AR

### Client
Represents a firm or individual that the AEC company bills for project work.

| Field           | Type             | Notes                                                |
|-----------------|------------------|------------------------------------------------------|
| id              | UUID PK          |                                                      |
| name            | String           | Legal name or trade name                             |
| taxId           | String? UNIQUE   | NIT                                                  |
| email           | String?          | Used for automated invoice and reminder emails       |
| phone           | String?          |                                                      |
| address         | String?          |                                                      |
| contactName     | String?          | Primary billing contact                              |
| paymentTermType | PaymentTermType  | `net30 \| net60 \| net90 \| fixed_day`              |
| fixedDay        | Int?             | 1–28; only relevant when `paymentTermType = fixed_day` |
| active          | Boolean          |                                                      |

---

### PurchaseOrder
A client-issued purchase order authorizing work on a project.

| Field     | Type          | Notes                         |
|-----------|---------------|-------------------------------|
| id        | UUID PK       |                               |
| number    | String        | Client's PO reference number  |
| clientId  | FK → Client   |                               |
| projectId | FK → Project  | Cascade delete                |
| amount    | Decimal(15,2) | COP                           |
| issueDate | DateTime      |                               |
| notes     | String?       |                               |

`@@unique([clientId, number])` — PO numbers are unique per client.

---

### Invoice
A billing document issued to a client for a project milestone.

| Field          | Type          | Notes                                                          |
|----------------|---------------|----------------------------------------------------------------|
| id             | UUID PK       |                                                                |
| number         | String UNIQUE | User-provided — from the external accounting system            |
| internalRef    | String UNIQUE | Auto-generated by this app: `INT-YYYY-NNN`                    |
| clientId       | FK → Client   |                                                                |
| projectId      | FK → Project  | Cascade delete                                                 |
| purchaseOrderId| FK → PO?      | Optional                                                       |
| status         | InvoiceStatus | `draft → sent → paid`; `overdue` set only by cron; `void`    |
| issueDate      | DateTime      |                                                                |
| dueDate        | DateTime      | Computed from client payment terms at creation; stored         |
| subtotal       | Decimal(15,2) |                                                                |
| taxPct         | Decimal(5,2)  | Default 19 (IVA)                                               |
| taxAmount      | Decimal(15,2) | `subtotal × taxPct / 100`                                     |
| total          | Decimal(15,2) | `subtotal + taxAmount`                                         |
| description    | String        | Milestone label                                                |
| sentAt         | DateTime?     | Set when status → sent                                         |
| paidAt         | DateTime?     | Set when status → paid                                         |
| reminderSentAt | DateTime?     | Last reminder sent timestamp; used for 7-day deduplication    |

---

### InvoiceSequence
Singleton counter per year for internal reference auto-numbering.

| Field   | Type | Notes                     |
|---------|------|---------------------------|
| year    | Int PK |                          |
| lastSeq | Int  | Incremented atomically via upsert |
