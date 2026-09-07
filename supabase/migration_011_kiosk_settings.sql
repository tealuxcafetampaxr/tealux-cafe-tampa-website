-- Tealux Cafe Tampa — kiosk display-wide settings
-- Single-row settings table for things that apply to the whole slideshow
-- rather than one card (e.g. transition style) -- mixing transition styles
-- between different card-pairs would look inconsistent, so this is global,
-- unlike per-card fields like duration_seconds.
-- Run after migration_010. Safe to re-run.

create table if not exists kiosk_settings (
  id integer primary key default 1 check (id = 1),
  transition_style text not null default 'fade' check (transition_style in ('fade', 'slide', 'none')),
  updated_at timestamptz not null default now()
);

insert into kiosk_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_kiosk_settings_updated_at on kiosk_settings;
create trigger trg_kiosk_settings_updated_at before update on kiosk_settings
  for each row execute function set_updated_at();

alter table kiosk_settings enable row level security;

drop policy if exists "authenticated full access" on kiosk_settings;
create policy "authenticated full access" on kiosk_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public read kiosk settings" on kiosk_settings;
create policy "public read kiosk settings" on kiosk_settings
  for select using (true);
