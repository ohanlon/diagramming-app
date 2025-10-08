import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';
import { getCurrentUserFromCookie } from '../utils/userCookie';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  console.log('ProtectedRoute render start');
 const currentUser = useDiagramStore(state => state.currentUser);
  const cookie = getCurrentUserFromCookie();
  const [hydrated, setHydrated] = useState<boolean>(() => !!currentUser || !!cookie);
  const [validating, setValidating] = useState<boolean>(false);

  // Compute effectiveUser candidate deterministically before any hooks so
  // hooks registration order is stable across renders.
  let effectiveUser = currentUser || cookie;

  useEffect(() => {
    if (currentUser) {
      setHydrated(true);
      return;
    }
    if (cookie) {
      useDiagramStore.setState({ currentUser: cookie } as any);
      return;
    }
    setHydrated(true);
  }, []);
  // If we have no effective user but have a last-known user, attempt a
  // short, silent validation against the server to confirm the session is
  // still valid before rehydrating the store and avoiding a redirect.
  useEffect(() => {
    let mounted = true;
    if (!effectiveUser && typeof window !== 'undefined') {
      const last = (window as any).__lastKnownUser;
      if (last && !validating) {
        (async () => {
          setValidating(true);
          try {
            const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';
            // First attempt to fetch /auth/me; if it fails with 401 try a
            // silent refresh and re-fetch. We purposely avoid calling
            // apiFetch here because that may trigger redirect behavior.
            const meResp = await fetch(`${serverUrl}/auth/me`, { method: 'GET', credentials: 'include' });
            if (meResp.ok) {
              const json = await meResp.json().catch(() => null);
              if (mounted && json && json.user) {
                try { useDiagramStore.setState({ currentUser: json.user } as any); } catch (e) {}
                try { /* update cookie for future loads */ } catch (e) {}
              }
            } else if (meResp.status === 401) {
              // Try refresh once silently
              try {
                const r = await fetch(`${serverUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
                if (r.ok) {
                  const me2 = await fetch(`${serverUrl}/auth/me`, { method: 'GET', credentials: 'include' });
                  if (me2.ok) {
                    const json2 = await me2.json().catch(() => null);
                    if (mounted && json2 && json2.user) {
                      try { useDiagramStore.setState({ currentUser: json2.user } as any); } catch (e) {}
                      try { /* update cookie for future loads */ } catch (e) {}
                    }
                  }
                }
              } catch (e) {
                // network/refresh error — treat as unauthenticated
              }
            }
          } catch (e) {
            // ignore validation errors — we'll redirect below if still unauthenticated
          } finally {
            if (mounted) setValidating(false);
          }
        })();
      }
    }
    return () => { mounted = false; };
  }, [currentUser, cookie, validating]);

  // If we're actively validating, render nothing so we don't redirect
  // prematurely while the silent validation completes.
  if (validating) return null;
  if (!hydrated) return null;
  if (!effectiveUser) {
    try {
      // Dev-only persistent event so we can inspect after navigation
      const urlFlag = typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('dev_watch') === '1';
      const lsFlag = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('dev_watch_currentUser') === '1';
      const enabled = urlFlag || lsFlag || process.env.NODE_ENV !== 'production';
      if (enabled && typeof window !== 'undefined') {
        try {
          const key = 'dev_user_events';
          const raw = window.localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          arr.push({ type: 'protected_redirect', time: new Date().toISOString(), url: window.location.href, currentUser: currentUser || null, cookie: getCurrentUserFromCookie(), stack: (new Error('ProtectedRoute redirect')).stack });
          window.localStorage.setItem(key, JSON.stringify(arr.slice(-200)));
          // eslint-disable-next-line no-console
          console.warn('[dev-watch] ProtectedRoute redirect persisted', { currentUser: currentUser || null });
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {}
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
