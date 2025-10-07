import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';
import { getCurrentUserFromCookie } from '../utils/userCookie';

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const currentUser = useDiagramStore(state => state.currentUser);
  // Read cookie synchronously so we can use it as a fallback for route
  // decision-making on the first render. This avoids transient nulls when
  // navigating between routes (store hydration can be async). We still run
  // the effect below to populate the store from the cookie if needed.
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

  // If we haven't finished hydration yet, don't render/redirect
  if (!hydrated) return null;

  // Use cookie as immediate fallback if the store hasn't yet been hydrated
  const effectiveUser = currentUser || cookie;
  if (!effectiveUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
