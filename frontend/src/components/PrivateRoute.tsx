import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { storage } from '../lib/storage';

interface PrivateRouteProps {
  children: ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const token = storage.getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
