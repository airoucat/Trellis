# Upstream Sync

This checkout tracks:

- `origin`: `https://github.com/airoucat/Trellis.git`
- `upstream`: `https://github.com/mindfold-ai/Trellis.git`

The local baseline in this workspace was created from Airoucat commit:

```text
29b5141b80bee0d362c58592cc335379a838c862
```

Git fetch was slow in this environment, so the source tree was populated from
the GitHub archive for that commit and committed locally as a baseline.

## Suggested Sync Flow

```bash
git fetch upstream main
git checkout main
git merge --ff-only upstream/main
git checkout codex/airoucat-trellis-plan
git rebase main
pnpm --filter @mindfoldhq/trellis-core build
pnpm --filter @mindfoldhq/trellis exec vitest run test/commands/init.integration.test.ts -t airoucat
```

If the local history was created from an archive, replace it with a normal Git
clone before pushing to a shared remote.
