-- Tealux Cafe Tampa — employee admin tool schema
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / drop-and-recreate for policies.

-- ── ITEMS ──────────────────────────────────────────────
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'sold_out')),
  tag text not null default 'none' check (tag in ('none', 'new', 'best_seller', 'limited')),
  featured boolean not null default false,
  category text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── ITEM IMAGES ────────────────────────────────────────
create table if not exists item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  storage_url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false
);

-- ── BOARDS ─────────────────────────────────────────────
-- template_key identifies a fixed background design (screen_1/2/3, see
-- admin/js/board-renderer.js) that the board's sections render onto.
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  width integer not null default 1920,
  height integer not null default 1080,
  theme jsonb not null default '{}'::jsonb,
  template_key text,
  updated_at timestamptz not null default now()
);

-- ── SECTIONS ───────────────────────────────────────────
-- box_key ties a section to one of its template's fixed content boxes
-- (e.g. 'fruit_teas', 'milk_tea') — position/size come from the renderer's
-- layout table, not from this row. style 'special' is for one-off box
-- layouts (currently just the self-serve-ramen box); 'extra' holds
-- style-specific fields (e.g. free_toppings_count, ingredients).
create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  box_key text,
  name text not null,
  style text not null default 'list' check (style in ('list', 'special')),
  section_image_url text,
  extra jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

-- ── SECTION ITEMS (links items into sections without duplicating data) ──
-- group_label renders an optional subheading above this item within the
-- section's list (e.g. "SIGNATURE BLENDS") — consecutive items sharing the
-- same label are grouped under one subheading.
create table if not exists section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  group_label text,
  sort_order integer not null default 0
);

create index if not exists idx_item_images_item_id on item_images(item_id);
create index if not exists idx_sections_board_id on sections(board_id);
create unique index if not exists idx_sections_board_box on sections(board_id, box_key);
create index if not exists idx_section_items_section_id on section_items(section_id);
create index if not exists idx_section_items_item_id on section_items(item_id);

-- ── updated_at auto-touch ──────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_items_updated_at on items;
create trigger trg_items_updated_at before update on items
  for each row execute function set_updated_at();

drop trigger if exists trg_boards_updated_at on boards;
create trigger trg_boards_updated_at before update on boards
  for each row execute function set_updated_at();

-- ── ROW LEVEL SECURITY ─────────────────────────────────
-- Single role for now: any authenticated (logged-in employee) user can
-- read/write everything. No public/anonymous access at all — the anon key
-- is safe to ship in client JS specifically because RLS blocks it here.
alter table items enable row level security;
alter table item_images enable row level security;
alter table boards enable row level security;
alter table sections enable row level security;
alter table section_items enable row level security;

drop policy if exists "authenticated full access" on items;
create policy "authenticated full access" on items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on item_images;
create policy "authenticated full access" on item_images
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on boards;
create policy "authenticated full access" on boards
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on sections;
create policy "authenticated full access" on sections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated full access" on section_items;
create policy "authenticated full access" on section_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── STORAGE ────────────────────────────────────────────
-- Create a public "item-images" bucket for photos referenced by item_images.storage_url.
-- Public read (so images render on boards/site), authenticated-only write.
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

drop policy if exists "public read item-images" on storage.objects;
create policy "public read item-images" on storage.objects
  for select using (bucket_id = 'item-images');

drop policy if exists "authenticated write item-images" on storage.objects;
create policy "authenticated write item-images" on storage.objects
  for insert with check (bucket_id = 'item-images' and auth.role() = 'authenticated');

drop policy if exists "authenticated update item-images" on storage.objects;
create policy "authenticated update item-images" on storage.objects
  for update using (bucket_id = 'item-images' and auth.role() = 'authenticated');

drop policy if exists "authenticated delete item-images" on storage.objects;
create policy "authenticated delete item-images" on storage.objects
  for delete using (bucket_id = 'item-images' and auth.role() = 'authenticated');
