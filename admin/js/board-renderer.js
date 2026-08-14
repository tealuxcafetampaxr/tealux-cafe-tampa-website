// Tealux Cafe Tampa — menu board canvas renderer
//
// Boards render onto a FIXED background PNG (the real Screen 1/2/3 TV
// designs in /templates/). Each template defines named content boxes at
// exact pixel coordinates (measured from the source PNGs); this module
// draws the background then overlays each box's item list into its box.
//
// All coordinates/sizes below are in "reference pixels" — the original
// template PNGs' native resolution (1672x941). At render time everything
// is scaled uniformly to the board's actual canvas size.

const REF_WIDTH = 1672;
const REF_HEIGHT = 941;

const COLOR_BULLET = '#F0B300';
const COLOR_ACCENT = '#C35A55';
const COLOR_TEXT = '#171412';
const COLOR_DESC = '#8A8378';
const COLOR_TAG_BG = '#C35A55';
const COLOR_TAG_TEXT = '#FFFFFF';

const TAG_LABELS = { new: 'NEW', best_seller: 'BEST SELLER', limited: 'LIMITED' };

const BOARD_TEMPLATES = {
  screen_1: {
    image: '/templates/Screen_1.png',
    boxes: [
      { key: 'fruit_teas', x: 31, y: 22, w: 488, h: 703, contentY: 115, style: 'list' },
      { key: 'milk_tea', x: 1160, y: 22, w: 480, h: 703, contentY: 115, style: 'list' },
    ],
  },
  screen_2: {
    image: '/templates/Screen_2.png',
    boxes: [
      { key: 'vietnamese_coffee', x: 42, y: 67, w: 478, h: 775, contentY: 211, style: 'list' },
      { key: 'smoothies', x: 1128, y: 68, w: 505, h: 416, contentY: 113, style: 'list' },
    ],
  },
  screen_3: {
    image: '/templates/Screen_3.png',
    boxes: [
      { key: 'street_food', x: 33, y: 113, w: 413, h: 729, contentY: 118, style: 'list' },
      { key: 'breakfast_bakery', x: 464, y: 154, w: 720, h: 392, contentY: 77, style: 'list' },
      { key: 'cakes_desserts', x: 464, y: 559, w: 720, h: 281, contentY: 75, style: 'list' },
      { key: 'self_serve_ramen', x: 1203, y: 113, w: 437, h: 728, contentY: 118, style: 'special' },
    ],
  },
};

const BOX_PAD_X = 26;
const BOX_PAD_BOTTOM = 24;

function money(n) {
  return '$' + Number(n || 0).toFixed(2);
}

// Cached by src so drag/resize redraws (which can fire many times per
// second) don't reload the same background/photo over and over.
const _imageCache = {};
function loadImage(src) {
  if (_imageCache[src]) return _imageCache[src];
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    // Board photos load cross-origin from Supabase Storage. Without this,
    // drawing them onto the canvas taints it, and canvas.toDataURL() (the
    // PNG export) throws a SecurityError. Supabase's public buckets send
    // Access-Control-Allow-Origin, so this is safe.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  _imageCache[src] = p;
  return p;
}

// Draws user-placed photos (freeform, board-pixel-space coordinates) as
// their own layer — always between the background and the box text layer,
// so a photo can never cover/obscure an item list.
async function drawBoardImages(ctx, images) {
  for (const im of (images || [])) {
    try {
      const img = await loadImage(im.storage_url);
      ctx.drawImage(img, im.x, im.y, im.w, im.h);
    } catch (e) {
      // Broken/unreachable image URL — skip it rather than break the board.
    }
  }
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid).trimEnd() + '…';
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo).trimEnd() + '…';
}

// Builds the flat list of rows to draw: subheadings inserted wherever
// group_label changes, one row per item otherwise.
function buildRows(sectionItems, itemsById) {
  const rows = [];
  let lastLabel = null;
  sectionItems.forEach((si) => {
    const item = itemsById[si.item_id];
    if (!item) return;
    const label = (si.group_label || '').trim();
    if (label && label !== lastLabel) {
      rows.push({ type: 'heading', text: label });
    }
    lastLabel = label || lastLabel;
    if (!label) lastLabel = null;
    rows.push({
      type: 'item',
      name: item.name,
      description: item.description,
      price: item.price,
      tag: item.tag,
    });
  });
  return rows;
}

const FONT_STEPS = [19, 18, 17, 16, 15, 14, 13, 12, 11];
const HEADING_LINE_FACTOR = 2.05;
const ITEM_LINE_FACTOR = 1.62;

// spacing is a per-section multiplier (default 1) on the gap between rows —
// lets an employee manually stretch a sparse box's items to fill more of
// its height, or tighten a crowded one, independent of font size.
function measureTotalHeight(rows, fontSize, spacing) {
  let h = 0;
  rows.forEach((row) => {
    h += fontSize * (row.type === 'heading' ? HEADING_LINE_FACTOR : ITEM_LINE_FACTOR) * spacing;
  });
  return h;
}

function pickFontSize(rows, availableHeight, spacing) {
  for (const size of FONT_STEPS) {
    if (measureTotalHeight(rows, size, spacing) <= availableHeight) return size;
  }
  return FONT_STEPS[FONT_STEPS.length - 1];
}

function drawRowsColumn(ctx, rows, fontSize, x, top, width, bottomLimit, spacing) {
  let y = top;
  for (const row of rows) {
    const lineH = fontSize * (row.type === 'heading' ? HEADING_LINE_FACTOR : ITEM_LINE_FACTOR) * spacing;
    if (y + lineH > bottomLimit + 2) break; // safety: never draw past the box

    if (row.type === 'heading') {
      ctx.fillStyle = COLOR_ACCENT;
      ctx.font = `900 ${Math.round(fontSize * 0.82)}px 'Arial Black', Arial, sans-serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(row.text.toUpperCase(), x, y + fontSize * 0.75);
      const textW = ctx.measureText(row.text.toUpperCase()).width;
      const lineY = y + fontSize * 0.75 - fontSize * 0.28;
      ctx.strokeStyle = COLOR_ACCENT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + textW + 12, lineY);
      ctx.lineTo(x + width, lineY);
      ctx.stroke();
    } else {
      const rowY = y + fontSize * 0.78;
      // bullet
      ctx.fillStyle = COLOR_BULLET;
      ctx.beginPath();
      ctx.arc(x + fontSize * 0.14, rowY - fontSize * 0.32, fontSize * 0.13, 0, Math.PI * 2);
      ctx.fill();

      const textX = x + fontSize * 0.5;
      ctx.textBaseline = 'alphabetic';

      // price (measure first so name/description can be truncated against it)
      const priceStr = money(row.price);
      ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
      const priceW = ctx.measureText(priceStr).width;

      // optional tag pill
      let tagW = 0;
      const tagLabel = TAG_LABELS[row.tag];
      if (tagLabel) {
        ctx.font = `700 ${Math.round(fontSize * 0.6)}px Arial, sans-serif`;
        tagW = ctx.measureText(tagLabel).width + fontSize * 0.7;
      }

      const rightReserved = priceW + tagW + fontSize * 0.6;
      const maxNameWidth = (x + width) - textX - rightReserved;

      ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
      ctx.fillStyle = COLOR_TEXT;
      let nameText = row.name;
      let descText = row.description ? '   ' + row.description : '';
      let combined = nameText + descText;
      if (ctx.measureText(combined).width > maxNameWidth) {
        // shrink description first, then name
        if (descText) {
          const nameW = ctx.measureText(nameText).width;
          ctx.font = `400 ${Math.round(fontSize * 0.82)}px Arial, sans-serif`;
          descText = truncateToWidth(ctx, ' ' + row.description, Math.max(0, maxNameWidth - nameW - 8));
          if (ctx.measureText(descText).width < 4) descText = '';
        }
        ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
        if (!descText) nameText = truncateToWidth(ctx, nameText, maxNameWidth);
      }

      ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
      ctx.fillStyle = COLOR_TEXT;
      ctx.fillText(nameText, textX, rowY);
      const nameW = ctx.measureText(nameText).width;

      if (descText) {
        ctx.font = `400 ${Math.round(fontSize * 0.82)}px Arial, sans-serif`;
        ctx.fillStyle = COLOR_DESC;
        ctx.fillText(descText, textX + nameW, rowY);
      }

      // tag pill (right-aligned, just left of price)
      let priceRightEdge = x + width;
      ctx.textAlign = 'right';
      ctx.font = `900 ${fontSize}px 'Arial Black', Arial, sans-serif`;
      ctx.fillStyle = COLOR_TEXT;
      ctx.fillText(priceStr, priceRightEdge, rowY);
      ctx.textAlign = 'left';

      if (tagLabel) {
        const pillW = tagW;
        const pillH = fontSize * 0.95;
        const pillX = priceRightEdge - priceW - fontSize * 0.5 - pillW;
        const pillY = rowY - fontSize * 0.78;
        ctx.fillStyle = COLOR_TAG_BG;
        roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.fillStyle = COLOR_TAG_TEXT;
        ctx.font = `700 ${Math.round(fontSize * 0.6)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(tagLabel, pillX + pillW / 2, pillY + pillH * 0.68);
        ctx.textAlign = 'left';
      }
    }
    y += lineH;
  }
  return y;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawListBox(ctx, box, section, itemsById) {
  const rows = buildRows(section.items || [], itemsById);
  if (rows.length === 0) return;

  const spacing = (section.extra && section.extra.line_spacing) || 1;

  const contentTop = box.y + box.contentY;
  const contentBottom = box.y + box.h - BOX_PAD_BOTTOM;
  const availableHeight = contentBottom - contentTop;
  const innerX = box.x + BOX_PAD_X;
  const innerWidth = box.w - BOX_PAD_X * 2;

  let fontSize = pickFontSize(rows, availableHeight, spacing);

  // Fallback: if even the smallest font overflows, split into two columns.
  if (measureTotalHeight(rows, fontSize, spacing) > availableHeight && box.w > 500) {
    const mid = Math.ceil(rows.length / 2);
    const left = rows.slice(0, mid);
    const right = rows.slice(mid);
    const colGutter = 28;
    const colWidth = (innerWidth - colGutter) / 2;
    const fsLeft = pickFontSize(left, availableHeight, spacing);
    const fsRight = pickFontSize(right, availableHeight, spacing);
    const fs = Math.min(fsLeft, fsRight);
    drawRowsColumn(ctx, left, fs, innerX, contentTop, colWidth, contentBottom, spacing);
    drawRowsColumn(ctx, right, fs, innerX + colWidth + colGutter, contentTop, colWidth, contentBottom, spacing);
    return;
  }

  drawRowsColumn(ctx, rows, fontSize, innerX, contentTop, innerWidth, contentBottom, spacing);
}

function drawRamenBox(ctx, box, section, itemsById) {
  const innerX = box.x + BOX_PAD_X;
  const innerWidth = box.w - BOX_PAD_X * 2;
  let y = box.y + box.contentY;

  const priceItemId = section.extra && section.extra.price_item_id;
  const item = priceItemId ? itemsById[priceItemId] : null;
  const priceStr = item ? money(item.price) : '—';
  const freeToppings = (section.extra && section.extra.free_toppings_count) || 0;
  const ingredients = (section.extra && section.extra.ingredients) || '';

  ctx.textAlign = 'left';
  ctx.fillStyle = COLOR_ACCENT;
  ctx.font = `900 64px 'Arial Black', Arial, sans-serif`;
  ctx.fillText(priceStr, innerX, y + 60);
  y += 90;

  if (freeToppings > 0) {
    const label = `${freeToppings} FREE TOPPING${freeToppings === 1 ? '' : 'S'}`;
    ctx.font = `700 20px Arial, sans-serif`;
    const w = ctx.measureText(label).width + 36;
    ctx.fillStyle = COLOR_ACCENT;
    roundRect(ctx, innerX, y, w, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(label, innerX + w / 2, y + 26);
    ctx.textAlign = 'left';
    y += 66;
  }

  const steps = ['SELECT A MENU #', 'PUSH START!', 'ENJOY!'];
  steps.forEach((step, i) => {
    ctx.fillStyle = COLOR_BULLET;
    ctx.beginPath();
    ctx.arc(innerX + 16, y + 14, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 16px 'Arial Black', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), innerX + 16, y + 20);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = `900 22px 'Arial Black', Arial, sans-serif`;
    ctx.fillText(step, innerX + 44, y + 22);
    y += 52;
  });

  if (ingredients) {
    const bottomY = box.y + box.h - 30;
    ctx.font = `700 18px Arial, sans-serif`;
    ctx.fillStyle = COLOR_ACCENT;
    const text = truncateToWidth(ctx, ingredients, innerWidth);
    ctx.fillText(text, innerX, bottomY);
  }
}

/**
 * Renders a board onto ctx (already sized to the board's output resolution).
 * sections: array of { box_key, style, extra, items: [{ item_id, group_label, sort_order }] }
 * itemsById: { [item_id]: { name, description, price, tag } }
 */
async function renderBoard(ctx, canvasWidth, canvasHeight, templateKey, sections, itemsById, boardImages) {
  const template = BOARD_TEMPLATES[templateKey];
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (!template) return;

  const scale = canvasWidth / REF_WIDTH;

  const bg = await loadImage(template.image);
  ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);

  // Freeform photo layer — sits between the background and the box text
  // layer below, in the board's own pixel space (not the reference-pixel
  // template scale), so it never shifts with template scaling and never
  // covers text.
  await drawBoardImages(ctx, boardImages);

  const sectionByBox = {};
  sections.forEach((s) => { sectionByBox[s.box_key] = s; });

  ctx.save();
  ctx.scale(scale, scale);

  template.boxes.forEach((box) => {
    const section = sectionByBox[box.key];
    if (!section) return;
    if (box.style === 'special') {
      drawRamenBox(ctx, box, section, itemsById);
    } else {
      drawListBox(ctx, box, section, itemsById);
    }
  });

  ctx.restore();
}
