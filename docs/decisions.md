# Architectural Decisions

Captures the "why" behind non-obvious choices. Useful context for future iterations.

---

## ADR-001 — Unit price snapshotted at CostItem creation

**Decision:** When a CostItem is added to a project, the APU unit price is computed from live resource prices and stored in `CostItem.unitCostBudgeted`. This value is never updated after creation.

**Why:** Resource prices change over time (market updates, new supplier quotes). A project budget must reflect the estimate at the time it was approved, not current market rates. Recomputing live would cause budget drift and make historical reports unreliable.

**Trade-off:** If you want to re-estimate a budget line with updated prices, you must delete and re-add the CostItem.

---

## ADR-002 — Execution totals derived, not stored

**Decision:** `totalPaid`, `totalPending`, and `status` on a Commitment are never stored as columns. They are always computed from `Σ payment.amount` at query time and enriched server-side in `getProject`.

**Why:** Storing running totals requires keeping them in sync with every payment insert/delete, introducing consistency risk. Summing at query time is always accurate, and the payment count per commitment is small.

---

## ADR-003 — Commitment uses CostItem as the budget anchor, not APUItem

**Decision:** Commitments are linked to `CostItem` (the project's budget line), not directly to `APUItem` (the template).

**Why:** The same APU template can appear multiple times in a project with different quantities. Linking to `APUItem` would be ambiguous. The `CostItem` is the specific, quantified instance within the project.

**Resource mapping:** A commitment can optionally also link to a `Resource` (via `resourceId`) to indicate which specific material or labor type the spend relates to. This is optional metadata — the CostItem remains the budget anchor.

---

## ADR-004 — No shadcn/ui, plain Tailwind

**Decision:** UI built with plain HTML + Tailwind CSS classes. No component library.

**Why:** shadcn/ui init failed during scaffolding due to file structure conflicts. Given the POC stage and the existing Stitch-designed UI reference, building components from scratch was faster and gave full control over styling.

---

## ADR-005 — tsx instead of ts-node for seed script

**Decision:** Seed script runs via `npx tsx prisma/seed.ts`.

**Why:** `ts-node` with `--compiler-options {"module":"CommonJS"}` fails on Windows due to shell quoting issues with JSON arguments. `tsx` handles TypeScript execution without requiring compiler option flags.

---

## ADR-006 — ProjectExpense replaced by Commitment + Payment

**Decision:** `ProjectExpense` was removed. Execution tracking now uses two tables: `Commitment` (the agreed total) and `Payment` (individual disbursements).

**Why:** A single-amount expense model cannot represent partial payments. Field managers often commit funds before paying, and contracts are frequently paid in installments. The new model handles both extremes: a simple fully-paid expense is a Commitment + one auto-created Payment; a phased contract creates one Commitment and payments are added as they occur.

**Simple vs commitment:** The `CommitmentForm` exposes this via a toggle. "Gasto simple" sends `fullyPaid: true` — the API creates both the Commitment and the matching Payment. "Compromiso" sends `fullyPaid: false` — only the Commitment is created; payments are added later.

---

## ADR-007 — Budget execution view: cost-ledger layout

**Decision:** Commitments are the primary rows, grouped under APU/CostItem headers. Replaced the previous APU-first table with nested expense sub-rows.

**Why:** The table-within-table pattern buried day-to-day cost data behind an interaction. Field managers add commitments constantly — those should be the primary content. APU items serve as grouping headers with a progress bar (paid vs budgeted).

**Status badges:** Pagado (green) | Parcial (amber) | Pendiente (slate). Status is derived server-side and sent as a string to the client.

---

## ADR-008 — Server Component + Suspense for project detail data fetching

**Decision:** `proyectos/[id]/page.tsx` is an async Server Component. It calls `getProject(id)` (a Prisma query in `src/lib/data/projects.ts`) directly — no `fetch()` to an internal API route. The enriched project object is passed as a prop to `ProjectDetailClient` (`"use client"`). Mutations call `router.refresh()` to re-run the server component.

**Why:** Eliminates the `useEffect + fetch + useState` pattern that caused "setState in render" warnings with React's concurrent rendering. Server Components can `await` Prisma directly, Suspense handles the loading state declaratively, and `router.refresh()` re-fetches without any client-side fetch wiring.

**Type safety:** Client types are derived from the server function: `type ProjectDetail = Awaited<ReturnType<typeof getProject>>`. No separate type definitions to keep in sync.

**Decimal conversion:** Prisma returns `Decimal` objects. All monetary fields are converted to `number` inside `getProject` before returning, so the client component only sees plain numbers.

---

## ADR-009 — Three CostItem creation modes; APU-less items grouped under "Varios"

**Decision:** `POST /api/projects/[id]/cost-items` accepts a `mode` field (`"apu"` | `"resource"` | `"manual"`). APU-less items (`apuItemId = null`) are rendered in a separate "Varios" section in the ledger. A `PATCH` endpoint allows assigning an APU to a manual item later.

**Why:** Field managers often need to log a cost before the APU template exists, or for a single-resource purchase that doesn't warrant a full APU. Forcing an APU at entry time blocks real workflows. The three modes cover all cases:
- `apu` — composite activity with AIU markup (existing behavior)
- `resource` — single-resource purchase; price from catalog, no AIU
- `manual` — free-form; user sets everything directly

**Resource vs APU pricing:** Resource-based items intentionally have no AIU markup — they represent a raw purchase, not a composite activity. This matches how field managers think about direct material buys.

**Backwards compatibility:** If `mode` is absent and `apuItemId` is present, the API falls back to `"apu"` mode so the old modal continues to work during rollout.

**APU re-assignment:** When a manual item is assigned an APU via PATCH, `description`, `unit`, and `unitCostBudgeted` are all overwritten from the APU. The user is warned in the UI before confirming. `resourceId` is cleared.

---

## Open Questions / TODOs

| # | Question | Status |
|---|---|---|
| TODO-14 | Can a single commitment span multiple CostItems? (e.g. one invoice covers two APU activities) | Deferred |
| TODO-15 | Should Commitment have a direct `phaseId` field for phase-level tracking? | Deferred |
