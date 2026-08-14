-- Migration: fixed-template board rendering
-- Run this once in the Supabase SQL editor, after schema.sql.
-- Adds support for boards that render onto a fixed background PNG
-- (Screen 1/2/3) with named content boxes, instead of freeform sections.

alter table boards add column if not exists template_key text;

alter table sections add column if not exists box_key text;
alter table sections add column if not exists extra jsonb not null default '{}'::jsonb;

alter table sections drop constraint if exists sections_style_check;
alter table sections add constraint sections_style_check
  check (style in ('list', 'special'));

alter table section_items add column if not exists group_label text;

create unique index if not exists idx_sections_board_box on sections(board_id, box_key);
