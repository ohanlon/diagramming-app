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
  const effectiveUser = currentUser || cookie;
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
          console.warn('[dev-watch] AdminRoute redirect persisted', { effectiveUser });
        } catch (e) {}
      }
    } catch (e) {}
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export default AdminRoute;
