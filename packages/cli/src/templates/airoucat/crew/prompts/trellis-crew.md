# Trellis Crew

Use the `trellis-crew` skill for the active Trellis task.

Do not create a second task/workflow state. Treat `.trellis/` artifacts as canonical, decompose the approved implementation into bounded work packages, dispatch only disjoint packages through `trellis_subagent` with `agent: "trellis-worker"`, integrate the real diff, then run a separate `trellis-check` review and the Airoucat evidence gate.

If planning is not approved, complexity exceeds budget, write sets overlap, or a worker returns `MODEL_MISMATCH` / `FAILURE_PACKET`, stop crew execution and return to architecture review instead of adding another patch.
