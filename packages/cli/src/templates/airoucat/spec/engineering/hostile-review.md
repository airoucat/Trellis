# Hostile Review

Hostile review assumes the change may have hidden problems.

## Required Checks

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

## Report Format

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

Use BLOCKED when a required condition for finish is missing. Use PASS_WITH_RISK
only when the risk is explicit and acceptable for the current task.
