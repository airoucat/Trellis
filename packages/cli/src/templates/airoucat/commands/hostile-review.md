# Hostile Review

Run a hostile review of the current task or diff.

Load the `trellis-hostile-review` skill and produce the fixed report format.
If blocking findings exist, do not archive or claim completion. If evidence is
missing, route to `needs_evidence` and update evidence.md before finish.
