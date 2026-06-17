<!-- AIR_OUCAT:START -->

## Airoucat Trellis Mode

When this project enables Airoucat mode, users should not need to name Trellis
skills, phases, or internal commands. Infer the safest mode from the user's
intent and current Trellis state.

- Read-only or planning work can proceed when low risk.
- Code changes require clear scope or a reviewed implement.md.
- Finish requires evidence.md, verification results, and graphify refresh when
  graphify is enabled and code changed.
- Hostile review is the default route for requests like "find holes", "is this
  stable", "review harshly", or "can this close".

Graphify is a map, not the source of truth. Always return to source files,
task artifacts, specs, tests, logs, or runtime evidence before making claims.

<!-- AIR_OUCAT:END -->
