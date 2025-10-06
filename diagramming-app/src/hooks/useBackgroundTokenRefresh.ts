import { useEffect, useRef } from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import { getCurrentUserFromCookie, setCurrentUserCookie } from '../utils/userCookie';

type Options = { intervalMs?: number };

/**
 * Starts a background refresh task that periodically POSTs to /auth/refresh to
 * rotate refresh tokens and keep the user's session alive while the app is open.
 *
 * Behavior:
 * - Calls /auth/refresh initially on mount and then every intervalMs (default 24h).
 * - After a successful refresh it calls /auth/me to refresh the client-side profile
 *   and persists that profile into the visible user cookie and in-memory store.
 * - If refresh returns 401/403, logs the user out via the store logout action.
 * - When the page becomes visible after being hidden, an immediate refresh is attempted.
 */
export default function useBackgroundTokenRefresh(opts?: Options) {
  const intervalMs = opts?.intervalMs ?? (24 * 60 * 60 * 1000); // default: 24 hours
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';
    // Only attempt background refresh when we appear to have a current user (cookie or store)
    const initialUser = getCurrentUserFromCookie() || useDiagramStore.getState().currentUser;
    if (!initialUser) return undefined;

    let timer: any = null;

    async function doRefresh() {
      try {
        const resp = await fetch(`${serverUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (resp.ok) {
          // After a successful rotation, fetch /me to update profile info
          try {
            const me = await fetch(`${serverUrl}/auth/me`, { method: 'GET', credentials: 'include' });
            if (me.ok) {
              const json = await me.json();
              if (json && json.user) {
                setCurrentUserCookie(json.user);
                // Update in-memory store with latest profile
                useDiagramStore.setState({ currentUser: json.user });
              }
            }
          } catch (e) {
            // non-fatal: we refreshed tokens but failed to refresh profile
            console.warn('background refresh: /me failed', e);
          }
          return;
        }

        if (resp.status === 401 || resp.status === 403) {
          // refresh token invalid/expired -> force logout
          try {
            await useDiagramStore.getState().logout();
          } catch (e) {
            console.warn('background refresh: logout failed', e);
            useDiagramStore.setState({ currentUser: null });
          }
          return;
        }

        console.warn('background refresh failed:', resp.status);
      } catch (e) {
        console.warn('background refresh network error', e);
      }
    }

    // Attempt initial refresh now
    doRefresh();

    // Refresh when the page becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') doRefresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Periodic timer
    timer = setInterval(doRefresh, intervalMs);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [opts?.intervalMs]);
}
