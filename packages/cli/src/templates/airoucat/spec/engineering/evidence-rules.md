# Evidence Rules

Completion claims require evidence. Code changes alone do not count as done.

Use evidence.md for complex tasks and any task that changes runtime behavior.

## Evidence.md Shape

```markdown
# Evidence

## Verification Commands

| Command | Result | Timestamp | Notes |
|---|---|---|---|

## Runtime / Manual Evidence

| Evidence | Source | Result | Notes |
|---|---|---|---|

## Not Verified

- [ ] Item:
  Reason:
  Risk:

## Completion Claim

- [ ] Code changed as planned
- [ ] Tests or equivalent verification completed
- [ ] Runtime evidence recorded if runtime behavior changed
- [ ] Docs/spec updated if behavior changed
- [ ] graphify rebuilt if code changed
```

## Rules

- No evidence.md means no done claim for complex work.
- A failed command must stay visible; do not rewrite it as verified.
- CI passing does not prove runtime behavior.
- Not Verified is allowed, but it must include reason and risk.
- Finish/archive can proceed with risk only when the user explicitly accepts
  that risk and the risk is recorded.
