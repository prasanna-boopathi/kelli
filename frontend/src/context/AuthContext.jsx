import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getPatientProfile, updatePatientProfile as apiUpdatePatientProfile } from '../lib/api';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Fetch patient profile from backend /api/me
  const fetchProfile = useCallback(async (accessToken) => {
    if (!accessToken) {
      setPatient(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const data = await getPatientProfile(accessToken);
      if (data && data.patient) {
        setPatient(data.patient);
        return data.patient;
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load patient profile from /api/me:', err);
      // If 401 Unauthorized, token is expired or invalid
      if (err.status === 401) {
        console.warn('[AuthContext] Access token expired or invalid. Signing out...');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setPatient(null);
      }
    } finally {
      setProfileLoading(false);
    }
    return null;
  }, []);

  // Initialize session and auth state listener
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.access_token) {
            fetchProfile(initialSession.access_token);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Unexpected auth init error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      console.log(`[AuthContext] Auth event: ${event}`);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (currentSession?.access_token) {
          fetchProfile(currentSession.access_token);
        }
      } else if (event === 'SIGNED_OUT') {
        setPatient(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with email & password
  const signIn = async (email, password) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data?.session?.access_token) {
        await fetchProfile(data.session.access_token);
      }

      return data;
    } catch (err) {
      console.error('[AuthContext] Sign in error:', err);
      const friendlyMsg = getFriendlyAuthError(err);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  // Sign up with email & password and optional name/phone
  const signUp = async (email, password, fullName = '', phone = '') => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.session?.access_token) {
        // If immediate session is granted (e.g. email confirmation disabled or auto-confirm)
        await fetchProfile(data.session.access_token);
      }

      return data;
    } catch (err) {
      console.error('[AuthContext] Sign up error:', err);
      const friendlyMsg = getFriendlyAuthError(err);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  };

  // Sign out
  const signOut = async () => {
    setAuthError(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setPatient(null);
    }
  };

  // Update profile via PATCH /api/me
  const updateProfile = async ({ name, phone }) => {
    if (!session?.access_token) {
      throw new Error('You must be logged in to update your profile.');
    }

    const res = await apiUpdatePatientProfile({ name, phone }, session.access_token);
    if (res && res.patient) {
      setPatient(res.patient);
    }
    return res;
  };

  const value = {
    session,
    user,
    patient,
    loading,
    profileLoading,
    authError,
    isAuthenticated: !!session?.user,
    token: session?.access_token ?? null,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile: () => fetchProfile(session?.access_token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function getFriendlyAuthError(error) {
  if (!error) return 'An unexpected authentication error occurred.';
  const msg = (error.message || '').toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please check your details and try again.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'An account with this email address already exists. Please log in instead.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password should be at least 6 characters long.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please check your inbox to confirm your email before logging in.';
  }
  if (msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }
  return error.message || 'Authentication failed. Please try again.';
}
