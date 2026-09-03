import React, { useState } from 'react';

export default function Favorites({ favorites = [], onSelect, onRemoveFavorite, isOpen, onClose, onShowToast }) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredFavorites = favorites.filter(
    (item) =>
      item.original.toLowerCase().includes(search.toLowerCase()) ||
      item.translated.toLowerCase().includes(search.toLowerCase()) ||
      item.sourceLang.toLowerCase().includes(search.toLowerCase()) ||
      item.targetLang.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    if (onShowToast) onShowToast('Favorite copied to clipboard!', 'success');
  };

  const handleReTranslate = (e, item) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(item);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⭐</span>
            <div>
              <h3 style={{ margin: 0 }}>Favorite Translations ({favorites.length})</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Your saved vocabulary, phrases, and frequently used translations
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Search Bar */}
        {favorites.length > 0 && (
          <div style={{ padding: '0.75rem 1.25rem 0.25rem 1.25rem' }}>
            <input
              type="text"
              placeholder="🔍 Search favorites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {favorites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
              <p style={{ fontWeight: '600', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>
                No favorite translations yet
              </p>
              <span style={{ fontSize: '0.875rem' }}>
                Star any translation from the output panel or recent history to easily revisit it here!
              </span>
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
              <p style={{ fontWeight: '600' }}>No favorites match your search.</p>
            </div>
          ) : (
            <div className="history-list">
              {filteredFavorites.map((item) => (
                <div
                  key={item.id}
                  className="history-item-card"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <div className="history-item-header">
                    <span className="lang-badge">
                      {item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="icon-btn-sm"
                        onClick={(e) => handleCopy(e, item.translated)}
                        title="Copy translated text"
                        aria-label="Copy"
                      >
                        📋
                      </button>
                      <button
                        type="button"
                        className="icon-btn-sm"
                        onClick={(e) => handleReTranslate(e, item)}
                        title="Load into translator"
                        aria-label="Load into translator"
                      >
                        🔄
                      </button>
                      <button
                        type="button"
                        className="star-btn favorited"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFavorite(item.id);
                        }}
                        title="Remove from favorites"
                        aria-label="Remove from favorites"
                      >
                        ⭐
                      </button>
                    </div>
                  </div>

                  <div className="history-original">{item.original}</div>
                  <div className="history-translated">{item.translated}</div>
                </div>
              ))}
            </div>
          )}
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
