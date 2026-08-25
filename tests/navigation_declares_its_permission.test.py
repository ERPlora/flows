#!/usr/bin/env python3
"""Every `navigation[]` entry declares the permission that OPENS it (ERPlora/hub#1052).

Why this file exists: this module painted its «Automations» tab for everybody. Its
`role_permissions` gives `manager: []` and `employee: []`, and the core flows API behind the tab
answers `403` to anyone who is not an admin — the component says so itself:

    «a cashier gets 403, and telling them to check their permissions would send them somewhere
     they cannot go»                        (ui/components/erp-flows-app/erp-flows-app.ts)

So a cashier saw a tab, tapped it, and hit a wall the module had already predicted. The manifest
had nowhere to write «this tab is for admins» — `navigation[]` did not accept a `permission`.

It does now: hub#1052 added `navigation[].permission` to `schemas/module.schema.json` (mirrored in
the toolkit) and `GET /api/navigation` filters with `permissions::has`, the SAME predicate the real
door uses, so the menu and the refusal cannot disagree. This is NOT the gate — the runtime
revalidates every query and command behind it; it is «do not show a door that is locked».

This test is the module's half. It is a SOURCE test, in Python so the module gate picks it up
(`erplora test` collects `tests/**/*.test.py`), and it needs neither Postgres nor a hub: a tab that
appears for the wrong role raises no error anywhere, so something has to look at it for you or the
next tab arrives ungated again.

Usage: tests/navigation_declares_its_permission.test.py   (exit 0 = green).
"""

import json
import pathlib
import sys

MODULE_DIR = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = MODULE_DIR / "module.json"

failures: list[str] = []


def check(label: str, expected, actual):
    if expected != actual:
        failures.append(f"{label} — expected [{expected}], got [{actual}]")
        print(f"  FAIL: {label} — expected [{expected}], got [{actual}]")
    else:
        print(f"  ok: {label} = {expected}")


def main() -> int:
    manifest = json.loads(MANIFEST.read_text())
    navigation = manifest.get("navigation") or []
    declared = set(manifest.get("permissions") or [])

    print(
        f"· {len(navigation)} navigation entry/entries, {len(declared)} declared permission(s)"
    )
    check("this module has navigation to gate at all", True, bool(navigation))

    ungated = [entry.get("id") for entry in navigation if not entry.get("permission")]
    check("every tab says which permission opens it", [], ungated)

    # A permission this module does not define can never be held: the tab would vanish for
    # everybody, admin included, and the manifest would look correct while the screen was gone.
    unknown = [
        f"{entry.get('id')} → {entry.get('permission')}"
        for entry in navigation
        if entry.get("permission") and entry["permission"] not in declared
    ]
    check("each tab names a permission this module actually defines", [], unknown)

    if failures:
        print(
            "\nA tab without `permission` is served to every role, including the ones whose only\n"
            "possible answer from the runtime is a 403. Declare it in module.json → navigation[]."
        )
        return 1
    print("\nOK: no tab in this module is offered to a role that cannot open it")
    return 0


if __name__ == "__main__":
    sys.exit(main())
