-- Tealux Cafe Tampa — counter kiosk display
-- Adds the table backing /kiosk (public display) and /kiosk/admin (management).
-- Run after migration_008. Safe to re-run.

-- ── KIOSK CARDS ────────────────────────────────────────
-- 'highlight' = this week's featured item (shown with more emphasis on the
-- display); 'promo' = a rotating announcement/promo card. Both types live in
-- one table since the display just rotates through everything active, in
-- sort_order.
create table if not exists kiosk_cards (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'promo' check (type in ('highlight', 'promo')),
  title text not null,
  subtitle text default '',
  price text default '',
  media_url text,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_kiosk_cards_active_sort on kiosk_cards(active, sort_order);

drop trigger if exists trg_kiosk_cards_updated_at on kiosk_cards;
create trigger trg_kiosk_cards_updated_at before update on kiosk_cards
  for each row execute function set_updated_at();

-- ── ROW LEVEL SECURITY ─────────────────────────────────
-- Unlike the rest of the admin schema, the kiosk display itself is public
-- (no login on the counter tablet) — so anon reads of active cards are
-- allowed. Management (insert/update/delete, and seeing inactive cards)
-- stays authenticated-only, same as everywhere else.
alter table kiosk_cards enable row level security;

drop policy if exists "authenticated full access" on kiosk_cards;
create policy "authenticated full access" on kiosk_cards
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public read active kiosk cards" on kiosk_cards;
create policy "public read active kiosk cards" on kiosk_cards
  for select using (active = true);

-- Card photos/videos reuse the existing public "item-images" bucket/policies
-- from schema.sql (public read, authenticated write) — no new bucket needed.
-- If videos exceed Supabase Storage's default per-file size limit for that
-- bucket, raise it in the dashboard (Storage > item-images > settings).
