import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';
import { getCurrentUserFromCookie } from '../utils/userCookie';

const SalesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const roles = effectiveUser?.roles || [];
  const allowed = roles.includes('sales') || roles.includes('admin');
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default SalesRoute;
