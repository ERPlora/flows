#!/usr/bin/env python3
"""«Do I already have this automation?» must be answerable WITHOUT `manage_flows`
(ERPlora/whatsapp_inbox#79).

WHAT IS BEING PINNED. A module that offers a shortcut into the gallery — «Book appointments» in
WhatsApp's settings — has no way of telling «this is still to do» from «this has been running for
three weeks», so it invites the owner to build a second automation that answers the same message
twice. The only door into the kernel's flows is `/api/hub/flows*`, gated behind `manage_flows`,
«la capability con más alcance de todas» (`crates/runtime/src/manifest.rs`): it hands its holder
every automation of the business and the event catalogue, which carries customers' names. An inbox
module cannot hold that to paint a badge.

So the answer is a READ query of this module, of the smallest possible scope: given an event and a
command, how many of this hub's automations listen to that event, how many of them are switched on,
and how many were created but never granted the command they need. Three integers. No names, no
definitions, no ids, nothing about any other automation of the business.

WHAT IS REPRODUCED of the runtime: `queries.rs` binds `:hub_id` from the request context (never
from the payload) and runs the SQL as written. So the SQL is bound here the same way and run
against the core tables of a scratch database, seeded from `contracts/kernel/tables.snapshot`.

THE TENANCY CASE IS NOT DECORATION. `_flow` is a CORE table: the runtime does not scope it for a
module the way it scopes the module's own rows, so a missing `hub_id` in this WHERE would show one
salon the automations of another. It is checked twice — a neighbour's flow must count nowhere.

Usage: tests/automations_status.pg.test.py   (exit 0 = green)
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

QUERY = "flows.automations.status"

HUB = "hub-under-test"
OTHER_HUB = "hub-next-door"
NOW = "2026-09-07T10:00:00Z"

# The use the card asks about: the WhatsApp recipe that books appointments
# (`whatsapp_inbox/flows/appointment-from-whatsapp.en.flow.json`).
EVENT = "hub.whatsapp.message_received"
COMMAND = "appointments.availability.day_opening"

PARAM = re.compile(r":([a-z_][a-z0-9_]*)", re.IGNORECASE)

# The core tables this query reads, as `hub/contracts/kernel/tables.snapshot` declares them. Only
# the columns the query touches plus the keys that join them — a fuller copy would be a second
# schema to keep in step for no gain.
CORE_DDL = """
CREATE TABLE _flow (
  id text NOT NULL, hub_id text NOT NULL, name text NOT NULL,
  enabled integer NOT NULL, definition text NOT NULL DEFAULT '{}',
  deleted_at text NULL, created_at text NOT NULL DEFAULT ''
);
CREATE TABLE _flow_triggers (
  id text NOT NULL, hub_id text NOT NULL, flow_id text NOT NULL,
  trigger_key text NOT NULL, kind text NOT NULL, event_name text NOT NULL DEFAULT '',
  enabled integer NOT NULL DEFAULT 1, deleted_at text NULL
);
CREATE TABLE _flow_grants (
  id text NOT NULL, hub_id text NOT NULL, flow_id text NOT NULL,
  kind text NOT NULL, value text NOT NULL, deleted_at text NULL
);
"""

failures: list[str] = []


def fail(msg: str) -> None:
    failures.append(msg)


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
            "docker", "exec", "-i", CONTAINER,
            "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-X",
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
        self.psql([], db=self.name, stdin=CORE_DDL)

    def drop(self) -> None:
        try:
            self.psql(["-c", f'DROP DATABASE IF EXISTS "{self.name}" WITH (FORCE)'])
        except RuntimeError as exc:
            print(f"  ! could not drop {self.name}: {exc}")

    def ask(self, event: str = EVENT, command: str = COMMAND, hub: str = HUB) -> dict:
        """Run the query the way `queries.rs` does: `:hub_id` from the context, never the payload."""
        spec = MANIFEST["queries"][QUERY]
        sql = (MODULE_DIR / spec["sql"]).read_text().rstrip().rstrip(";")
        bound = bind(sql, {"hub_id": hub, "event": event, "command": command, "now": NOW})
        raw = self.psql(["-tAc", f"SELECT row_to_json(t) FROM ({bound}) t"], db=self.name).strip()
        rows = [json.loads(line) for line in raw.splitlines() if line]
        if len(rows) != 1:
            fail(f"the query answered {len(rows)} rows; a status is ALWAYS one row")
            return {}
        return rows[0]

    def seed_flow(
        self,
        flow_id: str,
        *,
        hub: str = HUB,
        enabled: int = 1,
        event: str = EVENT,
        command: str | None = COMMAND,
        flow_deleted: bool = False,
        trigger_deleted: bool = False,
        grant_deleted: bool = False,
        trigger_kind: str = "event",
    ) -> None:
        self.psql([], db=self.name, stdin=(
            "INSERT INTO _flow (id, hub_id, name, enabled, definition, deleted_at, created_at) "
            f"VALUES ({literal(flow_id)}, {literal(hub)}, 'An automation', {enabled}, '{{}}', "
            f"{literal(NOW) if flow_deleted else 'NULL'}, {literal(NOW)});"
        ))
        if event is not None:
            self.psql([], db=self.name, stdin=(
                "INSERT INTO _flow_triggers (id, hub_id, flow_id, trigger_key, kind, event_name, "
                f"enabled, deleted_at) VALUES ({literal(flow_id + '-t')}, {literal(hub)}, "
                f"{literal(flow_id)}, {literal('event:' + event)}, {literal(trigger_kind)}, "
                f"{literal(event)}, 1, {literal(NOW) if trigger_deleted else 'NULL'});"
            ))
        if command is not None:
            self.psql([], db=self.name, stdin=(
                "INSERT INTO _flow_grants (id, hub_id, flow_id, kind, value, deleted_at) VALUES ("
                f"{literal(flow_id + '-g')}, {literal(hub)}, {literal(flow_id)}, 'command', "
                f"{literal(command)}, {literal(NOW) if grant_deleted else 'NULL'});"
            ))


def check_declaration() -> None:
    """The query has to be declared, read-only, and behind the READ permission — not the manage one."""
    spec = MANIFEST["queries"].get(QUERY)
    if spec is None:
        fail(f"`{QUERY}` is not declared in module.json: the card has no door to ask through")
        return
    if spec.get("permission") != "flows.view_flow":
        fail(
            f"`{QUERY}` asks for `{spec.get('permission')}`; it must be `flows.view_flow` — a badge "
            "that needs the permission to CHANGE automations is the problem whatsapp_inbox#79 names"
        )
    schema_rel = spec.get("schema")
    if not schema_rel:
        fail(f"`{QUERY}` declares no schema: `event` and `command` would be unvalidated")
        return
    schema = json.loads((MODULE_DIR / schema_rel).read_text())
    if sorted(schema.get("required", [])) != ["command", "event"]:
        fail(f"{schema_rel} must require both `event` and `command`, got {schema.get('required')}")
    if schema.get("additionalProperties") is not False:
        fail(f"{schema_rel} must set `additionalProperties: false`")


def check_scope() -> None:
    """It reads three core tables and NOTHING else — no names, no definitions, no other automation."""
    spec = MANIFEST["queries"].get(QUERY)
    if spec is None or not spec.get("sql"):
        return  # `check_declaration` already said so; a second traceback adds nothing.
    sql = (MODULE_DIR / spec["sql"]).read_text()
    body = re.sub(r"--[^\n]*", " ", sql)
    if not re.search(r"\bhub_id\s*=\s*:hub_id", body):
        fail("the SQL does not scope `_flow` by `:hub_id` — a CORE table is not scoped for you")
    for forbidden in ("f.name", "definition"):
        if re.search(rf"SELECT[^;]*\b{re.escape(forbidden)}\b", body, re.IGNORECASE | re.DOTALL):
            fail(f"the SQL selects `{forbidden}`: the answer is three counters, never content")


def check_behaviour(db: ScratchDb) -> None:
    # --- nothing here yet: the card must be free to invite the owner in ------------------------
    empty = db.ask()
    if empty != {"total": 0, "enabled": 0, "unfinished": 0}:
        fail(f"an empty hub answered {empty}, expected all three at 0")

    # --- check the check: a live, granted, switched-on automation MUST be seen, or every ---------
    # --- assertion below is vacuous. --------------------------------------------------------
    db.seed_flow("f-running")
    running = db.ask()
    if running != {"total": 1, "enabled": 1, "unfinished": 0}:
        fail(f"a running automation answered {running}, expected total=1 enabled=1 — nothing below proves anything")
        return

    # --- paused is NOT absent: «En pausa» is the state the owner believes is working ------------
    db.seed_flow("f-paused", enabled=0)
    paused = db.ask()
    if paused != {"total": 2, "enabled": 1, "unfinished": 0}:
        fail(f"with one running and one paused the answer was {paused}, expected total=2 enabled=1")

    # --- created from the gallery and never granted: NOT «to do», or the owner builds a second --
    db.seed_flow("f-ungranted", command=None)
    ungranted = db.ask()
    if ungranted.get("unfinished") != 1 or ungranted.get("total") != 2:
        fail(
            f"a flow listening to the event with no command grant answered {ungranted}; it must "
            "count as `unfinished`, never as absent — the gallery creates it before the grants"
        )

    # --- a revoked grant is no grant ------------------------------------------------------------
    db.seed_flow("f-revoked", grant_deleted=True)
    revoked = db.ask()
    if revoked.get("total") != 2 or revoked.get("unfinished") != 2:
        fail(f"a flow whose grant was revoked answered {revoked}; a revoked grant is not a grant")

    # --- what must NOT count --------------------------------------------------------------------
    before = db.ask()
    db.seed_flow("f-deleted", flow_deleted=True)
    db.seed_flow("f-trigger-gone", trigger_deleted=True)
    db.seed_flow("f-other-event", event="sale.completed")
    db.seed_flow("f-other-command", command="inventory.stock.adjust")
    db.seed_flow("f-cron", trigger_kind="cron", event="")
    after = db.ask()
    if after != before:
        fail(
            f"deleted flows, revoked triggers, other events, other commands or a clock trigger "
            f"changed the answer: {before} → {after}"
        )

    # --- TENANCY: the neighbour's automations are not this hub's --------------------------------
    db.seed_flow("f-neighbour", hub=OTHER_HUB)
    db.seed_flow("f-neighbour-ungranted", hub=OTHER_HUB, command=None)
    with_neighbour = db.ask()
    if with_neighbour != before:
        fail(
            f"another hub's automations leaked into this one: {before} → {with_neighbour}. `_flow` "
            "is a CORE table and the runtime does not scope it for a module"
        )
    # …and read from the neighbour's side, ours must not be there either.
    theirs = db.ask(hub=OTHER_HUB)
    if theirs != {"total": 1, "enabled": 1, "unfinished": 1}:
        fail(f"asked as the neighbour the answer was {theirs}, expected only their own two flows")


def main() -> int:
    if not container_available():
        print(f"SKIP: container `{CONTAINER}` is not running (docker inspect failed)")
        return 0

    check_declaration()
    check_scope()
    if failures:
        for f in failures:
            print(f"FAIL: {f}")
        return 1

    db = ScratchDb("flows_automations_status")
    db.create()
    try:
        check_behaviour(db)
    finally:
        db.drop()

    if failures:
        for f in failures:
            print(f"FAIL: {f}")
        return 1
    print(f"OK: `{QUERY}` answers «already set up?» with three counters, scoped to this hub")
    return 0


if __name__ == "__main__":
    sys.exit(main())
