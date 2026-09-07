-- «Do I already have this automation, and is it on?» — three counters, nothing else
-- (ERPlora/whatsapp_inbox#79).
--
-- WHO ASKS. A module that offers a shortcut into the gallery: WhatsApp's settings card «Book
-- appointments» sends the owner to Automations, and until this query existed it said «Set up»
-- FOREVER — to the salon that connected the number a minute ago and to the one that has been
-- taking appointments through it for three weeks. The second one is the expensive reader: it
-- follows the invitation and ends up with two automations answering the same message.
--
-- WHY IT LIVES HERE AND NOT BEHIND `manage_flows`. `/api/hub/flows*` is gated behind the capability
-- the runtime itself calls «la capability con más alcance de todas» (`crates/runtime/src/
-- manifest.rs`): it grants every automation of the business and the event catalogue, which carries
-- customers' names (`crates/runtime/src/event_shape.rs`). Asking an inbox module to hold that so it
-- can paint one badge is the escalation the grants system exists to prevent — and the owner would
-- have to concede it by hand in Settings → Permissions first, so the badge would be born behind
-- another permission to go hunting for. This is the opposite: read-only, `flows.view_flow`, and the
-- answer is three integers about ONE event and ONE command the caller already named. No id, no
-- name, no document, nothing about any other automation of this business.
--
-- WHAT IDENTIFIES «this automation». Not the gallery template it came from: a created flow keeps no
-- record of its template, and the document cannot carry one either — the root of
-- `schemas/flow.schema.json` is `additionalProperties: false`. What it does keep is what it LISTENS
-- to and what it is allowed to DO, and between them they say it precisely: the WhatsApp appointment
-- recipe is «triggered by `hub.whatsapp.message_received`» + «may run `appointments.*`», and its
-- table-booking twin (whatsapp_inbox#60) is the same event with a `reservations.*` command. Both
-- are facts the kernel maintains, so neither can go stale behind our back.
--
-- WHY `unfinished` IS ITS OWN COUNTER. The gallery creates every template PAUSED and with NO grants
-- (`ui/lib/templates.ts`, rule 3), and hands the owner to Permissions. Someone who stops halfway has
-- a flow that listens and can do nothing. Counting it as absent would put the invitation back on the
-- card and buy the duplicate this query exists to prevent; counting it as present would tell them
-- something is running when nothing is. It is a third state because it is a third state.
--
-- And it is «listens and holds NO command grant at all», not «listens and does not hold OURS». A
-- flow granted `inventory.stock.adjust` on this same event is a different automation the business
-- wrote, finished and running; reporting it as our half-built one would put «Unfinished» on a card
-- whose automation was never created. The half-built one is recognisable precisely by having no
-- command grant yet, which is the state the gallery leaves behind.
--
-- TENANCY. `_flow` is a CORE table (`hub/contracts/kernel/tables.snapshot`): the runtime scopes a
-- module's OWN rows, never these, so every one of the three reads carries `hub_id` explicitly.
-- `tests/automations_status.pg.test.py` reads this hub and the neighbour's and asserts on both.
SELECT
    COALESCE(SUM(CASE WHEN granted = 1 THEN 1 ELSE 0 END), 0)                AS total,
    COALESCE(SUM(CASE WHEN granted = 1 AND is_on = 1 THEN 1 ELSE 0 END), 0)  AS enabled,
    COALESCE(SUM(CASE WHEN granted = 0 AND ungranted = 1 THEN 1 ELSE 0 END), 0) AS unfinished
FROM (
    SELECT
        f.enabled AS is_on,
        CASE WHEN EXISTS (
            SELECT 1 FROM _flow_grants g
             WHERE g.hub_id = f.hub_id
               AND g.flow_id = f.id
               AND g.deleted_at IS NULL
               AND g.kind = 'command'
               AND g.value = :command
        ) THEN 1 ELSE 0 END AS granted,
        CASE WHEN EXISTS (
            SELECT 1 FROM _flow_grants g2
             WHERE g2.hub_id = f.hub_id
               AND g2.flow_id = f.id
               AND g2.deleted_at IS NULL
               AND g2.kind = 'command'
        ) THEN 0 ELSE 1 END AS ungranted
    FROM _flow f
    WHERE f.hub_id = :hub_id
      AND f.deleted_at IS NULL
      AND EXISTS (
            SELECT 1 FROM _flow_triggers t
             WHERE t.hub_id = f.hub_id
               AND t.flow_id = f.id
               AND t.deleted_at IS NULL
               AND t.kind = 'event'
               AND t.event_name = :event
      )
) listening
