# Employee Admin Tool — Setup

## 1. Run the database schema

In the Supabase dashboard for this project (bayaotnzbzhotfrupzhx), in **SQL Editor** → **New query**, run these in order:
1. `supabase/schema.sql` — creates `items`, `item_images`, `boards`, `sections`, `section_items`, RLS policies, and the public `item-images` storage bucket
2. `supabase/migration_002_templates.sql` — adds `boards.template_key`, `sections.box_key`/`extra`, `section_items.group_label` (needed for the fixed-template board renderer)
3. `supabase/seed_boards.sql` — creates the 3 real boards (Screen 1/2/3) with their fixed content boxes already in place. Safe to re-run.
4. `supabase/seed_items.sql` — seeds the real ~76-item catalog and links it into the 3 boards' sections. Safe to re-run.
5. `supabase/migration_003_board_images.sql` — adds the `board_images` table and public `board-images` storage bucket, for freeform user-placed photos on a board (drag to move/resize in the board editor).

If you're setting this up fresh (no `schema.sql` run yet), just run all five in order.

## 2. Create employee accounts

No public sign-up — accounts are created manually:
1. Supabase dashboard → **Authentication** → **Users** → **Add user**
2. Enter the employee's email + a temporary password (or use "Send invite" if email sending is configured)
3. They log in at `/admin/login.html` with that email/password, or request a magic link

## 3. Confirm email auth is enabled

**Authentication** → **Providers** → **Email** should be enabled. Magic link and password sign-in both use this provider.

## 4. Local development

These are plain static files — no build step. Open `/admin/login.html` via any local static server (e.g. the same one you use for the main site) or Netlify Dev. Don't open via `file://` — Supabase auth redirects and `fetch` calls need a real origin.

## 5. Deploy

Nothing extra needed — `/admin/` ships with the rest of the site on the next Netlify deploy. The Supabase URL and publishable key are hardcoded in `admin/js/supabase-client.js`; that's expected (see comment in that file — it's a client-safe key, RLS is the real boundary).

## How the board renderer works

`admin/js/board-renderer.js` draws the real Screen 1/2/3 TV designs (`/templates/Screen_1.png` etc.) as a fixed background, then overlays each box's item list at exact measured coordinates — headers, taglines, product photos, and the Ice/Sweetness footer are all part of the background image, not editable through the tool. Only the "Toppings" box on Screen 2 has no matching section (it's baked into the background since it rarely changes); everything else is populated from the catalog.

- Each item row auto-shrinks font size (and falls back to two columns) if the assigned items don't fit the box — this is what the prompt doc called "auto-compacting layout."
- An item's `group_label` (set per-board, per-item in the editor) renders as a subheading like "SIGNATURE BLENDS" above it; consecutive items sharing a label are grouped under one subheading.
- The "Self Serve Ramen" box is a one-off layout (`style: 'special'`): pick one catalog item for its price, set a free-toppings count and an ingredients string — the numbered steps are fixed copy in the renderer, not editable.
- Adding a genuinely new screen design later means measuring its box coordinates and adding an entry to `BOARD_TEMPLATES` in `board-renderer.js` — there's no generic drag-and-drop layout builder.
- **Board photos** are separate from the box template system: freeform user-uploaded images (`board_images` table), positioned/sized in the board's own pixel space (not the reference-template scale), dragged/resized via on-canvas handles in `/admin/board.html`. They render as their own layer strictly between the background and the box text layer, so a photo can never cover an item list — text always wins. Position/size persist to the DB immediately on drag-end, independent of the sections "Save" button.

## Not yet wired in

- **Public menu page** — the main site's static "Menu" section still doesn't pull from this catalog (noted as a future nice-to-have in the original spec).
