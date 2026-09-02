import { useAuth } from '../context/useAuth';
import { Stethoscope, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, fallback }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="brand-avatar-loading">
            <Stethoscope size={28} className="pulse-icon" />
          </div>
          <h3>Connecting to Kelli Healthcare</h3>
          <p className="text-muted">Verifying secure clinic session...</p>
          <Loader2 size={24} className="btn-spinner text-primary mt-3" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  return children;
}
