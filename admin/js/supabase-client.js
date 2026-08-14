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
