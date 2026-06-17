# Integration Test Policy

Runtime integration tests should cover the behavior users actually rely on.

For mod, game, automation, or agent projects, prefer a small repeatable smoke
command over a broad claim. Record:

- Command or manual action.
- Environment.
- Result.
- Logs or screenshots when available.
- Known gaps.

If integration testing is impossible in the current environment, record why and
what risk remains.
