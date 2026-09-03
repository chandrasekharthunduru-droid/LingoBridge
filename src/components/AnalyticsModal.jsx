import React, { useState, useEffect } from 'react';
import { fetchUserAnalyticsApi } from '../services/translationService';

export default function AnalyticsModal({ isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchUserAnalyticsApi();
      setAnalytics(data);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetCounts = analytics?.targetCounts || {};
  const sortedTargets = Object.entries(targetCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sortedTargets.length > 0 ? sortedTargets[0][1] : 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '680px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <h3 style={{ margin: 0 }}>Translation Analytics</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Real-time usage statistics & language insights
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
              <span className="spinner" style={{ fontSize: '2rem' }}>⏳</span>
              <p style={{ marginTop: '0.75rem' }}>Loading your translation analytics...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Stat Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div className="analytics-stat-box">
                  <span className="stat-number">{analytics?.totalTranslations || 0}</span>
                  <span className="stat-label">Total Translations</span>
                </div>

                <div className="analytics-stat-box">
                  <span className="stat-number">
                    {(analytics?.totalCharacters || 0).toLocaleString()}
                  </span>
                  <span className="stat-label">Characters</span>
                </div>

                <div className="analytics-stat-box">
                  <span className="stat-number">{analytics?.languagesUsed || 0}</span>
                  <span className="stat-label">Languages Used</span>
                </div>

                <div className="analytics-stat-box">
                  <span className="stat-number">{analytics?.favoritesCount || 0}</span>
                  <span className="stat-label">Favorites</span>
                </div>
              </div>

              {/* Most Used Pair Banner */}
              <div className="analytics-pair-banner">
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Top Translation Route
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                  {analytics?.mostUsedPair || 'English → Telugu'}
                </span>
              </div>

              {/* Target Languages Breakdown Chart */}
              <div>
                <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  Target Languages Activity
                </h4>
                {sortedTargets.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Translate some texts to see your language breakdown charts!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {sortedTargets.map(([lang, count]) => {
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <span style={{ width: '45px', textTransform: 'uppercase', fontWeight: '600', fontSize: '0.85rem' }}>
                            {lang}
                          </span>
                          <div style={{ flex: 1, height: '10px', backgroundColor: 'var(--color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                borderRadius: '6px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', minWidth: '35px', textAlign: 'right' }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" className="btn-secondary" onClick={loadData} disabled={loading}>
            🔄 Refresh
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
