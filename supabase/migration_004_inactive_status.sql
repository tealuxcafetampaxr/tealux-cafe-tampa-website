-- Migration: add an "inactive" item status
-- Run this once in the Supabase SQL editor, after the earlier migrations.
-- Unlike "sold_out" (temporarily unavailable, still shows on boards),
-- "inactive" means the item is deliberately excluded from menu boards —
-- it can't be newly added to a board section, and the renderer skips it
-- even if it's still linked from before it was deactivated.

alter table items drop constraint if exists items_status_check;
alter table items add constraint items_status_check
  check (status in ('active', 'sold_out', 'inactive'));
