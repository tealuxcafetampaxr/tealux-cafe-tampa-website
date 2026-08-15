-- Seeds the 3 real TV boards (Screen 1/2/3) and their fixed content boxes.
-- Run once after schema.sql + migration_002_templates.sql. Safe to re-run —
-- skips boards/sections that already exist (matched by name / box_key).

insert into boards (name, width, height, template_key)
select v.name, 1920, 1080, v.template_key
from (values
  ('Screen 1', 'screen_1'),
  ('Screen 2', 'screen_2'),
  ('Screen 3', 'screen_3')
) as v(name, template_key)
where not exists (select 1 from boards where boards.name = v.name);

insert into sections (board_id, box_key, name, style, sort_order)
select b.id, v.box_key, v.name, v.style, v.sort_order
from boards b
join (values
  ('screen_1', 'fruit_teas',        'Fruit Teas',              'list',    0),
  ('screen_1', 'milk_tea',          'Milk Tea',                'list',    1),
  ('screen_2', 'vietnamese_coffee', 'Vietnamese Iced Coffee',  'list',    0),
  ('screen_2', 'smoothies',         'Smoothies',                'list',    1),
  ('screen_3', 'street_food',       'Street Food',              'list',    0),
  ('screen_3', 'breakfast_bakery',  'Breakfast & Bakery',       'list',    1),
  ('screen_3', 'desserts',          'Desserts',                 'list',    2),
  ('screen_3', 'cakes',             'Cakes',                    'static',  3),
  ('screen_3', 'self_serve_ramen',  'Self Serve Ramen',         'special', 4)
) as v(template_key, box_key, name, style, sort_order)
  on v.template_key = b.template_key
where not exists (
  select 1 from sections s where s.board_id = b.id and s.box_key = v.box_key
);
