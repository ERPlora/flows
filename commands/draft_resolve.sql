-- A person decided: the draft became the flow in `flow_id`, or it was discarded. Either way it
-- leaves the pending list and the row survives as the record that the assistant proposed this.
--
-- `hub_id` is in the WHERE and comes from the runtime, never the payload: a draft of another hub
-- is not «not found by accident», it is unreachable by construction.
--
-- `status = 'pending'` is in the WHERE for the same reason, and it is a guard, not a detail
-- (flows#35). A draft is decided ONCE. Without it a resolved draft could be resolved again, and the
-- second call is the damaging one: `flow_id` is a required payload field that carries the empty
-- string when the outcome is `dismissed`, so `used(flow_id='flow-7')` followed by `dismissed('')`
-- overwrote `flow_id` with `''` and cut the draft→flow link this table exists to keep (see
-- `migrations/postgres/001_drafts.sql`).
--
-- And it has to be HERE, not in `min_affected_rows`: that gate counts rows, and the offending
-- update writes exactly one row — it just should not have. A count cannot express «only from this
-- state». With the guard, a second attempt matches nothing, the gate sees 0 and the runtime
-- reverts and answers an error instead of a silent success. Same shape as `whatsapp_inbox`
-- (`request_approve.sql`, `request_reject.sql`, `_fulfill_transition.sql`).
UPDATE flows_flowdraft
   SET status     = :outcome,
       flow_id    = :flow_id,
       updated_by = :current_user_id,
       updated_at = :now
 WHERE id = :id
   AND hub_id = :hub_id
   AND status = 'pending'
   AND is_deleted = 0;
