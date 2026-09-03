import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import LingoBridgeLogo from './LingoBridgeLogo';

function Header({
  onOpenSettings,
  onOpenFavorites,
  onOpenHistoryModal,
  onOpenProfile,
  onOpenAnalytics,
  onOpenGlossary,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'D';
  const userName = user?.name || 'Demo User';
  const userEmail = user?.email || 'demo@example.com';

  return (
    <header className="saas-header">
      <div className="brand-section">
        <LingoBridgeLogo size={44} showText={true} showTagline={true} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <ThemeToggle />

        <div className="profile-dropdown-container" ref={dropdownRef}>
          <button
            type="button"
            className="user-avatar-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-label="User profile menu"
          >
            <div className="avatar-circle">{userInitial}</div>
            <span>{userName}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>▼</span>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-user-info">
                <div className="dropdown-user-name">{userName}</div>
                <div className="dropdown-user-email">{userEmail}</div>
              </div>

              <div className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenProfile) onOpenProfile();
                }}
              >
                👤 Profile
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenAnalytics) onOpenAnalytics();
                }}
              >
                📊 Analytics
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenGlossary) onOpenGlossary();
                }}
              >
                📚 My Glossary
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenHistoryModal) onOpenHistoryModal();
                }}
              >
                🕘 Translation History
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenFavorites) onOpenFavorites();
                }}
              >
                ⭐ Favorites
              </button>

              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
              >
                ⚙️ Settings
              </button>

              <div className="dropdown-divider" />

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                className="dropdown-item logout"
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
