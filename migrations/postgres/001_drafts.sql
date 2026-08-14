-- flows · what the assistant proposed, before anybody accepted it (flows#4).
--
-- WHY A TABLE OF THIS MODULE, AND NOT A FLOW WITH `enabled = false`.
--
-- The rule of flows#4 is that what the AI produces is born a DRAFT and never a running
-- automation. Writing it as a paused flow would make that rule a POLICY: one `PUT` with
-- `enabled: true` — by a later version of this editor, by a blueprint, by anything holding an
-- admin session — and the thing the model wrote is live. Writing it HERE makes it STRUCTURAL: a
-- draft is not a flow. The kernel has never heard of it, `_flow_triggers` cannot point at it,
-- `_flow_grants` cannot name it, and no tick can pick it up. It becomes an automation only when a
-- person presses a button and the browser calls `POST /api/hub/flows` — paused, ungranted.
--
-- Types: the portable "ERPlora SQL" subset (ADR-0007) — ids/refs TEXT, flags 0/1 INTEGER, dates
-- TEXT ISO-8601. `definition` and `notes` are TEXT and hold JSON as text on purpose: the
-- dispatcher binds a JSON object parameter as its serialised string (`crates/db/src/lib.rs`), so
-- TEXT is what actually arrives, and a JSONB column would need a cast that says nothing extra —
-- nothing in the hub ever queries INSIDE this document.

CREATE TABLE IF NOT EXISTS flows_flowdraft (
    id          TEXT PRIMARY KEY,
    hub_id      TEXT NOT NULL,
    name        TEXT NOT NULL,
    -- The flow document the assistant wrote, as JSON text (`hub/schemas/flow.schema.json`).
    definition  TEXT NOT NULL,
    -- The assistant's own words about what it could NOT work out, as a JSON array of strings.
    -- Zapier's Copilot documents the same shape: an outline, plus instructions for the rest.
    notes       TEXT NOT NULL DEFAULT '[]',
    -- 'pending' → waiting for a person · 'used' → it became the flow in `flow_id` · 'dismissed'.
    status      TEXT NOT NULL DEFAULT 'pending',
    -- The flow it turned into, once somebody accepted it. Empty until then.
    flow_id     TEXT NOT NULL DEFAULT '',
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    deleted_at  TEXT,
    created_by  TEXT,
    updated_by  TEXT,
    created_at  TEXT,
    updated_at  TEXT
);

CREATE INDEX IF NOT EXISTS ix_flowdraft_hub ON flows_flowdraft (hub_id, status, is_deleted);
