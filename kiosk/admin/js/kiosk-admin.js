// Tealux Cafe Tampa — kiosk display management
// Lightweight CRUD over kiosk_cards. Reuses the shared admin Supabase client
// (sb, requireSession, wireSignOutButtons) from /admin/js/supabase-client.js
// and the "item-images" storage bucket for photos (see item.html for the
// same upload pattern).

const listEl = document.getElementById('kiosk-list');
const loadingEl = document.getElementById('loading');
const emptyEl = document.getElementById('empty-state');
const errorEl = document.getElementById('form-error');
const editorEl = document.getElementById('card-editor');
const editorTitleEl = document.getElementById('editor-title');

const fieldId = document.getElementById('card-id');
const fieldType = document.getElementById('card-type');
const fieldTitle = document.getElementById('card-title');
const fieldShowTitle = document.getElementById('card-show-title');
const fieldSubtitle = document.getElementById('card-subtitle');
const fieldPrice = document.getElementById('card-price');
const fieldDuration = document.getElementById('card-duration');
const fieldActive = document.getElementById('card-active');
const uploadTile = document.getElementById('upload-tile');
const fileInput = document.getElementById('file-input');

const DEFAULT_DURATION_SECONDS = 12;

let cards = [];
let pendingMediaUrl = null;
let pendingMediaType = 'image';

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.add('show');
}
function clearError() {
  errorEl.textContent = '';
  errorEl.classList.remove('show');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderList() {
  if (cards.length === 0) {
    listEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'flex';

  listEl.innerHTML = cards.map((card, i) => `
    <div class="panel kiosk-card-row" data-id="${card.id}">
      ${card.media_url && card.media_type === 'video'
        ? `<div class="item-thumb-placeholder">&#127909; Video</div>`
        : card.media_url
        ? `<img class="item-thumb" src="${card.media_url}" alt="" />`
        : `<div class="item-thumb-placeholder">No photo</div>`}
      <div class="card-info">
        <h3>
          ${card.title ? escapeHtml(card.title) : '<em>Untitled card</em>'}
          ${card.type === 'highlight' ? '<span class="badge badge-tag">Highlight</span>' : ''}
          ${card.active ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}
        </h3>
        <p>${escapeHtml(card.subtitle) || '&nbsp;'}</p>
      </div>
      <div class="card-actions">
        <button type="button" data-action="up" ${i === 0 ? 'disabled' : ''} title="Move up">&uarr;</button>
        <button type="button" data-action="down" ${i === cards.length - 1 ? 'disabled' : ''} title="Move down">&darr;</button>
        <button type="button" class="btn btn-outline btn-sm" data-action="edit">Edit</button>
      </div>
    </div>
  `).join('');
}

async function loadCards() {
  loadingEl.style.display = 'flex';
  listEl.style.display = 'none';
  emptyEl.style.display = 'none';

  const { data, error } = await sb
    .from('kiosk_cards')
    .select('*')
    .order('sort_order', { ascending: true });

  loadingEl.style.display = 'none';

  if (error) {
    showError('Failed to load kiosk cards: ' + error.message);
    return;
  }
  cards = data || [];
  renderList();
}

async function moveCard(id, direction) {
  const index = cards.findIndex((c) => c.id === id);
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= cards.length) return;

  const a = cards[index];
  const b = cards[swapIndex];
  const { error } = await sb.from('kiosk_cards').upsert([
    { id: a.id, sort_order: b.sort_order },
    { id: b.id, sort_order: a.sort_order },
  ]);
  if (error) {
    showError('Failed to reorder: ' + error.message);
    return;
  }
  await loadCards();
}

function openEditor(card) {
  clearError();
  pendingMediaUrl = card ? card.media_url : null;
  pendingMediaType = card ? card.media_type : 'image';
  fieldId.value = card ? card.id : '';
  fieldType.value = card ? card.type : 'promo';
  fieldTitle.value = card ? card.title : '';
  fieldShowTitle.checked = card ? card.show_title !== false : true;
  fieldSubtitle.value = card ? card.subtitle || '' : '';
  fieldPrice.value = card ? card.price || '' : '';
  fieldDuration.value = card && card.duration_seconds ? card.duration_seconds : DEFAULT_DURATION_SECONDS;
  fieldActive.checked = card ? card.active : true;

  updateUploadTile();
  editorTitleEl.textContent = card ? 'Edit Card' : 'Add Card';
  document.getElementById('btn-delete').style.display = card ? '' : 'none';
  editorEl.style.display = 'block';
  editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEditor() {
  editorEl.style.display = 'none';
}

function updateUploadTile() {
  uploadTile.style.backgroundImage = '';
  uploadTile.innerHTML = '';

  if (!pendingMediaUrl) {
    uploadTile.classList.remove('has-image');
    uploadTile.textContent = '+ Add photo or video';
    return;
  }

  uploadTile.classList.add('has-image');
  if (pendingMediaType === 'video') {
    const video = document.createElement('video');
    video.src = pendingMediaUrl;
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.style.cssText = 'width:100%; height:100%; object-fit:cover;';
    uploadTile.appendChild(video);
  } else {
    uploadTile.style.backgroundImage = `url('${pendingMediaUrl}')`;
  }
}

uploadTile.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const isVideo = file.type.startsWith('video/');
  const path = `kiosk/${Date.now()}-${file.name}`;
  const { error: uploadError } = await sb.storage.from('item-images').upload(path, file);
  if (uploadError) {
    showError('Upload failed: ' + uploadError.message);
    return;
  }
  const { data: pub } = sb.storage.from('item-images').getPublicUrl(path);
  pendingMediaUrl = pub.publicUrl;
  pendingMediaType = isVideo ? 'video' : 'image';
  updateUploadTile();
});

document.getElementById('btn-add').addEventListener('click', () => openEditor(null));
document.getElementById('btn-cancel').addEventListener('click', closeEditor);

document.getElementById('btn-save').addEventListener('click', async () => {
  clearError();
  const title = fieldTitle.value.trim();
  const duration = parseInt(fieldDuration.value, 10);

  const payload = {
    type: fieldType.value,
    title,
    show_title: fieldShowTitle.checked,
    subtitle: fieldSubtitle.value.trim(),
    price: fieldPrice.value.trim(),
    duration_seconds: duration > 0 ? duration : DEFAULT_DURATION_SECONDS,
    media_url: pendingMediaUrl,
    media_type: pendingMediaType,
    active: fieldActive.checked,
  };

  let error;
  if (fieldId.value) {
    ({ error } = await sb.from('kiosk_cards').update(payload).eq('id', fieldId.value));
  } else {
    payload.sort_order = cards.length;
    ({ error } = await sb.from('kiosk_cards').insert(payload));
  }

  if (error) {
    showError('Save failed: ' + error.message);
    return;
  }
  closeEditor();
  await loadCards();
});

document.getElementById('btn-delete').addEventListener('click', async () => {
  if (!fieldId.value) return;
  if (!confirm('Delete this kiosk card? This cannot be undone.')) return;
  const { error } = await sb.from('kiosk_cards').delete().eq('id', fieldId.value);
  if (error) {
    showError('Delete failed: ' + error.message);
    return;
  }
  closeEditor();
  await loadCards();
});

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const row = e.target.closest('[data-id]');
  const id = row.dataset.id;
  const action = btn.dataset.action;

  if (action === 'up' || action === 'down') {
    moveCard(id, action);
  } else if (action === 'edit') {
    openEditor(cards.find((c) => c.id === id));
  }
});

const fieldTransition = document.getElementById('setting-transition');

async function loadSettings() {
  const { data, error } = await sb
    .from('kiosk_settings')
    .select('transition_style')
    .eq('id', 1)
    .single();
  if (error || !data) return;
  fieldTransition.value = data.transition_style;
}

document.getElementById('btn-save-settings').addEventListener('click', async () => {
  clearError();
  const { error } = await sb
    .from('kiosk_settings')
    .update({ transition_style: fieldTransition.value })
    .eq('id', 1);
  if (error) {
    showError('Failed to save display settings: ' + error.message);
  }
});

(async () => {
  const session = await requireSession();
  if (!session) return;
  wireSignOutButtons();
  await loadSettings();
  await loadCards();
})();
