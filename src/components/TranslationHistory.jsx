import React, { useState } from 'react';

function TranslationHistory({
  items = [],
  onSelect,
  onClear,
  onDeleteItem,
  onToggleFavorite,
  favorites = [],
  onShowToast,
}) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, favorites, today, week, month

  if (!items || items.length === 0) return null;

  const favoriteIds = new Set(favorites.map((f) => f.id));

  // Date filtering logic
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredItems = items.filter((item) => {
    // Search query
    const s = search.toLowerCase();
    const matchesSearch =
      !s ||
      item.original.toLowerCase().includes(s) ||
      item.translated.toLowerCase().includes(s) ||
      item.sourceLang.toLowerCase().includes(s) ||
      item.targetLang.toLowerCase().includes(s);

    if (!matchesSearch) return false;

    // Filter pill
    const itemTime = new Date(item.timestamp || 0).getTime();
    if (activeFilter === 'favorites') {
      return favoriteIds.has(item.id);
    }
    if (activeFilter === 'today') {
      return itemTime >= startOfToday;
    }
    if (activeFilter === 'week') {
      return itemTime >= startOfWeek;
    }
    if (activeFilter === 'month') {
      return itemTime >= startOfMonth;
    }
    return true;
  });

  const displayedItems = filteredItems.slice(0, 6);
  const hasMore = items.length > 6;

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    if (onShowToast) onShowToast('Copied to clipboard!', 'success');
  };

  const handleReTranslate = (e, item) => {
    e.stopPropagation();
    if (onSelect) onSelect(item);
  };

  const renderItemCard = (item) => {
    const isFav = favoriteIds.has(item.id);
    const dateFormatted = item.timestamp
      ? new Date(item.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <div
        key={item.id || item.timestamp}
        className="history-item-card"
        onClick={() => onSelect(item)}
      >
        <div className="history-item-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="lang-badge">
              {item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()}
            </span>
            {dateFormatted && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {dateFormatted}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="icon-btn-sm"
              onClick={(e) => handleCopy(e, item.translated)}
              title="Copy translation"
              aria-label="Copy"
            >
              📋
            </button>
            <button
              type="button"
              className="icon-btn-sm"
              onClick={(e) => handleReTranslate(e, item)}
              title="Re-translate / Load this text"
              aria-label="Re-translate"
            >
              🔄
            </button>
            {onToggleFavorite && (
              <button
                type="button"
                className={`star-btn ${isFav ? 'favorited' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item);
                }}
                title={isFav ? 'Remove favorite' : 'Add to favorites'}
                aria-label="Favorite"
              >
                {isFav ? '⭐' : '☆'}
              </button>
            )}
            {onDeleteItem && (
              <button
                type="button"
                className="delete-item-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                title="Delete from history"
                aria-label="Delete"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="history-original">{item.original}</div>
        <div className="history-translated">{item.translated}</div>
      </div>
    );
  };

  return (
    <section className="history-section">
      <div className="history-header-bar">
        <h3>───── Recent Translations ─────</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasMore && (
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={() => setShowAllModal(true)}
            >
              View All ({items.length})
            </button>
          )}
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => setShowConfirmClear(true)}
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Filter and Search Bar for Recent view */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Search history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ flex: 1, minWidth: '180px', maxWidth: '320px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
        />

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'favorites', label: '⭐ Favorites' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`filter-pill ${activeFilter === tab.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="history-grid">
        {displayedItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No translations match your filters.
          </div>
        ) : (
          displayedItems.map(renderItemCard)
        )}
      </div>

      {/* Confirmation Dialog for Clear History */}
      {showConfirmClear && (
        <div className="modal-backdrop" onClick={() => setShowConfirmClear(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', textAlign: 'center' }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Clear Translation History?</h3>
              <button className="close-btn" onClick={() => setShowConfirmClear(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🗑️</span>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                Are you sure you want to clear your entire translation history?
              </p>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                This action is permanent and cannot be undone.
              </span>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmClear(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setShowConfirmClear(false);
                  onClear();
                }}
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All History Modal */}
      {showAllModal && (
        <div className="modal-backdrop" onClick={() => setShowAllModal(false)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            <div className="modal-header">
              <h3>🕘 Full Translation History ({items.length})</h3>
              <button className="close-btn" onClick={() => setShowAllModal(false)}>×</button>
            </div>

            {/* Modal Search & Filters */}
            <div style={{ padding: '1rem 1.25rem 0.5rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search all translations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                  style={{ flex: 1, minWidth: '180px' }}
                />
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'favorites', label: '⭐ Favorites' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`filter-pill ${activeFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                  <p style={{ fontWeight: '600' }}>No matching translations found.</p>
                </div>
              ) : (
                <div className="history-list">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelect(item);
                        setShowAllModal(false);
                      }}
                    >
                      {renderItemCard(item)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn-danger-sm"
                onClick={() => {
                  setShowAllModal(false);
                  setShowConfirmClear(true);
                }}
              >
                Clear History
              </button>
              <button className="btn-secondary" onClick={() => setShowAllModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TranslationHistory;
