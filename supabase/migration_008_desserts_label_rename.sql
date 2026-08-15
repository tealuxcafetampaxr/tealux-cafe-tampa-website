-- Migration: rename the "Other Desserts" subheading to "Desserts" on
-- Screen 3's Desserts column (it's the only group left in that box now that
-- the rotating cakes moved out, so "Other" no longer makes sense). Run once
-- in the Supabase SQL editor, after migration_007_ramen_ingredients_from_item.sql.
--
-- Safe to re-run: only touches rows that still say the old label.

update section_items si
set group_label = 'Desserts'
from sections s
where si.section_id = s.id
  and s.box_key = 'desserts'
  and si.group_label = 'Other Desserts';
