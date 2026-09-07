// Tealux Cafe Tampa — counter kiosk display
// Public, unauthenticated: reads only active kiosk_cards (RLS allows anon
// read of active=true rows — see supabase/migration_009_kiosk.sql).

const SUPABASE_URL = 'https://bayaotnzbzhotfrupzhx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_iC9KS1wORUph1KBmukwWBw_WVg3lc0i';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const CARD_SECONDS = 12;
const REFRESH_MINUTES = 3;

const stage = document.getElementById('stage');
const dots = document.getElementById('dots');

let cards = [];
let current = 0;
let rotateTimer = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderCard(card) {
  const el = document.createElement('div');
  el.className = 'kiosk-card';

  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'kiosk-card-media' + (card.media_url ? '' : ' no-media');

  if (card.media_url && card.media_type === 'video') {
    const video = document.createElement('video');
    video.className = 'kiosk-card-video';
    video.src = card.media_url;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    mediaWrap.appendChild(video);
  } else if (card.media_url) {
    mediaWrap.style.backgroundImage = `url('${card.media_url}')`;
  }
  el.appendChild(mediaWrap);

  if (card.type === 'highlight') {
    const badge = document.createElement('div');
    badge.className = 'kiosk-badge';
    badge.textContent = "This Week's Highlight";
    el.appendChild(badge);
  }

  const overlay = document.createElement('div');
  overlay.className = 'kiosk-card-overlay';
  overlay.innerHTML = `
    <div class="kiosk-card-title">${escapeHtml(card.title)}</div>
    ${card.subtitle ? `<div class="kiosk-card-subtitle">${escapeHtml(card.subtitle)}</div>` : ''}
    ${card.price ? `<div class="kiosk-card-price">${escapeHtml(card.price)}</div>` : ''}
  `;
  el.appendChild(overlay);

  return el;
}

function renderDots() {
  dots.innerHTML = '';
  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'kiosk-dot' + (i === current ? ' is-active' : '');
    dots.appendChild(dot);
  });
}

function showCard(index) {
  current = index;
  const els = stage.querySelectorAll('.kiosk-card');
  els.forEach((el, i) => el.classList.toggle('is-active', i === current));
  renderDots();
}

function startRotation() {
  if (rotateTimer) clearInterval(rotateTimer);
  if (cards.length <= 1) return;
  rotateTimer = setInterval(() => {
    showCard((current + 1) % cards.length);
  }, CARD_SECONDS * 1000);
}

function renderEmpty() {
  stage.innerHTML = `
    <div class="kiosk-empty">
      <div class="kiosk-card-title" style="font-size:2rem;">Welcome to Tealux Cafe</div>
      <div class="kiosk-card-subtitle">Boba, milk tea &amp; desserts</div>
    </div>
  `;
  dots.innerHTML = '';
}

async function loadCards() {
  const { data, error } = await sb
    .from('kiosk_cards')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error || !data || data.length === 0) {
    cards = [];
    renderEmpty();
    return;
  }

  const wasEmpty = cards.length === 0;
  cards = data;
  stage.innerHTML = '';
  cards.forEach((card) => stage.appendChild(renderCard(card)));
  showCard(wasEmpty ? 0 : Math.min(current, cards.length - 1));
  startRotation();
}

loadCards();
setInterval(loadCards, REFRESH_MINUTES * 60 * 1000);
