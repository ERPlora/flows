-- A person decided: the draft became the flow in `flow_id`, or it was discarded. Either way it
-- leaves the pending list and the row survives as the record that the assistant proposed this.
--
-- `hub_id` is in the WHERE and comes from the runtime, never the payload: a draft of another hub
-- is not «not found by accident», it is unreachable by construction.
UPDATE flows_flowdraft
   SET status     = :outcome,
       flow_id    = :flow_id,
       updated_by = :current_user_id,
       updated_at = :now
 WHERE id = :id
   AND hub_id = :hub_id
   AND is_deleted = 0;
