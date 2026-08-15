// Tealux Cafe Tampa — employee admin tool
// Shared Supabase client. This key is a client-safe "publishable" key —
// it is meant to ship in browser JS. The actual security boundary is the
// RLS policies in supabase/schema.sql, not keeping this value secret.

const SUPABASE_URL = 'https://bayaotnzbzhotfrupzhx.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_iC9KS1wORUph1KBmukwWBw_WVg3lc0i';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/**
 * Redirects to login if there is no active session. Call at the top of
 * every /admin/ page except login.html. Returns the session when present.
 */
async function requireSession() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = '/admin/login.html';
    return null;
  }
  return session;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = '/admin/login.html';
}

function wireSignOutButtons() {
  document.querySelectorAll('[data-signout]').forEach((btn) => {
    btn.addEventListener('click', signOut);
  });
}

/**
 * Edit history — human-readable, one-line-per-change summaries (generated
 * by the caller at save time), not raw before/after data. Only captures
 * edits made through this admin tool. "90 days" is a rolling display
 * window, not row deletion — see migration_005_edit_history.sql.
 */
async function loadEditHistory(entityType, entityId, limit) {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from('edit_history')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .gte('changed_at', cutoff)
    .order('changed_at', { ascending: false })
    .limit(limit || 50);
  return data || [];
}

async function logEditHistory(entityType, entityId, summaries) {
  const lines = (summaries || []).filter(Boolean);
  if (!lines.length) return;
  await sb.from('edit_history').insert(
    lines.map((summary) => ({ entity_type: entityType, entity_id: entityId, summary }))
  );
}

function formatHistoryDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function renderHistoryList(containerId, rows) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = '<p class="history-empty">No changes in the last 90 days.</p>';
    return;
  }
  const escape = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
  container.innerHTML = rows.map((r) => `
    <div class="history-entry">
      ${escape(r.summary)}
      <span class="history-date">${formatHistoryDate(r.changed_at)}</span>
    </div>
  `).join('');
}

/**
 * Warns before leaving the page (link click, tab close, back button, etc.)
 * if isDirty() returns true. Call once per page after wiring up your
 * change-tracking. Native browser dialog — text isn't customizable.
 */
function warnOnUnsavedChanges(isDirty) {
  window.addEventListener('beforeunload', (e) => {
    if (!isDirty()) return;
    e.preventDefault();
    e.returnValue = '';
  });
}

/**
 * Diffs an item's editable fields into human-readable edit_history summary
 * lines (e.g. "Price changed from $6.50 to $6.75"). Shared by item.html's
 * single-item editor and items.html's inline table edit.
 */
function diffItemFields(before, after) {
  const tagText = { none: 'None', new: 'New', best_seller: 'Best Seller', limited: 'Limited' };
  const statusText = { active: 'Active', sold_out: 'Sold Out', inactive: 'Inactive' };
  const lines = [];
  if ((before.name || '') !== after.name) {
    lines.push(`Name changed from "${before.name || ''}" to "${after.name}"`);
  }
  if (Number(before.price || 0) !== Number(after.price || 0)) {
    lines.push(`Price changed from $${Number(before.price || 0).toFixed(2)} to $${Number(after.price).toFixed(2)}`);
  }
  if ((before.status || 'active') !== after.status) {
    lines.push(`Status changed from ${statusText[before.status] || before.status} to ${statusText[after.status] || after.status}`);
  }
  if ((before.tag || 'none') !== after.tag) {
    lines.push(`Tag changed from ${tagText[before.tag] || before.tag || 'None'} to ${tagText[after.tag] || after.tag}`);
  }
  if ((before.category || '') !== (after.category || '')) {
    lines.push(`Category changed from "${before.category || '—'}" to "${after.category || '—'}"`);
  }
  if ((before.description || '') !== (after.description || '')) {
    lines.push('Description updated');
  }
  if (!!before.featured !== !!after.featured) {
    lines.push(after.featured ? 'Marked as featured' : 'Unmarked as featured');
  }
  return lines;
}
