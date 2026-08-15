-- Migration: split Screen 3's "Cakes & Desserts" box into two columns.
-- Run once in the Supabase SQL editor, after migration_005_edit_history.sql.
--
-- The new Screen 3 background gives Cakes & Desserts a wider box, split into
-- two side-by-side columns: "Desserts" (still an editable item list — coin
-- cheese, mango shake, etc.) and "Cakes" (cakes rotate daily, so instead of
-- an item list it's a fixed "please see cashier for today's specials"
-- message — a new box style, 'static', with no items and nothing to edit).
--
-- Safe to re-run, and safe whether run before or after seed_boards.sql /
-- seed_items.sql on a fresh install:
--   - Widens the style check constraint first.
--   - If an old 'cakes_desserts' section exists (already-seeded DBs), it's
--     renamed to 'desserts' in place (keeps its section_items — foreign-keyed
--     by section_id, unaffected by the box_key rename) and its rotating cake
--     items are unlinked (they stay in the items catalog, just no longer
--     placed on this board).
--   - Ensures a 'cakes' (static) section exists alongside it.

alter table sections drop constraint if exists sections_style_check;
alter table sections add constraint sections_style_check
  check (style in ('list', 'special', 'static'));

update sections
set box_key = 'desserts', name = 'Desserts'
where box_key = 'cakes_desserts';

delete from section_items si
using sections s
where si.section_id = s.id
  and s.box_key = 'desserts'
  and si.group_label = 'Cakes (rotating selection)';

insert into sections (board_id, box_key, name, style, sort_order)
select s.board_id, 'cakes', 'Cakes', 'static', 3
from sections s
where s.box_key = 'desserts'
  and not exists (
    select 1 from sections s2 where s2.board_id = s.board_id and s2.box_key = 'cakes'
  );

update sections s
set sort_order = 4
from boards b
where s.board_id = b.id and b.template_key = 'screen_3' and s.box_key = 'self_serve_ramen';
