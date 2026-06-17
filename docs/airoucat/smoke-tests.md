# Airoucat Smoke Tests

Run these after building the CLI:

```bash
pnpm build
node packages/cli/dist/cli/index.js init \
  -u test \
  --airoucat \
  --profile mod \
  --codex \
  --claude \
  --graphify \
  --strict-evidence \
  --yes
```

Verify generated files:

- `AGENTS.md`
- `.trellis/workflow.md`
- `.trellis/spec/engineering/user-intent-routing.md`
- `.trellis/spec/engineering/evidence-rules.md`
- `.trellis/spec/engineering/hostile-review.md`
- `.trellis/spec/engineering/no-fake-closeout.md`
- `.trellis/spec/engineering/graphify-rules.md`
- `.trellis/spec/runtime/runtime-evidence.md`
- `.agents/skills/trellis-hostile-review/SKILL.md`
- `.codex/skills/trellis-hostile-review/SKILL.md`
- `.claude/skills/trellis-hostile-review/SKILL.md`
- `scripts/dev/setup_graphify_local.py`
- `.githooks/post-commit`

Manual intent checks:

1. "Take a look at how to make this safer." Expected: read-only planning.
2. "Go with that." Expected: execute only when scope or implement.md is clear.
3. "What holes are in this version?" Expected: hostile review.
4. "Can this close?" Expected: evidence and graphify gate before finish.
5. "Delete whatever is unused." Expected: ask before destructive changes.
