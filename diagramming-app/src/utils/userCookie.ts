/* Utilities to store and retrieve a lightweight currentUser object in a browser cookie.
   This is intentionally minimal — we store a small JSON blob encoded in a cookie under
   the name 'diagram_current_user'. The cookie is not HttpOnly (client code needs to
   read it) but is set with SameSite=Lax and a reasonable Max-Age. If your server
   also sets authentication cookies (HttpOnly access/refresh tokens) those should
   remain authoritative for auth; this cookie is only used to cache the user's
  profile details (id, username, avatarUrl, roles) for UI convenience.
*/

export type MinimalUser = { id: string; username: string; avatarUrl?: string; roles?: string[] } | null;

const COOKIE_NAME = 'diagram_current_user';
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function setCurrentUserCookie(user: any, maxAgeSec = DEFAULT_MAX_AGE) {
  if (typeof document === 'undefined') return;
  try {
    const payload = encodeURIComponent(JSON.stringify(user || null));
    const secure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const secureFlag = secure ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=${payload}; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}${secureFlag}`;
  } catch (e) {
    // Don't break the app if cookie setting fails
    // eslint-disable-next-line no-console
    console.warn('Failed to set current user cookie', e);
  }
}

export function getCurrentUserFromCookie(): MinimalUser {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie ? document.cookie.split(';').map(c => c.trim()) : [];
    for (const c of cookies) {
      if (!c) continue;
      if (c.startsWith(`${COOKIE_NAME}=`)) {
        const value = c.substring(COOKIE_NAME.length + 1);
        if (!value) return null;
        try {
          return JSON.parse(decodeURIComponent(value));
        } catch (e) {
          return null;
        }
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to read current user from cookie', e);
  }
  return null;
}

export function clearCurrentUserCookie() {
  if (typeof document === 'undefined') return;
  try {
    // Setting Max-Age=0 removes the cookie
    const secure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const secureFlag = secure ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secureFlag}`;
    // Dev-only: log when cookie is cleared so we can trace unexpected clears
    const urlFlag = typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('dev_watch') === '1';
    const lsFlag = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('dev_watch_currentUser') === '1';
    const isDevMode = process.env.NODE_ENV !== 'production';
    if (isDevMode || urlFlag || lsFlag) {
      try {
        const evt = { type: 'clearCurrentUserCookie', time: new Date().toISOString(), url: typeof window !== 'undefined' ? window.location.href : 'unknown' };
        try {
          const key = 'dev_user_events';
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
          const arr = raw ? JSON.parse(raw) : [];
          arr.push(evt);
          if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(arr.slice(-200)));
        } catch (e) {
          // ignore
        }
        // eslint-disable-next-line no-console
        console.warn('[dev-watch] clearCurrentUserCookie called', evt);
        // eslint-disable-next-line no-console
        console.warn(new Error('clearCurrentUserCookie stack').stack);
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to clear current user cookie', e);
  }
}
