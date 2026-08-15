-- Seeds the real menu catalog (~76 items) extracted from the PPTX and links
-- each item into its board's section. Run once after schema.sql +
-- migration_002_templates.sql + seed_boards.sql, in the Supabase SQL editor.
-- Safe to re-run: items are matched by name, section_items by
-- (section_id, item_id), so nothing duplicates.
-- Source: menu-source/extracted_items.json (confirmed correct 2026-08-13).

-- Defensive: migration_002_templates.sql should have added this, but it
-- didn't take on the live DB (group_label was missing on section_items) —
-- add it here too so this script doesn't depend on migration history.
alter table section_items add column if not exists group_label text;

drop table if exists _seed_catalog;
create temporary table _seed_catalog (
  box_key text,
  category text,
  item_sort integer,
  name text,
  description text,
  price numeric(10,2),
  tag text,
  group_label text
);

insert into _seed_catalog (box_key, category, item_sort, name, description, price, tag, group_label) values
  -- Fruit Teas
  ('fruit_teas', 'Fruit Teas', 0,  'Islander',        'Passionfruit, Mango & Pineapple', 6.75, 'none', 'Signature Blends'),
  ('fruit_teas', 'Fruit Teas', 1,  'Heart on Fire',   'Strawberry & Dragonfruit',         6.75, 'none', 'Signature Blends'),
  ('fruit_teas', 'Fruit Teas', 2,  'Sunset Paradise', 'Strawberry & Mango',                6.75, 'none', 'Signature Blends'),
  ('fruit_teas', 'Fruit Teas', 3,  'Luna',            'Lychee & Butterfly Pea Tea',         6.75, 'none', 'Signature Blends'),
  ('fruit_teas', 'Fruit Teas', 4,  'Meadow',          'Lemongrass & Peach',                 6.75, 'none', 'Signature Blends'),
  ('fruit_teas', 'Fruit Teas', 5,  'Sunrise',         'Peach & Mango',                      6.75, 'none', 'Signature Blends'),
  ('fruit_teas', 'Fruit Teas', 6,  'Lime Mojito',     'Lime & Mint',                        6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 7,  'Black Currant',   'Grape & Blueberry',                  6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 8,  'Scarlet',         'Strawberry',                         6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 9,  'Leviathan',       'Blueberry',                          6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 10, 'Canary',          'Pineapple',                          6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 11, 'Poppy',           'Passionfruit',                       6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 12, 'Man on the Go',   'Mango',                              6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 13, 'Jasmine Tea',     '',                                   6.00, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 14, 'Honeydew',        '',                                   6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 15, 'Mansion',         '',                                   6.75, 'none', 'Classics'),
  ('fruit_teas', 'Fruit Teas', 16, 'Winter Glow',     '',                                   6.75, 'new',  'Classics'),
  ('fruit_teas', 'Fruit Teas', 17, 'Heart on Ice',    '',                                   6.75, 'new',  'Classics'),

  -- Milk Tea
  ('milk_tea', 'Milk Tea', 0,  'Tealux Signature Milk Tea',  '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 1,  'Brown Sugar Fresh Milk',     '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 2,  'Brown Sugar Fresh Oat Milk', '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 3,  'Thai Tea',                   '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 4,  'Jasmine Milk Tea',           '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 5,  'Honey Jasmine Milk Tea',     '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 6,  'Strawberry Milk',            '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 7,  'Mango Milk',                 '', 6.50, 'new',  null),
  ('milk_tea', 'Milk Tea', 8,  'Matcha Milk Tea',            '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 9,  'Taro Milk Tea',              '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 10, 'Grass Jelly Milk Tea',       '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 11, 'Mango Milk Tea',             '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 12, 'Honeydew Milk Tea',          '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 13, 'Matcha Strawberry Milk Tea', '', 6.75, 'none', null),
  ('milk_tea', 'Milk Tea', 14, 'Strawberry Milk Tea',        '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 15, 'Roasted Rice Milk Tea',      '', 6.50, 'none', null),
  ('milk_tea', 'Milk Tea', 16, 'Ube Latte',                  '', 7.15, 'new',  null),
  ('milk_tea', 'Milk Tea', 17, 'Purple Cream Brulee',        '', 7.15, 'new',  null),

  -- Vietnamese Iced Coffee
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 0, 'Light Blend',         '', 6.25, 'none', null),
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 1, 'Dark Blend',          '', 6.25, 'none', null),
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 2, 'Black Ice Coffee',    '', 6.25, 'none', null),
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 3, 'Ube Coffee',          '', 7.50, 'new',  null),
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 4, 'Silky Coffee Cream',  '', 8.00, 'new',  null),
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 5, 'Salted Coffee',       '', 8.00, 'new',  null),
  ('vietnamese_coffee', 'Vietnamese Iced Coffee', 6, 'Egg Silky Cream',     '', 8.50, 'new',  null),

  -- Smoothies
  ('smoothies', 'Smoothies', 0, 'Taro Smoothie',              '', 6.75, 'none', null),
  ('smoothies', 'Smoothies', 1, 'Matcha Smoothie',            '', 6.75, 'none', null),
  ('smoothies', 'Smoothies', 2, 'Coconut Smoothie',           '', 6.75, 'none', null),
  ('smoothies', 'Smoothies', 3, 'Cookies N'' Cream Smoothie', '', 6.75, 'none', null),
  ('smoothies', 'Smoothies', 4, 'Strawberry Smoothie',        '', 6.75, 'none', null),
  ('smoothies', 'Smoothies', 5, 'Mango Smoothie',             '', 6.75, 'none', null),
  ('smoothies', 'Smoothies', 6, 'Lushavo',                    '', 9.25, 'new',  null),
  ('smoothies', 'Smoothies', 7, 'Avopuff',                    '', 9.25, 'new',  null),

  -- Street Food
  ('street_food', 'Street Food', 0, 'Rice Paper Salad',          '', 13.00, 'none', null),
  ('street_food', 'Street Food', 1, 'Popcorn Chicken',           '', 7.50,  'none', null),
  ('street_food', 'Street Food', 2, 'Vietnamese Shrimp Eggroll', '', 7.75,  'none', null),
  ('street_food', 'Street Food', 3, 'Fried Gyoza',               '', 7.25,  'none', null),
  ('street_food', 'Street Food', 4, 'Fried Tofu',                '', 6.50,  'none', null),

  -- Breakfast & Bakery
  ('breakfast_bakery', 'Breakfast & Bakery', 0, 'Croissant Sandwich',      '', 6.00, 'none', null),
  ('breakfast_bakery', 'Breakfast & Bakery', 1, 'NY Garlic Bagel',         '', 4.00, 'new',  null),
  ('breakfast_bakery', 'Breakfast & Bakery', 2, 'Everything Bagel',        '', 3.50, 'none', null),
  ('breakfast_bakery', 'Breakfast & Bakery', 3, 'NY Style Marble Bagel',   '', 3.50, 'none', null),
  ('breakfast_bakery', 'Breakfast & Bakery', 4, 'Croissant',               '', 2.50, 'none', null),
  ('breakfast_bakery', 'Breakfast & Bakery', 5, 'Chocolate Cake Pop',      '', 3.50, 'none', null),
  ('breakfast_bakery', 'Breakfast & Bakery', 6, 'CookiesnCream Cake Pop',  '', 3.50, 'none', null),

  -- Cakes & Desserts
  -- The 8 cakes below stay in the catalog (box_key null — not linked to any
  -- board section) since the Cakes column on Screen 3 is now a fixed "please
  -- see cashier for today's specials" message, not an item list (cakes
  -- rotate daily). Only the 4 "Desserts" items go on the board.
  (null, 'Cakes & Desserts', 0,  'Durian Cake',          '', 9.99, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 1,  'Matcha Mille Crepe',   '', 9.25, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 2,  'Ube Cake',             '', 9.00, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 3,  'Cream Puff',           '', 9.00, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 4,  'Orange Cake',          '', 9.00, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 5,  'Earl Gray Cake',       '', 8.25, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 6,  'Dubai Chocolate Cake', '', 8.00, 'none', 'Cakes (rotating selection)'),
  (null, 'Cakes & Desserts', 7,  'Creme Brulee',         '', 7.50, 'none', 'Cakes (rotating selection)'),
  ('desserts', 'Cakes & Desserts', 8,  'Tofu Dessert',          '', 6.50, 'none', 'Desserts'),
  ('desserts', 'Cakes & Desserts', 9,  'Mango Shake',           '', 6.75, 'none', 'Desserts'),
  ('desserts', 'Cakes & Desserts', 10, 'Korean Cheese Coin',    '', 4.50, 'none', 'Desserts'),
  ('desserts', 'Cakes & Desserts', 11, 'Korea Ube Cheese Coin', '', 5.00, 'none', 'Desserts');

-- ── ITEMS ──────────────────────────────────────────────
insert into items (name, description, price, tag, category, sort_order)
select c.name, c.description, c.price, c.tag, c.category, c.item_sort
from _seed_catalog c
where not exists (select 1 from items i where i.name = c.name);

-- ── SECTION ITEMS (link catalog items into their board's box) ──────────
insert into section_items (section_id, item_id, group_label, sort_order)
select s.id, i.id, c.group_label, c.item_sort
from _seed_catalog c
join sections s on s.box_key = c.box_key
join items i on i.name = c.name
where not exists (
  select 1 from section_items si where si.section_id = s.id and si.item_id = i.id
);

drop table _seed_catalog;

-- ── SELF SERVE RAMEN (special box: single priced item, not a list) ─────
-- The item's Description doubles as the board's toppings list — no separate
-- ramen-specific text field to keep in sync.
insert into items (name, description, price, tag, category, sort_order)
select 'Self Serve Ramen', 'Egg • Rice Cake • Kimchi • Dumpling • Spam', 11.00, 'none', 'Self Serve Ramen', 0
where not exists (select 1 from items where name = 'Self Serve Ramen');

update sections s
set extra = jsonb_build_object(
  'price_item_id', i.id,
  'free_toppings_count', 4
)
from items i
where s.box_key = 'self_serve_ramen' and i.name = 'Self Serve Ramen';
