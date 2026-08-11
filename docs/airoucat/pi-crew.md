# Airoucat Pi Construction Crew

The Pi crew is an optional execution profile for projects already managed by Trellis. It does not replace Trellis task state, specs, evidence, or finish gates.

## Architecture

```text
Trellis task truth / evidence
          |
          v
Main Pi session (foreman / integrator)
          |
          +---- trellis_subagent ----> trellis-worker (DeepSeek V4 Flash)
          |              |             bounded work package
          |              +-----------> trellis-worker (parallel only if disjoint)
          |
          +---- trellis-check -------> independent integrated review
          |
          +---- Magic Context --------> long-lived recall for the foreman
          |
          +---- AFT ------------------> code perception / editing layer
```

Trellis stays canonical. Magic Context is recall, AFT is code tooling, and workers are bounded executors.

## Install in a Trellis-managed project

Recommended for this fork's mod workflow:

```bash
trellis init --crew --profile mod --strict-evidence --graphify
```

`--crew` implies both `--airoucat` and `--pi`, so the same command works for an existing Trellis project that does not yet have Pi configured.

The default worker model is:

```text
deepseek/deepseek-v4-flash
```

Override it with a Pi `provider/model` reference:

```bash
trellis init --crew --crew-model provider/model
```

The worker model belongs to construction workers only. `trellis-check` is deliberately not pinned to it, so a stronger model in the main Pi session can remain the architect, integrator, and reviewer.

## What `--crew` installs

Crew mode layers these files onto the normal Trellis project:

- `.pi/agents/trellis-worker.md`
- `.pi/prompts/trellis-crew.md`
- `.agents/skills/trellis-crew/SKILL.md`
- `.trellis/spec/engineering/crew-orchestration.md`
- `.cortexkit/magic-context.jsonc`
- `.cortexkit/aft.jsonc`

It also patches `.pi/settings.json` non-destructively:

- adds `npm:@cortexkit/pi-magic-context` when missing;
- adds `npm:@cortexkit/aft-pi` when missing;
- preserves unrelated project settings and existing package entries;
- disables Pi built-in compaction so Magic Context is the single long-lived context manager.

`.pi/npm/` and `.pi/git/` are ignored because they are project-local package caches, not project source.

## First Pi launch and trust

Pi project packages are executable extensions. Start Pi interactively in the project, review the project resources, and trust the project before relying on crew workers. After trust is saved, project package installation and project-local extensions can load normally.

Keep API credentials outside the repository. Configure the DeepSeek provider/model through Pi's normal authentication or model configuration. Trellis stores only the model reference used by the worker profile.

## Magic Context role

Magic Context is used only as long-lived recall for the foreman. The generated project config enables it and assigns the configured crew model to the historian.

Dreamer and sidekick are not enabled by the crew template. Add them later only if there is a concrete need for autonomous background memory maintenance.

Trellis child workers receive a bounded snapshot of the active task directly from `trellis_subagent`. Their environment sets `MAGIC_CONTEXT_PI_SUBAGENT=1`, preventing a second full Magic Context runtime from competing with Trellis task-context injection inside each short-lived worker.

Do not stack another automatic compaction/context manager on top without re-evaluating ownership. One long-lived context owner is easier to reason about and debug.

## AFT role

AFT is installed as a Pi project package. It improves code navigation, reading, editing, and structural analysis. It is not allowed to define task state, architecture, acceptance, or evidence.

The worker frontmatter requests Pi's standard file/code tools. When AFT replaces those core Pi tools, workers benefit without requiring an AFT-specific workflow branch. The main session may also use AFT's additional analysis tools when useful.

## Running the crew

Use normal language such as:

- `用施工队按这个 implement.md 做`
- `这几个模块可以并行施工`
- `use the crew for the approved implementation`

Airoucat routes that intent to `trellis-crew` only after the Trellis plan is ready and implementation is authorized.

The foreman must decompose work into packages with:

1. objective and acceptance mapping;
2. expected write set (files/symbols);
3. dependencies;
4. focused verification commands;
5. explicit non-goals.

Parallel mode is allowed only for demonstrably disjoint write sets. Default to 2-3 workers. Six is the current Trellis Pi tool ceiling, not a target.

## Complexity and Stop-Loss

Crew mode applies one shared budget to the failure family, not one budget per worker.

- complexity 0-2: implementation may continue;
- complexity 3-4: stop and return to architecture review;
- complexity 5+: default to `MODEL_MISMATCH` and freeze the canonical path;
- the same failure family gets at most three repair attempts across the whole crew.

A worker that crosses a gate returns a `FAILURE_PACKET` instead of adding another patch. The main session consolidates that packet and moves the Trellis task back to planning/model review.

## Integration and review

Workers do not commit, push, merge, publish, or deploy.

After workers return, the foreman:

1. inspects the real diff;
2. rejects overlapping or out-of-scope changes;
3. runs family/integration tests across worker boundaries;
4. dispatches a separate `trellis-check` review;
5. updates `evidence.md` and runtime evidence;
6. runs hostile review when required;
7. refreshes Graphify when enabled and code changed;
8. only then allows normal Trellis finish/archive gates.

## `trellis update`

Crew mode is durable across normal Trellis template updates. The fork re-applies the installed Airoucat/crew overlay to the new upstream desired template map before update conflict analysis. This keeps upstream Pi/workflow/config refreshes from silently deleting crew packages or Airoucat authority rules while preserving Trellis's existing hash-based user-modification safeguards.

`.trellis/spec/engineering/crew-orchestration.md` remains under Trellis's protected spec area after initialization, so project-specific edits to that policy are treated as project-owned engineering rules rather than regenerated on every update.
