import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDiagramStore } from '../store/useDiagramStore';
import { getCurrentUserFromCookie } from '../utils/userCookie';

interface Props {
  children: React.ReactNode;
}

const AdminRoute: React.FC<Props> = ({ children }) => {
  const currentUser = useDiagramStore(state => state.currentUser);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setInitialized(true);
      return;
    }
    // Attempt to hydrate from cookie synchronously on mount
    const cookie = getCurrentUserFromCookie();
    if (cookie) {
      useDiagramStore.setState({ currentUser: cookie } as any);
    }
    setInitialized(true);
  }, [currentUser]);

  if (!initialized) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!currentUser.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default AdminRoute;
