import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { 
  Stethoscope, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';

export default function Login({ onSwitchToSignup }) {
  const { signIn, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Stethoscope size={28} className="auth-brand-icon" />
          </div>
          <h1 className="auth-title">Welcome to Kelli AI</h1>
          <p className="auth-subtitle">
            Sign in to access your AI healthcare receptionist, manage appointments, and view your patient records.
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="error-icon" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={17} className="input-icon" />
              <input
                id="login-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="login-password">Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="btn-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Switch to Signup */}
        <div className="auth-footer">
          <p>
            Don't have a patient account yet?{' '}
            <button
              type="button"
              className="btn-link-auth"
              onClick={onSwitchToSignup}
              disabled={loading}
            >
              Sign up now
            </button>
          </p>
        </div>

        {/* Security & Healthcare Notice */}
        <div className="auth-security-badge">
          <ShieldCheck size={14} className="text-primary" />
          <span>Secure Patient Portal • Supabase Authenticated</span>
        </div>
      </div>
    </div>
  );
}
