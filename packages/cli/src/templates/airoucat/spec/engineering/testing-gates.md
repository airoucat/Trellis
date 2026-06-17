# Testing Gates

Choose verification based on risk.

Small text or template changes can use focused tests and file inspection.

Shared logic, public CLI behavior, task lifecycle, config parsing, and user
visible workflow behavior need automated tests.

Runtime-heavy changes need runtime or manual evidence in addition to tests.

When a test cannot run, record the command, failure, reason, and risk instead
of claiming it passed.
