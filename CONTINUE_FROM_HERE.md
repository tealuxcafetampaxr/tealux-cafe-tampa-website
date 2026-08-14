# Continue From Here

Last worked on: 2026-08-14. Read this before doing anything else on the admin tool.

## What's done and confirmed working

- **Repo**: `D:\Tealux Web` is `tealuxcafetampaxr/tealux-cafe-tampa-website`. The first version of the admin tool (scaffold, renderer, schema/migration/seed SQL, real menu data) was committed and pushed to `main` on 2026-08-14 (commit `431abe4`). It should be live at `tealuxcafetampa.com/admin/login.html` once Netlify finishes deploying.
- **Supabase**: project live (bayaotnzbzhotfrupzhx.supabase.co, creds in `.env`, gitignored). Live DB has run, in order: `schema.sql` → `migration_002_templates.sql` → `seed_boards.sql` → `seed_items.sql` → `migration_003_board_images.sql` (2026-08-14, no errors). Tables, RLS, storage buckets (`item-images` + `board-images`), the 3 real boards (Screen 1/2/3) with their fixed sections, the full ~76-item catalog, and the `board_images` table all exist on the live DB now.
- **Employee accounts**: one shared login exists (`tealuxcafetampaxr@gmail.com`). Kha and Chao both use it — no per-person accounts needed.
- **`/admin/` scaffold**: login.html, items.html, item.html, boards.html, board.html all built.
- **Real menu data**: `menu-source/extracted_items.json` (~76 items, corrected against the PPTX and `templates/examples/`), seeded into the live DB.

## Bugs found during first real usage (2026-08-14) and fixed — NOT yet committed

The user did the first real click-through and found several issues. All fixed in the working tree but still uncommitted:

1. **`items.html` and `item.html` were stuck on an infinite loading spinner.** Root cause: both called `supabase.from(...)` where `supabase` is just the CDN library namespace (has `.createClient` but no `.from`) — the actual client instance is `sb` (from `supabase-client.js`). This threw an uncaught promise rejection before the loading spinner was ever hidden. Fixed all 3 call sites (`items.html` ×2, `item.html` ×1) to use `sb`.
2. **Milk Tea items rendered too far left, off the box.** The `milk_tea` box's coded left edge (`x: 1055`) was wrong — re-measured via PIL color-boundary detection on `templates/Screen_1.png` and confirmed the real cream-colored content area starts at `x: 1160` (the gap between 1055–1160 is a decorative graphic between the two Screen 1 boxes, not part of milk_tea's box). Top/bottom/right edges were already correct (that's why price placement looked fine). Fixed in `BOARD_TEMPLATES.screen_1` in `board-renderer.js`. **Only milk_tea was re-verified this precisely — the other 6 boxes have NOT been re-audited pixel-by-pixel; a quick automated cross-check was inconclusive (the page background is the same cream family as the box interiors in places, so simple color detection can't reliably tell them apart). If other boxes look off during testing, re-measure them the same way (PIL color-boundary scan, not eyeballing).**
3. **Group label typos** (the per-item subheading like "Signature Blends" that prints on the actual board) — was a free-text input, so a typo both prints wrong on the board and fragments grouping (two near-identical labels = two headings instead of one). Changed to a dropdown of labels already used in that section, plus "+ New label…" to add one. Also fixed a related bug where editing this field never triggered a live-preview redraw.

## New feature built 2026-08-14, NOT yet run/tested — freeform board photos

User wants photo placement to be freeform (upload anywhere, drag to move, handle to resize), not the originally-planned "one fixed photo per box." Built:

- `supabase/migration_003_board_images.sql` — new `board_images` table (board_id, storage_url, x/y/w/h, sort_order) + new public `board-images` storage bucket + RLS. **Not run against the live DB yet.**
- `admin/js/board-renderer.js` — added `drawBoardImages()`, called from `renderBoard()` between the background and the box-text layer, so photos can never cover item text. Also added an image cache (`_imageCache`) since drag/resize can trigger many redraws per second.
- `admin/board.html` — new "Board Photos" panel (upload button, thumbnail list, delete), and a drag/resize overlay on the canvas (`#image-overlay`, `.image-handle`) using pointer events. Position/size persist to the DB immediately on drag-end (not gated behind the "Save" button, which only covers sections/items).

This supersedes the earlier plan (`CONTINUE_FROM_HERE.md` used to say "add one fixed photo per box, matching `templates/examples/`") — that's no longer the approach; freeform is.

## Not done yet — pick up here

1. **Real click-through test, this time actually thorough** — pick up here. Log in, open each of the 3 boards, check every box's text position (not just milk_tea), try the new group-label dropdown, try uploading/dragging/resizing a board photo, export a PNG.
2. **Item photos**: individual per-item photos (not board photos) still need uploading through `/admin/item.html`'s uploader — manual per-item task for Kha/Chao once they're using the tool day to day.
3. **Commit and push** the bug fixes + freeform image feature — ask the user explicitly before doing this (per standing instructions).

## Quick orientation if resuming cold

- Read `claude-code-prompt-tealux-menu-webapp.md` (original spec) and `admin/SETUP.md` (setup + how the renderer works) first.
- The **section/box layout** is NOT freeform — it's 3 fixed-design PNGs with named content boxes at exact coordinates; don't reintroduce a generic drag-and-drop *layout* builder, that was explicitly rejected in favor of matching the real TV designs. **Photos are the one deliberate exception** — those are freeform (upload/drag/resize) per the 2026-08-14 decision above, layered so they never interfere with the fixed text layout.
