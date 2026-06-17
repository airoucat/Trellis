# Airoucat Fork Maintenance

This fork keeps Airoucat behavior as an overlay on top of upstream Trellis.
Prefer changes in these areas:

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/configurators/airoucat.ts`
- `packages/cli/src/templates/airoucat/**`
- `packages/cli/test/commands/init.integration.test.ts`
- `docs/airoucat/**`

Avoid changing core task lifecycle code unless a hard evidence gate requires it.
The first version uses a soft gate through workflow, skills, specs, and
generated evidence rules.

## Local Checks

```bash
pnpm install --frozen-lockfile
pnpm --filter @mindfoldhq/trellis-core build
pnpm --filter @mindfoldhq/trellis exec vitest run test/commands/init.integration.test.ts -t airoucat
pnpm --filter @mindfoldhq/trellis typecheck
```

Run broader tests before release:

```bash
pnpm test
pnpm lint
pnpm build
```

## Release Notes

Keep AGPL-3.0-only license and upstream copyright notices intact. Before any
external service or commercial distribution, review AGPL obligations.
