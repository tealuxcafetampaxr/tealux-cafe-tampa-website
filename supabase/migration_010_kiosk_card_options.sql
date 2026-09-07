-- Tealux Cafe Tampa — kiosk card display options
-- Adds per-card control over whether the title text actually renders on the
-- kiosk screen (separate from whether the card *has* a title -- staff may
-- want a title for identifying the card in the admin list without it being
-- drawn over a photo/video that already has text baked in), and how long
-- each card is shown before the display rotates to the next one.
-- Run after migration_009. Safe to re-run.

alter table kiosk_cards
  add column if not exists show_title boolean not null default true,
  add column if not exists duration_seconds integer not null default 12
    check (duration_seconds > 0);
