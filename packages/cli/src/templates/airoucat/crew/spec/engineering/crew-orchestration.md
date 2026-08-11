# Crew Orchestration

This spec governs Airoucat Pi crew mode. It exists to increase implementation throughput without creating a second source of truth or turning parallel agents into a patch amplifier.

## Authority Chain

Canonical order:

1. Current source and runtime evidence.
2. Trellis active task (`prd.md`, `design.md`, `implement.md`, task metadata).
3. Project specs and curated research/evidence.
4. Main-session integration decisions that stay inside the approved artifacts.
5. Worker output.
6. Magic Context recall.

Lower layers may inform higher layers but never override them silently.

Magic Context is not a task database. AFT is not an architecture owner. A worker is not allowed to redefine acceptance because implementation became inconvenient.

## Crew Roles

- **Foreman:** main Pi session. Decomposes, dispatches, monitors, integrates, escalates.
- **Worker:** `trellis-worker`, normally pinned to the configured high-throughput model. Owns exactly one bounded work package.
- **Reviewer:** `trellis-check`, dispatched only after integration. It normally inherits the stronger main-session model.
- **Trellis:** owns lifecycle, artifacts, evidence and closeout.

## Parallel-Safety Contract

Each work package declares an expected write set before dispatch.

Parallel mode is allowed only when:

- write sets are disjoint;
- no package changes the same state owner, schema, public contract, migration, or generated source of truth;
- one package does not require another package's uncommitted implementation to reason correctly;
- integration can be validated with a family-level test after all packages return.

If these conditions cannot be established, use single or chain execution.

Default parallel width is 2-3 workers. Six is a hard tool ceiling, not a target.

## Complexity Budget

Score proposed exception/special-case complexity:

| Change | Points |
| --- | ---: |
| New branch/condition solely for a failure | +1 |
| New flag/state/retry/fallback/cache/timeout path | +1 |
| New cross-layer compatibility or special-case path | +1 |
| Second writer/owner for already-owned state | +2 |
| Bypass canonical interface/direct authoritative mutation/duplicate core logic | +2 |

Decision:

- **0-2:** implementation may proceed.
- **3-4:** architecture review required before further code changes.
- **5+:** default `MODEL_MISMATCH`; freeze the canonical path and redesign.

This budget applies to the whole failure family, not to each diff hunk separately.

## Failure Classification

Every repeated failure must be classified before another repair:

- `IMPLEMENTATION_BUG`: code violates an approved, coherent model.
- `MODEL_GAP`: approved model lacks a necessary contract/case.
- `MODEL_MISMATCH`: satisfying the scenario pushes the model toward duplicate authority, bypasses, or excessive exceptions.

Classification is evidence-based. A failing test is not automatically an implementation bug.

## Stop-Loss

The same failure family gets at most three repair attempts across the crew.

A repair attempt is any code change intended primarily to make that failure family pass. Parallel workers encountering the same family consume the same shared count.

After the third failed repair:

1. stop dispatching workers for that family;
2. do not weaken tests or acceptance;
3. preserve the last canonical clean path when possible;
4. produce one failure packet with reproduction, attempts, complexity score, classification, and architecture question;
5. move the task back to planning/model review.

## Evidence

Worker-local green tests are necessary but not sufficient. The foreman must run integration/family tests across worker boundaries. Runtime-heavy `mod` profile changes still require runtime evidence according to the Airoucat evidence rules.

The reviewer must inspect the real diff and Trellis artifacts. Worker summaries and Magic Context memories are not evidence of correctness.
