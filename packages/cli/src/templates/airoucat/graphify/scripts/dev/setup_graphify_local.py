from __future__ import annotations

import argparse
import os
import stat
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
HOOK_DIR = REPO_ROOT / ".githooks"
OUT_DIR = REPO_ROOT / "graphify-out"


def ensure_graphify() -> None:
    try:
        import graphify  # noqa: F401
        return
    except ImportError:
        print("[graphify] installing graphifyy with the current Python")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--user", "graphifyy"],
            cwd=REPO_ROOT,
            check=True,
        )
        import graphify  # noqa: F401


def ensure_hook_permissions() -> None:
    if os.name == "nt" or not HOOK_DIR.exists():
        return
    for path in HOOK_DIR.iterdir():
        if path.is_file():
            mode = path.stat().st_mode
            path.chmod(mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def configure_hooks_path() -> None:
    subprocess.run(
        ["git", "config", "--local", "core.hooksPath", ".githooks"],
        cwd=REPO_ROOT,
        check=True,
    )


def rebuild_code_graph(reason: str) -> int:
    ensure_graphify()
    from graphify.watch import _rebuild_code

    print(f"[graphify] rebuild requested: {reason}")
    ok = _rebuild_code(REPO_ROOT)
    if not ok:
        print("[graphify] rebuild failed", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / ".graphify_python").write_text(sys.executable, encoding="utf-8")
    return 0


def install_local_automation(skip_rebuild: bool) -> int:
    ensure_graphify()
    ensure_hook_permissions()
    configure_hooks_path()
    print("[graphify] git hooks path set to .githooks")
    if skip_rebuild or (OUT_DIR / "graph.json").exists():
        return 0
    return rebuild_code_graph("initial-install")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install repo-local graphify automation."
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="rebuild graphify-out instead of installing hooks",
    )
    parser.add_argument(
        "--reason",
        default="manual",
        help="human-readable trigger label for logs",
    )
    parser.add_argument(
        "--skip-rebuild",
        action="store_true",
        help="configure hooks only; do not build graphify-out on setup",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.rebuild:
        return rebuild_code_graph(args.reason)
    return install_local_automation(args.skip_rebuild)


if __name__ == "__main__":
    raise SystemExit(main())
