import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfileApi } from '../services/translationService';

export default function ProfileModal({ isOpen, onClose, totalTranslations = 0, favoritesCount = 0, onShowToast }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateUserProfileApi(name.trim());
      if (user) user.name = name.trim();
      setIsEditing(false);
      if (onShowToast) onShowToast('Profile name updated!', 'success');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to update profile.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const userInitial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>👤</span>
            <div>
              <h3 style={{ margin: 0 }}>User Profile</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Account settings & platform usage overview
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          {/* Avatar & Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              className="avatar-circle"
              style={{ width: '60px', height: '60px', fontSize: '1.6rem', fontWeight: 'bold' }}
            >
              {userInitial}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{user?.name || 'Demo User'}</h3>
              <p style={{ margin: '0.2rem 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {user?.email || 'demo@example.com'}
              </p>
            </div>
          </div>

          {/* User Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                Display Name
              </label>
              {isEditing ? (
                <form onSubmit={handleSave} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-bg)', color: 'inherit' }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.85rem' }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="btn-secondary-sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-input-bg)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <span>{user?.name || 'Demo User'}</span>
                  <button type="button" className="btn-secondary-sm" onClick={() => { setName(user?.name || ''); setIsEditing(true); }}>
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--color-input-bg)', borderRadius: '6px', border: '1px solid var(--color-border)', opacity: 0.85 }}>
                {user?.email || 'demo@example.com'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                🔒 Email is verified and locked to protect your account.
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="analytics-stat-box" style={{ padding: '1rem' }}>
                <span className="stat-number" style={{ fontSize: '1.5rem' }}>{totalTranslations}</span>
                <span className="stat-label">Translations</span>
              </div>
              <div className="analytics-stat-box" style={{ padding: '1rem' }}>
                <span className="stat-number" style={{ fontSize: '1.5rem' }}>{favoritesCount}</span>
                <span className="stat-label">Saved Favorites</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
