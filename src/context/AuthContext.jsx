import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

async function safeFetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error('Unable to connect to authentication server. Please check your network connection.');
  }

  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Server returned an invalid JSON response.');
    }

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
    }

    return { response, data };
  }

  const text = await response.text();
  let cleanText = '';
  if (text && !text.trim().startsWith('<')) {
    cleanText = text.trim();
  } else if (response.status === 404) {
    cleanText = 'Authentication endpoint was not found (HTTP 404).';
  } else if (response.status === 500) {
    cleanText = 'The authentication server encountered an error (HTTP 500). Please try again.';
  }

  throw new Error(cleanText || `Server returned an invalid response (${response.status})`);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if token exists
  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { response, data } = await safeFetchJson('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok && data?.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, [token]);

  const login = async (email, password) => {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    const { data } = await safeFetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  const register = async (name, email, password) => {
    const cleanName = typeof name === 'string' ? name.trim() : name;
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : email;
    const { data } = await safeFetchJson('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      setUser(data.user);
    }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
