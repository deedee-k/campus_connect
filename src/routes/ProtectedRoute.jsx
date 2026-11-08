import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}