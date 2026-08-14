# Continue From Here

Last worked on: 2026-08-14. Read this before doing anything else on the admin tool.

## What's done and confirmed working

- **Repo**: `D:\Tealux Web` is `tealuxcafetampaxr/tealux-cafe-tampa-website`, cloned in place. **Nothing from this work is committed to git yet** — everything below is uncommitted local changes.
- **Supabase**: project live (bayaotnzbzhotfrupzhx.supabase.co, creds in `.env`, gitignored). All 4 SQL files have now been run by the user, in order, with no errors (2026-08-14): `schema.sql` → `migration_002_templates.sql` → `seed_boards.sql` → `seed_items.sql`. Tables, RLS, storage bucket, the 3 real boards (Screen 1/2/3) with their fixed sections, and the full ~76-item catalog (linked into sections via `section_items`, including the Self Serve Ramen box's `extra` fields) all exist in the live DB now.
- **Employee accounts**: one shared login exists (`tealuxcafetampaxr@gmail.com`). Kha and Chao both use it — no per-person accounts needed.
- **`/admin/` scaffold**: login.html, items.html, item.html, boards.html, board.html all built and working (login flow verified end-to-end against the live project in-browser; auth-gate redirect verified).
- **Board renderer** (`admin/js/board-renderer.js`): draws the real `templates/Screen_1/2/3.png` backgrounds (box coordinates measured precisely via Python/PIL color-region detection, not eyeballed) and overlays catalog items into each box — auto-shrinking font / falling back to 2 columns if a box overflows, subheadings from `group_label` (e.g. "SIGNATURE BLENDS"), NEW/BEST_SELLER/LIMITED tag pills, and a special layout for the Self Serve Ramen box (price + free-toppings badge + fixed steps + ingredients line). Verified visually against `templates/examples/` mockups using mock data (screenshot comparison) — I couldn't log in myself to test with real auth since I don't handle passwords, so **this still needs a real click-through test by Kha/Chao once items exist**.
- **Real menu data extracted**: `menu-source/extracted_items.json` has the full, corrected current menu (~76 items across 7 sections) pulled from `menu-source/Tealux_Menu_3Screen MOD(1).pptx` via python-pptx, cross-checked against `templates/examples/`. Two ordering bugs in the raw PowerPoint were fixed here (Fried Gyoza → street_food not breakfast_bakery; Avopuff → smoothies not orphaned near toppings) and confirmed correct by the user. Toppings intentionally excluded (static box, not catalog-driven, per user).
- **`menu-source/`** folder holds the PPTX, a zip of isolated food photos, and ~12 individual box/hero photos — all gitignored (large, not needed at runtime).

## Not done yet — pick up here

1. ~~**Write and run `supabase/seed_items.sql`**~~ — done (2026-08-14). Catalog is fully seeded and linked into boards on the live DB.
2. **Real click-through test** — pick up here. Log in as the shared account, open each of the 3 boards, confirm the live-rendered canvas looks right with real data (not mock data this time), export a PNG, sanity-check it. This is the first real end-to-end verification of the renderer.
3. **Add box photos to the renderer** — user decided (2026-08-13) to add one representative photo per box for `street_food`, `breakfast_bakery`, `cakes_desserts`, `self_serve_ramen` (matching the fancier look in `templates/examples/`), using photos from `menu-source/`. Not yet implemented in `board-renderer.js` — needs: deciding where each photo sits within its box (single hero vs small grid — `cakes_desserts`' example shows ~5 small photos, others show 1-2), then extending `drawListBox`/`drawRamenBox` to draw them without breaking the auto-compacting text layout math (text content area shrinks to make room for photos).
4. **Item photos**: individual per-item photos (not box photos) still need uploading through `/admin/item.html`'s uploader — nothing automated for this, it's a manual per-item task for Kha/Chao once they're using the tool day to day.
5. **Commit and push** — ask the user explicitly before doing this (per standing instructions), since nothing has been committed yet.

## Quick orientation if resuming cold

- Read `claude-code-prompt-tealux-menu-webapp.md` (original spec) and `admin/SETUP.md` (setup + how the renderer works) first.
- The board model is NOT freeform/themeable — it's 3 fixed-design PNGs with named content boxes at exact coordinates. Don't reintroduce a generic drag-and-drop board builder; that was explicitly rejected in favor of matching the real existing TV designs.
