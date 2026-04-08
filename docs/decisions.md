# Architectural Decisions

Captures the "why" behind non-obvious choices. Useful context for future iterations.

---

## ADR-001 — Unit price snapshotted at CostItem creation

**Decision:** When a CostItem is added to a project, the APU unit price is computed from live resource prices and stored in `CostItem.unitCostBudgeted`. This value is never updated after creation.

**Why:** Resource prices change over time (market updates, new supplier quotes). A project budget must reflect the estimate at the time it was approved, not current market rates. Recomputing live would cause budget drift and make historical reports unreliable.

**Trade-off:** If you want to re-estimate a budget line with updated prices, you must delete and re-add the CostItem.

---

## ADR-002 — totalExecuted derived, not stored

**Decision:** `CostItem.totalExecuted` is not a column in the database. It is always computed as `Σ ProjectExpense.total` at query time.

**Why:** Storing a running total would require keeping it in sync with every expense insert/delete, introducing consistency risk. Summing at query time is always accurate and the dataset per CostItem is small enough to make this cost negligible.

---

## ADR-003 — ProjectExpense uses CostItem as the budget anchor, not APUItem

**Decision:** Expenses are linked to `CostItem` (the project's budget line), not directly to `APUItem` (the template).

**Why:** The same APU template can appear multiple times in a project with different quantities. Linking to `APUItem` would be ambiguous. The `CostItem` is the specific, quantified instance within the project.

**Resource mapping:** An expense can optionally also link to a `Resource` (via `resourceId`) to indicate which specific material or labor type within the APU the spend relates to. This is optional metadata — the CostItem remains the budget anchor.

---

## ADR-004 — No shadcn/ui, plain Tailwind

**Decision:** UI built with plain HTML + Tailwind CSS classes. No component library.

**Why:** shadcn/ui init failed during scaffolding due to file structure conflicts. Given the POC stage and the existing Stitch-designed UI reference, building components from scratch was faster and gave full control over styling.

---

## ADR-005 — tsx instead of ts-node for seed script

**Decision:** Seed script runs via `npx tsx prisma/seed.ts`.

**Why:** `ts-node` with `--compiler-options {"module":"CommonJS"}` fails on Windows due to shell quoting issues with JSON arguments. `tsx` handles TypeScript execution without requiring compiler option flags.

---

## ADR-006 — Expense model does not yet support partial payments (commitments)

**Decision:** `ProjectExpense.total` is a single amount. There is no commitment/abono model yet.

**Why:** The partial payment requirement was identified during UI iteration. The POC validates the core budget tracking flow first. Modeling commitments adds schema complexity (new tables, status derivation logic) that will be designed based on the final UI direction.

**Planned:** Replace or extend `ProjectExpense` with a `Commitment` + `Abono` model. A simple fully-paid expense would be a Commitment with one Abono. Status (`Pagado / Parcial / Pendiente`) derived from `Σ abonos` vs `commitment.total`. See `data-model.md` for the planned schema.

---

## ADR-007 — Budget execution view: cost-ledger over nested table

**Decision:** The next iteration of the budget execution view will use expenses/commitments as primary rows (grouped by APU), not the current APU-first table with hidden expense sub-rows.

**Why:** The table-within-table pattern is hard to scan and buries the day-to-day data (actual costs) behind an interaction. Field managers add expenses constantly — those should be the primary content. APU items act as grouping headers with a progress indicator.

**Current state:** The existing expandable-row implementation remains functional while the new design is validated in Stitch.

---

## Open Questions / TODOs

| # | Question | Status |
|---|---|---|
| TODO-14 | Can a single expense span multiple CostItems? (e.g. one invoice covers two APU activities) | Deferred |
| TODO-15 | Should ProjectExpense have a direct `phaseId` field for phase-level tracking? | Deferred |
| TODO-16 | Installment tracking: Commitment + Abono model — schema and UI finalized in next iteration | In design |
| TODO-17 | Budget execution view redesign: cost-ledger layout (expenses as primary rows, grouped by APU) | In design |
