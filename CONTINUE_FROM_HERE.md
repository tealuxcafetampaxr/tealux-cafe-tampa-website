# Continue From Here

Last worked on: 2026-08-14. Read this before doing anything else on the admin tool.

## Status: deployed and fully click-through tested

The admin tool is live at `tealuxcafetampa.com/admin/login.html` (unlisted on purpose —
no link from the public site; decided 2026-08-14, revisit only if Kha/Chao ask for a
bookmark-free way in). All commits below are pushed to `main`.

## Confirmed working (real click-through, real data, live site)

- Login/auth gate, items catalog (`items.html`, `item.html`) — infinite-loading bug fixed.
- **All 3 screens** now have real data loaded and have been clicked through by the user —
  no further layout issues reported (2026-08-14).
- **Screen 3** specifically: item lists, group-label dropdown, board-photo upload/drag/resize,
  and PNG export (1920×1080, correct resolution, photos render cleanly) all confirmed good
  (`snippets/screen-3.png`).
- Milk Tea box (Screen 1) text position — was rendering off the left edge, re-measured and fixed.
- **Row-spacing slider** — user confirmed it works well (2026-08-14).

## If something looks off later

Only the milk_tea box's coordinates were rigorously re-verified pixel-by-pixel (the rest passed
a visual click-through, not a precision re-measure). If a box's text ever looks misaligned,
re-measure it via PIL color-boundary scan on the source PNG (see `board-renderer.js`
`BOARD_TEMPLATES`) rather than eyeballing/guessing new coordinates.

## Built 2026-08-14, NOT yet run/tested — inactive status, edit history, unsaved-changes warning

- **`migration_004_inactive_status.sql`** — adds `items.status = 'inactive'` (in addition to
  active/sold_out). Selecting it excludes the item from the board editor's "add item" and ramen
  "priced item" dropdowns, AND the renderer itself skips it even if already linked to a board
  from before it was deactivated (`board-renderer.js` `buildRows()`/`drawRamenBox()`).
- **`migration_005_edit_history.sql`** — new `edit_history` table. Both `item.html` and
  `board.html` now show a "Recent Changes" panel (last 90 days) generated from **human-readable
  summaries built at save time** (e.g. "Price changed from $6.50 to $6.75"), not raw DB diffs —
  deliberate tradeoff, see the migration file's comment. Only captures edits made through the
  admin tool itself. No per-person attribution (shared login) — what/when only, confirmed
  acceptable by the user. "90 days" is a rolling *display* window (query filter), not actual row
  deletion — also deliberate, data volume here is tiny.
- **Unsaved-changes warning** — both pages now track a `dirty` flag and warn via the native
  browser `beforeunload` dialog if you try to navigate away with unsaved edits. Board photos
  (which already save immediately on drag-end) do NOT count as dirty — only Save-gated changes
  (item fields, section items/labels, row spacing, ramen fields) do.
- Both migrations run against the live DB, no errors (2026-08-14). **Not yet tested in the app, and not yet committed/pushed** — the code above is still only local (Netlify hasn't deployed it).

## Ongoing manual task (not blocked on anything)

- **Individual item photos** (distinct from board photos) still need uploading one-by-one
  through `/admin/item.html`'s gallery uploader — that's just data entry for Kha/Chao as they
  use the tool, not a build task.

## Quick orientation if resuming cold

- Read `claude-code-prompt-tealux-menu-webapp.md` (original spec) and `admin/SETUP.md` (setup +
  how the renderer works) first.
- DB setup order: `schema.sql` → `migration_002_templates.sql` → `seed_boards.sql` →
  `seed_items.sql` → `migration_003_board_images.sql` → `migration_004_inactive_status.sql` →
  `migration_005_edit_history.sql`. All 7 have been run on the live DB.
- The **section/box layout** is NOT freeform — it's 3 fixed-design PNGs with named content boxes
  at exact coordinates. Don't reintroduce a generic drag-and-drop *layout* builder, that was
  explicitly rejected in favor of matching the real TV designs. **Board photos are the one
  deliberate exception** — freeform upload/drag/resize, rendered as their own layer strictly
  between the background and the item-text layer so a photo can never cover text.
- `admin/js/board-renderer.js` is the single source of truth for template box coordinates,
  font-size auto-shrink, and now per-section row spacing (`sections.extra.line_spacing`).
