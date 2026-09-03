import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function GoogleSignInButton({ text = 'continue_with', onError }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Client ID from Vite environment variables
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(
    googleClientId &&
    googleClientId !== 'your_google_client_id_here' &&
    !googleClientId.startsWith('your_')
  );

  // Dynamically load official Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.warn('Could not load Google Identity Services SDK');
    };
    document.body.appendChild(script);
  }, []);

  // Initialize and render official Google button
  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !isConfigured) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Detect dark theme
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: isDark ? 'filled_black' : 'outline',
        size: 'large',
        text: text === 'signup_with' ? 'signup_with' : 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(380, buttonRef.current.parentElement?.clientWidth || 380),
      });
    } catch (err) {
      console.warn('Error initializing Google Sign-In button:', err);
    }
  }, [scriptLoaded, isConfigured, googleClientId, text]);

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      if (onError) onError('Google Sign-In was cancelled or failed.');
      return;
    }

    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/translator');
    } catch (err) {
      console.error('Google login error:', err);
      if (onError) {
        onError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnconfiguredClick = () => {
    const msg =
      'Google Sign-In is ready! To connect your Google Project, add your VITE_GOOGLE_CLIENT_ID in your environment variables.';
    alert(msg);
    if (onError) onError(msg);
  };

  if (!isConfigured) {
    return (
      <div style={{ width: '100%', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={handleUnconfiguredClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.7rem 1rem',
            backgroundColor: 'var(--color-surface, #ffffff)',
            color: 'var(--color-text, #1f2937)',
            border: '1px solid var(--color-border, #d1d5db)',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
          title="Google Client ID configuration required"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', marginBottom: '1.25rem' }}>
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '0.75rem',
            fontSize: '0.9rem',
            color: 'var(--color-primary)',
          }}
        >
          Authenticating with Google...
        </div>
      ) : (
        <div
          ref={buttonRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            minHeight: '44px',
          }}
        />
      )}
    </div>
  );
}

export default GoogleSignInButton;
