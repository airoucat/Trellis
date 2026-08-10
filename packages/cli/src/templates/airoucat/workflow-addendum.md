<!-- AIR_OUCAT:START -->

## Airoucat Ambient Intent Router

Airoucat mode keeps Trellis phase names out of the user's way. Classify the
user's plain-language intent from the message, active task status, task
artifacts, git state, evidence state, and graphify availability. Do not ask the
user to name a Trellis skill or phase.

High confidence: proceed and briefly state the assumed mode.
Medium confidence: do reversible read-only or planning work first; ask before
code changes.
Low confidence: ask one focused question.

Always ask before destructive operations, external side effects, broad scope
changes, creating a new task while another task is active, or finishing without
evidence.

### Airoucat Intent Examples

- "take a look", "research this", "do not change it yet" -> read-only planning.
- "this feels weak", "find holes", "is this stable" -> planning risk review, or
  hostile review if work is already in progress.
- "go with that", "do it" -> execute only when implement.md exists or the scope is
  otherwise unambiguous.
- "review this", "hostile review" -> run check plus hostile review.
- "finish this", "can we close it" -> require evidence, graphify refresh when
  code changed, and final check before archive.

[workflow-state:needs_evidence]
Implementation exists but evidence is missing. Do not claim completion or
archive the task. Run verification, update evidence.md, refresh graphify if
code changed, then report remaining risk.
[/workflow-state:needs_evidence]

[workflow-state:in_review]
Task is in review. Run normal check plus hostile review. Fix blocking findings
before finish. If the finding is accepted as risk, record it in evidence.md.
[/workflow-state:in_review]

[workflow-state:blocked]
Task is blocked. Do not guess. State the blocker, run one minimal investigation
when safe, or ask one focused question.
[/workflow-state:blocked]

### Evidence Gate

No evidence.md means no done claim. If verification cannot be completed, record
the item under Not Verified with reason and risk. For runtime-heavy profiles,
tests alone do not prove runtime behavior.

### Hostile Review

Hostile review assumes the implementation may have hidden gaps. Check plan drift,
architecture boundaries, old authority paths, fake tests, fake docs, evidence
gaps, unrelated changes, external side effects, and backward compatibility.

### Graphify

When graphify is enabled, treat graphify-out as a code navigation map only. It
does not replace source, specs, tests, logs, or runtime evidence. If code changed,
refresh graphify before finish or record why it was skipped.

<!-- AIR_OUCAT:END -->
