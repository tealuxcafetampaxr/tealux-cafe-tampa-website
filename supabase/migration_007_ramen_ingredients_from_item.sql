-- Migration: Self Serve Ramen's toppings list now comes from the priced
-- item's Description field instead of a separate `sections.extra.ingredients`
-- value — one less place to edit the same text. Run once in the Supabase
-- SQL editor, after migration_006_screen3_desserts_split.sql.
--
-- Safe to re-run: only backfills the item's description if it's currently
-- empty, and only touches sections that still carry the old `ingredients` key.

update items i
set description = s.extra->>'ingredients'
from sections s
where s.box_key = 'self_serve_ramen'
  and s.extra ? 'ingredients'
  and i.id = (s.extra->>'price_item_id')::uuid
  and (i.description is null or i.description = '');

update sections
set extra = extra - 'ingredients'
where box_key = 'self_serve_ramen' and extra ? 'ingredients';
