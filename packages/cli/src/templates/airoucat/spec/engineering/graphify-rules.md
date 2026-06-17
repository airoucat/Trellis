# Graphify Rules

Graphify is a code navigation map. It is not a source of truth.

## Rules

- Do not commit graphify-out/.
- Read graphify reports to locate likely modules, then inspect source.
- Do not cite graphify as the only evidence for behavior.
- After code changes, refresh graphify before finish unless disabled.
- If refresh is skipped, record the reason in evidence.md.

## Expected Commands

```bash
npm run graphify:setup
npm run graphify:rebuild
```

The commands may be pnpm/yarn equivalents when the project uses those tools.
