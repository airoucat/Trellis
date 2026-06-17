# No Legacy Authority

Do not revive old authority paths by accident.

When replacing a pipeline, config source, runtime owner, or data source:

- Find the old path.
- Find all call sites.
- Decide whether it is removed, adapted, or kept as compatibility code.
- Add tests or evidence showing the old path cannot silently override the new
  one.

Compatibility code must be explicit and documented.
