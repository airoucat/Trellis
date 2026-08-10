# User Intent Routing

Users do not need to say Trellis skill names, phase names, or task commands.
Infer the next action from message meaning and local state:

- Active task status.
- Existing prd.md, design.md, implement.md, evidence.md, and research files.
- Git dirty state and changed file types.
- Recent journal entries.
- Graphify availability and staleness.
- Verification and runtime evidence state.

Do not treat examples as keyword triggers. They are examples of meaning.

## Confidence Policy

High confidence: proceed and briefly state the assumed mode.

Medium confidence: do reversible read-only or planning work first, then ask
before code changes.

Low confidence: ask one focused question.

Always ask before destructive operations, external side effects, broad scope
changes, new task creation when an active task exists, or finish/archive when
evidence is missing.

## Examples

"Take a look" means read-only research by default.

"This feels weak" means planning risk review, or check plus hostile review when
work is already in progress.

"Go with that" means execute only when implement.md exists or the scope is
clear enough to avoid guessing.

"Fix this" means reproduce or localize first unless the bug and task context are
already explicit.

"Can this close" means check evidence, graphify, and finish gates first.
