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

  if (!hydrated) return null;
  let effectiveUser = currentUser || cookie;
  if (!effectiveUser && typeof window !== 'undefined') {
    const last = (window as any).__lastKnownUser;
    if (last) {
      // Rehydrate the store from the last known user so subsequent renders
      // see the user immediately and avoid an unnecessary redirect.
      try { useDiagramStore.setState({ currentUser: last } as any); } catch (e) {}
      effectiveUser = last;
    }
  }
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
