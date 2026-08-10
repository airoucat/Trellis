---
name: trellis-hostile-review
description: "Use when the user asks for harsh review, adversarial review, hostile review, find holes, stability review, fake completion checks, or when code is ready but verification or evidence may be insufficient. Review diff, task artifacts, specs, tests, graphify context, and completion evidence before allowing finish."
---

# Trellis Hostile Review

Review the current work as if it has hidden defects.

## Inputs

Read, when present:

- `.trellis/workflow.md`
- active task `prd.md`, `design.md`, `implement.md`, `evidence.md`
- relevant `.trellis/spec/` files
- `git status --short`
- `git diff --stat`
- `git diff`
- graphify reports only as navigation hints

## Checks

1. Plan and code drift.
2. Architecture boundary violations.
3. Old authority or old pipeline paths revived by accident.
4. Tests that do not prove the behavior they claim to prove.
5. Documentation that says done while code or evidence is missing.
6. Missing runtime or manual evidence.
7. Unrelated file changes.
8. Hidden external side effects.
9. Backward compatibility breakage.
10. Spec files that should be updated but were not.

## Output

```markdown
# Hostile Review Report

## Verdict

PASS / PASS_WITH_RISK / BLOCKED

## Critical Findings

## Boundary Drift

## Evidence Gaps

## Test Gaps

## Scope Creep

## Required Fixes Before Finish

## Optional Follow-ups
```

Use BLOCKED when finish would be dishonest. Use PASS_WITH_RISK only when the
risk is explicit, recorded, and acceptable for the current task.
