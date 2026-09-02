import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { 
  Stethoscope, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Signup({ onSwitchToLogin }) {
  const { signUp, authError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please enter a valid email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const data = await signUp(email, password, fullName, phone);
      // If email confirmation is required by Supabase project settings
      if (data?.user && !data.session) {
        setSignupSuccess(true);
      }
    } catch (err) {
      setLocalError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  if (signupSuccess) {
    return (
      <div className="auth-page-container">
        <div className="auth-card text-center">
          <div className="auth-success-icon-wrap">
            <CheckCircle2 size={44} className="text-success" />
          </div>
          <h2 className="auth-title mt-2">Registration Successful</h2>
          <p className="auth-subtitle mt-2">
            We've sent a confirmation link to <strong>{email}</strong>. Please check your email to verify your account, then sign in to start chatting with Kelli.
          </p>
          <button
            type="button"
            className="btn-auth-submit mt-4"
            onClick={onSwitchToLogin}
          >
            <span>Proceed to Login</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Stethoscope size={28} className="auth-brand-icon" />
          </div>
          <h1 className="auth-title">Create Patient Account</h1>
          <p className="auth-subtitle">
            Join Kelli AI Healthcare to book appointments seamlessly and manage your consultations.
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div className="auth-error-alert" role="alert">
            <AlertCircle size={18} className="error-icon" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-name">Full Name</label>
            <div className="input-with-icon">
              <User size={17} className="input-icon" />
              <input
                id="signup-name"
                type="text"
                placeholder="Dr. / Mr. / Ms. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-phone">Phone Number (Optional)</label>
            <div className="input-with-icon">
              <Phone size={17} className="input-icon" />
              <input
                id="signup-phone"
                type="tel"
                placeholder="e.g. +1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email Address <span className="text-danger">*</span></label>
            <div className="input-with-icon">
              <Mail size={17} className="input-icon" />
              <input
                id="signup-email"
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
            <label htmlFor="signup-password">Password <span className="text-danger">*</span></label>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="signup-confirm-password">Confirm Password <span className="text-danger">*</span></label>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                id="signup-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Patient Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="btn-link-auth"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Log in here
            </button>
          </p>
        </div>

        {/* Security Notice */}
        <div className="auth-security-badge">
          <ShieldCheck size={14} className="text-primary" />
          <span>Patient Privacy Protected • Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
}
