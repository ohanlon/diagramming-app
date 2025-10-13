import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';
import { getCurrentUserFromCookie } from '../utils/userCookie';

interface Props {
  children: React.ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const currentUser = useDiagramStore(state => state.currentUser);
  const cookie = getCurrentUserFromCookie();
  const [hydrated, setHydrated] = useState<boolean>(() => !!currentUser || !!cookie);
  const [validating, setValidating] = useState<boolean>(false);

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
  // Ensure hooks order is stable: declare validation effect even if hydrated is false
  // Compute effectiveUser candidate deterministically
  const effectiveUserCandidate = currentUser || cookie;
  useEffect(() => {
    let mounted = true;
    if (!effectiveUserCandidate && typeof window !== 'undefined') {
      const last = (window as any).__lastKnownUser;
      if (last && !validating) {
        (async () => {
          setValidating(true);
          try {
            const serverUrl = useDiagramStore.getState().serverUrl || 'http://localhost:4000';
            const meResp = await fetch(`${serverUrl}/auth/me`, { method: 'GET', credentials: 'include' });
            if (meResp.ok) {
              const json = await meResp.json().catch(() => null);
              if (mounted && json && json.user) {
                try { useDiagramStore.setState({ currentUser: json.user } as any); } catch (e) {}
              }
            } else if (meResp.status === 401) {
              try {
                const r = await fetch(`${serverUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
                if (r.ok) {
                  const me2 = await fetch(`${serverUrl}/auth/me`, { method: 'GET', credentials: 'include' });
                  if (me2.ok) {
                    const json2 = await me2.json().catch(() => null);
                    if (mounted && json2 && json2.user) {
                      try { useDiagramStore.setState({ currentUser: json2.user } as any); } catch (e) {}
                    }
                  }
                }
              } catch (e) {}
            }
          } catch (e) {}
          finally { if (mounted) setValidating(false); }
        })();
      }
    }
    return () => { mounted = false; };
  }, [currentUser, cookie, validating]);

  if (!hydrated) return null;
  if (validating) return null;
  const effectiveUser = effectiveUserCandidate;
  if (!effectiveUser) return <Navigate to="/login" replace />;
  if (!effectiveUser.roles?.includes('admin')) {
    try {
      const urlFlag = typeof window !== 'undefined' && new URL(window.location.href).searchParams.get('dev_watch') === '1';
      const lsFlag = typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('dev_watch_currentUser') === '1';
      const enabled = urlFlag || lsFlag || process.env.NODE_ENV !== 'production';
      if (enabled && typeof window !== 'undefined') {
        try {
          const key = 'dev_user_events';
          const raw = window.localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          arr.push({ type: 'admin_redirect', time: new Date().toISOString(), url: window.location.href, effectiveUser });
          window.localStorage.setItem(key, JSON.stringify(arr.slice(-200)));
          // eslint-disable-next-line no-console
          // console.warn('[dev-watch] AdminRoute redirect persisted', { effectiveUser });
        } catch (e) {}
      }
    } catch (e) {}
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default AdminRoute;
