---
name: trellis-crew
description: Use Pi Trellis subagents as a bounded construction crew for an approved active task. Decompose work, dispatch non-overlapping DeepSeek workers, integrate, then run strong review and evidence gates.
---
# Trellis Crew

Use this skill when the user asks to implement an approved Trellis task with a construction crew, multiple workers, parallel implementation, or equivalent language.

## Canonical Ownership

The crew is an execution layer, not a second workflow engine.

- Trellis owns task identity, PRD, design, implementation plan, specs, evidence, status, and finish/archive gates.
- The main Pi session owns decomposition, dispatch, integration, and escalation.
- `trellis-worker` owns only one delegated work package at a time.
- `trellis-check` is the independent review pass and should normally inherit the main session's stronger model.
- Magic Context is long-term recall only; memories cannot override Trellis artifacts or current source.
- AFT improves code perception and edits; it cannot approve architecture or completion.

## Preconditions

Before dispatching workers:

1. Resolve the active task with `python3 ./.trellis/scripts/task.py current --source`.
2. Read current phase context and the task's `prd.md`.
3. For a complex task, require `design.md` and `implement.md` to be ready.
4. Confirm blocking user-owned decisions are empty and implementation is actually authorized.
5. Check the planned change against the complexity budget in `crew-orchestration.md`.

If the plan is not ready, remain in Trellis planning. Do not use worker count as a substitute for architectural clarity.

## Decompose Before Dispatch

Turn `implement.md` into bounded work packages. Every package must state:

- objective and acceptance mapping;
- expected write set (files/symbols);
- dependencies on other packages;
- focused verification command(s);
- explicit non-goals.

Parallelize only packages whose write sets are demonstrably disjoint. Shared files, shared state owners, schema migrations, or tightly coupled interfaces should use `single` or `chain` mode instead.

Default to 2-3 workers. The Pi Trellis tool may support more, but use more only when the plan has genuinely independent work. Never create parallelism merely to keep agents busy.

## Dispatch Contract

Use `trellis_subagent` with `agent: "trellis-worker"`.

Every worker prompt must begin with:

`Active task: <current task path>`

Then include exactly one bounded work package and its declared write set. For independent packages, use `mode: "parallel"`; otherwise use `single` or `chain`.

Do not dispatch `trellis-check` in parallel with active implementation workers.

## Integrate

After workers return:

1. Read every worker result, including complexity score and verification evidence.
2. Stop immediately on `MODEL_MISMATCH`, complexity >= 3, overlapping writes, or a Stop-Loss packet. Return to architecture review instead of patching around it.
3. Inspect the real diff. Worker summaries are not authoritative.
4. Resolve integration issues in the main session only when they remain inside the approved model and complexity budget.
5. Run family-level tests that cross worker boundaries.

## Review and Finish

After integration, dispatch `trellis-check` separately. Do not pin it to the worker model unless the user explicitly asks. The default is deliberate separation: cheap/high-throughput workers implement; the stronger parent/reviewer checks the assembled result.

Then follow the Airoucat evidence gate:

- update `evidence.md` with commands and runtime evidence;
- run hostile review when required;
- refresh graphify when enabled and code changed;
- do not claim done or archive while required evidence is missing.

## Stop-Loss

The same failure family gets at most three repair attempts across the whole crew, not three attempts per worker. If several workers hit the same family, count them together. Once the limit is reached, stop dispatching repairs and produce one consolidated failure packet for architecture review.
