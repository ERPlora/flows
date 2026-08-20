#!/usr/bin/env python3
"""Resolving a draft twice must not erase the flow it turned into (ERPlora/flows#35).

WHAT WAS WRONG. `commands/draft_resolve.sql` matched on `id`, `hub_id` and `is_deleted` and NOTHING
ELSE, so a draft that had already been resolved could be resolved again. The second call is the
damaging one: `flow_id` is a REQUIRED payload field that carries the empty string when the outcome
is `dismissed` (`schemas/draft_resolve.json`), so

    used(flow_id='flow-7')  →  dismissed(flow_id='')

overwrote `flow_id` with `''` and cut the draft→flow link. `migrations/postgres/001_drafts.sql:30`
says what that column is for: «The flow it turned into, once somebody accepted it» — the record
that the assistant proposed this and a person accepted it. Losing it loses the audit trail.

`min_affected_rows: 1` did NOT catch it, and that is the subtle part: the row updates perfectly.
The gate counts rows, and one row was written — it just should not have been. A gate on the COUNT
cannot express «only from this state»; that has to be in the `WHERE`.

THE PATTERN WAS ALREADY IN THE HOUSE. `whatsapp_inbox` expresses exactly this guard in the `WHERE`
in three places — `request_approve.sql`, `request_reject.sql`, `_fulfill_transition.sql` — all with
`AND status = '<expected>'`, and its comment states the contract this test now pins: «si la fila no
está en pending_review no se actualiza (0 filas afectadas → el runtime devuelve error)».

WHAT IS REPRODUCED of the runtime: the command's `sql[]` bound with the system params and run in one
transaction, and the `min_affected_rows` gate weighed over the rows the statements affected — the
same arithmetic `commands.rs` does before deciding whether to commit and emit.

Usage: tests/draft_resolve_guard.pg.test.py   (exit 0 = green)
  Uses the `erplora-test-pg-5433` container (override: FLOWS_TEST_PG_CONTAINER).
"""

import json
import os
import pathlib
import re
import subprocess
import sys
import uuid

MODULE_DIR = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = json.loads((MODULE_DIR / "module.json").read_text())
CONTAINER = os.environ.get("FLOWS_TEST_PG_CONTAINER", "erplora-test-pg-5433")

COMMAND = "flows.drafts.resolve"
SQL_FILE = "commands/draft_resolve.sql"

HUB = "hub-under-test"
OTHER_HUB = "hub-next-door"
USER = "u-owner"
NOW = "2026-08-18T10:00:00Z"

PARAM = re.compile(r":([a-z_][a-z0-9_]*)", re.IGNORECASE)
TAG = re.compile(
    r"^(?:INSERT\s+\d+\s+(\d+)|UPDATE\s+(\d+)|DELETE\s+(\d+))\s*$", re.MULTILINE
)

failures: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


class CommandRejected(RuntimeError):
    """`min_affected_rows` refused the mutation: the whole transaction rolls back."""


def literal(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def bind(sql: str, params: dict) -> str:
    return PARAM.sub(lambda m: literal(params.get(m.group(1))), sql)


def container_available() -> bool:
    try:
        subprocess.run(
            ["docker", "inspect", CONTAINER], capture_output=True, check=True, text=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


class ScratchDb:
    def __init__(self, prefix: str):
        self.name = f"{prefix}_{os.getpid()}_{uuid.uuid4().hex[:6]}"

    def psql(self, args, db=None, stdin=None) -> str:
        cmd = [
            "docker",
            "exec",
            "-i",
            CONTAINER,
            "psql",
            "-v",
            "ON_ERROR_STOP=1",
            "-U",
            "postgres",
            "-X",
        ]
        if db:
            cmd += ["-d", db]
        res = subprocess.run(cmd + args, input=stdin, capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(res.stderr.strip() or res.stdout.strip())
        return res.stdout

    def create(self) -> None:
        self.psql(["-c", f'DROP DATABASE IF EXISTS "{self.name}"'])
        self.psql(["-c", f'CREATE DATABASE "{self.name}"'])
        for rel in MANIFEST["migrations"]["postgres"]:
            self.psql([], db=self.name, stdin=(MODULE_DIR / rel).read_text())

    def drop(self) -> None:
        try:
            self.psql(["-c", f'DROP DATABASE IF EXISTS "{self.name}" WITH (FORCE)'])
        except RuntimeError as exc:
            print(f"  ! could not drop {self.name}: {exc}")

    def scalar(self, sql: str) -> str:
        return self.psql(["-tAc", sql], db=self.name).strip()

    def resolve(self, draft_id: str, outcome: str, flow_id: str, hub: str = HUB) -> int:
        """Run `flows.drafts.resolve` the way the runtime does, gate included."""
        cmd = MANIFEST["commands"][COMMAND]
        params = {
            "id": draft_id,
            "outcome": outcome,
            "flow_id": flow_id,
            "hub_id": hub,
            "current_user_id": USER,
            "now": NOW,
        }
        script = ["BEGIN;"]
        for rel in cmd["sql"]:
            script.append(bind((MODULE_DIR / rel).read_text(), params))
        script.append("COMMIT;")
        out = self.psql([], db=self.name, stdin="\n".join(script))
        affected = sum(
            int(next(g for g in m.groups() if g is not None)) for m in TAG.finditer(out)
        )

        minimum = cmd.get("min_affected_rows")
        if minimum is not None and affected < minimum:
            raise CommandRejected(f"affected {affected}, required {minimum}")
        return affected

    def seed_draft(
        self,
        draft_id: str,
        *,
        hub: str = HUB,
        status: str = "pending",
        flow_id: str = "",
        deleted: int = 0,
    ) -> None:
        self.psql(
            [],
            db=self.name,
            stdin=(
                "INSERT INTO flows_flowdraft (id, hub_id, name, definition, notes, status, "
                "flow_id, is_deleted, created_at) VALUES ("
                f"{literal(draft_id)}, {literal(hub)}, 'Draft', '{{}}', '[]', {literal(status)}, "
                f"{literal(flow_id)}, {deleted}, {literal(NOW)});"
            ),
        )

    def draft(self, draft_id: str) -> dict:
        raw = self.scalar(
            "SELECT row_to_json(t) FROM (SELECT status, flow_id FROM flows_flowdraft "
            f"WHERE id = {literal(draft_id)}) t"
        )
        return json.loads(raw) if raw else {}


def check_sql_guard() -> None:
    """The guard belongs in the WHERE — a row gate cannot express «only from this state»."""
    sql = (MODULE_DIR / SQL_FILE).read_text()
    body = re.sub(r"--[^\n]*", " ", sql)
    if not re.search(r"status\s*=\s*'pending'", body):
        fail(
            f"{SQL_FILE} has no `AND status = 'pending'` in its WHERE: an already-resolved draft is "
            "updated again, and `min_affected_rows` cannot catch it because the row DOES update "
            "(flows#35)"
        )


def check_behaviour(db: ScratchDb) -> None:
    db.seed_draft("d-live")
    db.seed_draft("d-other", hub=OTHER_HUB)
    db.seed_draft("d-gone", deleted=1)

    # --- check the check: resolving a PENDING draft must work, or every rejection below is vacuous.
    try:
        affected = db.resolve("d-live", "used", "flow-7")
    except CommandRejected as exc:
        fail(f"resolving a PENDING draft was rejected ({exc}) — the guard is too tight")
        return
    if affected != 1:
        fail(f"resolving a pending draft affected {affected} rows, expected 1")
    after = db.draft("d-live")
    if after.get("status") != "used" or after.get("flow_id") != "flow-7":
        fail(
            f"the first resolve did not record the outcome: {after} — the check proves nothing"
        )
        return

    # --- the bug: resolving AGAIN must not touch the row, and must not erase `flow_id`. ----------
    try:
        affected = db.resolve("d-live", "dismissed", "")
    except CommandRejected:
        pass
    else:
        fail(
            f"the draft was resolved a SECOND time ({affected} row): the caller got a silent success "
            "for something that had already been decided (flows#35)"
        )

    final = db.draft("d-live")
    if final.get("flow_id") != "flow-7":
        fail(
            f"`flow_id` is now {final.get('flow_id')!r}: the draft→flow link the migration exists to "
            "preserve was erased by the second resolve (flows#35)"
        )
    if final.get("status") != "used":
        fail(
            f"the status was overwritten to {final.get('status')!r} by the second resolve"
        )

    # --- and the scoping the SQL already had must survive the new guard. -------------------------
    for label, draft_id in (
        ("a draft of another hub", "d-other"),
        ("a soft-deleted draft", "d-gone"),
    ):
        try:
            db.resolve(draft_id, "dismissed", "")
        except CommandRejected:
            continue
        fail(f"{label} was resolved — scoping lost")


def main() -> int:
    check_sql_guard()

    if not container_available():
        print(f"SKIPPED: no Postgres in container {CONTAINER} (nothing was verified)")
        return 1 if failures else 0

    db = ScratchDb("flows_draft_resolve")
    db.create()
    try:
        check_behaviour(db)
    finally:
        db.drop()

    if failures:
        print(f"FAIL ({len(failures)}):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print(
        "OK: a draft is resolved once, from `pending`, and its flow_id survives a second attempt"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
