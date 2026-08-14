-- The assistant's proposal lands here, and nowhere else. `status` is written by this statement,
-- not taken from the payload: there is no value the model can send that makes a draft anything
-- other than pending, and that is the point of flows#4.
INSERT INTO flows_flowdraft
  (id, hub_id, name, definition, notes, status, flow_id,
   is_deleted, created_by, updated_by, created_at, updated_at)
VALUES
  (:new_id, :hub_id, :name, :definition, :notes, 'pending', '',
   0, :current_user_id, :current_user_id, :now, :now);
