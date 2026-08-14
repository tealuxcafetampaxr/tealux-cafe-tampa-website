-- Migration: freeform board images
-- Run this once in the Supabase SQL editor, after schema.sql +
-- migration_002_templates.sql. Adds support for user-uploaded photos placed
-- freely on a board (drag to move, handle to resize in the board editor).
-- These render as their own layer between the background and the item-list
-- text, so a photo can never cover/obscure the text.

create table if not exists board_images (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards(id) on delete cascade,
  storage_url text not null,
  x numeric not null default 0,
  y numeric not null default 0,
  w numeric not null default 300,
  h numeric not null default 300,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_board_images_board_id on board_images(board_id);

alter table board_images enable row level security;

drop policy if exists "authenticated full access" on board_images;
create policy "authenticated full access" on board_images
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket for these photos (separate from item-images for clarity).
insert into storage.buckets (id, name, public)
values ('board-images', 'board-images', true)
on conflict (id) do nothing;

drop policy if exists "public read board-images" on storage.objects;
create policy "public read board-images" on storage.objects
  for select using (bucket_id = 'board-images');

drop policy if exists "authenticated write board-images" on storage.objects;
create policy "authenticated write board-images" on storage.objects
  for insert with check (bucket_id = 'board-images' and auth.role() = 'authenticated');

drop policy if exists "authenticated update board-images" on storage.objects;
create policy "authenticated update board-images" on storage.objects
  for update using (bucket_id = 'board-images' and auth.role() = 'authenticated');

drop policy if exists "authenticated delete board-images" on storage.objects;
create policy "authenticated delete board-images" on storage.objects
  for delete using (bucket_id = 'board-images' and auth.role() = 'authenticated');
