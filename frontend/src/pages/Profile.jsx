import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  ShieldCheck, 
  RotateCw
} from 'lucide-react';

export default function Profile() {
  const { user, patient, profileLoading, updateProfile, refreshProfile } = useAuth();
  
  const initialName = patient?.name || user?.user_metadata?.full_name || '';
  const initialPhone = patient?.phone || user?.user_metadata?.phone || '';

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim()
      });
      setSuccessMsg('Patient profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const refreshed = await refreshProfile();
      if (refreshed) {
        setName(refreshed.name || '');
        setPhone(refreshed.phone || '');
      }
    } catch {
      // Ignored, handled in AuthContext
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        {/* Profile Card Header */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            <User size={36} />
          </div>
          <div className="profile-header-text">
            <h1 className="profile-title">Patient Profile</h1>
            <p className="profile-subtitle">
              Manage your personal and contact information for clinic appointments.
            </p>
          </div>
          <button
            type="button"
            className="btn-refresh-profile"
            onClick={handleRefresh}
            disabled={profileLoading}
            title="Refresh profile from server"
          >
            <RotateCw size={15} className={profileLoading ? 'btn-spinner' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="alert-banner alert-success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert-banner alert-error" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-form-grid">
            {/* Full Name (Editable) */}
            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <div className="input-with-icon">
                <User size={17} className="input-icon" />
                <input
                  id="profile-name"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving || profileLoading}
                />
              </div>
              <span className="form-help-text">Used by doctors and receptionist Kelli during booking</span>
            </div>

            {/* Phone (Editable) */}
            <div className="form-group">
              <label htmlFor="profile-phone">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={17} className="input-icon" />
                <input
                  id="profile-phone"
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving || profileLoading}
                />
              </div>
              <span className="form-help-text">For appointment reminders and clinic updates</span>
            </div>

            {/* Email (Read-Only) */}
            <div className="form-group">
              <label htmlFor="profile-email">
                Email Address <span className="read-only-tag">(Read-only)</span>
              </label>
              <div className="input-with-icon disabled">
                <Mail size={17} className="input-icon" />
                <input
                  id="profile-email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  readOnly
                />
                <Lock size={15} className="lock-icon" />
              </div>
              <span className="form-help-text">Managed via your Supabase authenticated account</span>
            </div>

            {/* User ID (Read-Only) */}
            <div className="form-group">
              <label htmlFor="profile-userid">
                User ID <span className="read-only-tag">(Read-only)</span>
              </label>
              <div className="input-with-icon disabled">
                <Lock size={17} className="input-icon" />
                <input
                  id="profile-userid"
                  type="text"
                  value={user?.id || ''}
                  disabled
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <span className="form-help-text">Unique immutable identifier in the clinic system</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="profile-actions-row">
            <div className="security-note">
              <ShieldCheck size={16} className="text-primary" />
              <span>Verified patient record synchronized with /api/me</span>
            </div>

            <button
              type="submit"
              className="btn-save-profile"
              disabled={saving || profileLoading}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="btn-spinner" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
