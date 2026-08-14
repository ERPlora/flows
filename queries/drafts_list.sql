-- The proposals still waiting for a person, newest first.
--
-- Not a `list` query on purpose: this is a tray, not an archive. It holds what the owner has not
-- answered yet, and a tray that needs paging is a tray nobody is emptying. Resolved drafts leave
-- it by their `status`, which is the same reason there is no filter for them here.
SELECT id, name, definition, notes, status, created_at
  FROM flows_flowdraft
 WHERE hub_id = :hub_id
   AND is_deleted = 0
   AND status = 'pending'
 ORDER BY created_at DESC
 LIMIT 50;
