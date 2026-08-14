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

## Ongoing manual task (not blocked on anything)

- **Individual item photos** (distinct from board photos) still need uploading one-by-one
  through `/admin/item.html`'s gallery uploader — that's just data entry for Kha/Chao as they
  use the tool, not a build task.

## Quick orientation if resuming cold

- Read `claude-code-prompt-tealux-menu-webapp.md` (original spec) and `admin/SETUP.md` (setup +
  how the renderer works) first.
- DB setup order: `schema.sql` → `migration_002_templates.sql` → `seed_boards.sql` →
  `seed_items.sql` → `migration_003_board_images.sql`. All 5 have been run on the live DB.
- The **section/box layout** is NOT freeform — it's 3 fixed-design PNGs with named content boxes
  at exact coordinates. Don't reintroduce a generic drag-and-drop *layout* builder, that was
  explicitly rejected in favor of matching the real TV designs. **Board photos are the one
  deliberate exception** — freeform upload/drag/resize, rendered as their own layer strictly
  between the background and the item-text layer so a photo can never cover text.
- `admin/js/board-renderer.js` is the single source of truth for template box coordinates,
  font-size auto-shrink, and now per-section row spacing (`sections.extra.line_spacing`).
