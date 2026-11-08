import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

export function RoleRoute({ roles, children }) {
  const { user, profile, loading } = useAuth();

  // 1. Wait for auth AND profile to load
  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading session...</div>;
  }

  // 2. Not signed in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Signed in but profile hasn't loaded yet
  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  // 4. Check role
  return roles.includes(profile.role) ? children : <Navigate to="/" replace />;
}