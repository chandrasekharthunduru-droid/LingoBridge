import React, { useState, useEffect } from 'react';
import {
  fetchUserGlossary,
  addGlossaryTermApi,
  updateGlossaryTermApi,
  deleteGlossaryTermApi,
} from '../services/translationService';

export default function GlossaryModal({ isOpen, onClose, languages = [], onShowToast }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form states for Add / Edit
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sourceTerm, setSourceTerm] = useState('');
  const [targetTerm, setTargetTerm] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('te');
  const [submitting, setSubmitting] = useState(false);

  const loadGlossary = async () => {
    setLoading(true);
    try {
      const data = await fetchUserGlossary();
      setTerms(data);
    } catch (e) {
      console.error('Failed to load glossary', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadGlossary();
      setIsAdding(false);
      setEditingId(null);
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!sourceTerm.trim() || !targetTerm.trim()) {
      if (onShowToast) onShowToast('Please fill in both terms.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateGlossaryTermApi(editingId, {
          sourceTerm: sourceTerm.trim(),
          targetTerm: targetTerm.trim(),
          sourceLang,
          targetLang,
        });
        if (updated) {
          setTerms((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
          if (onShowToast) onShowToast('Glossary term updated!', 'success');
        }
      } else {
        const added = await addGlossaryTermApi({
          sourceTerm: sourceTerm.trim(),
          targetTerm: targetTerm.trim(),
          sourceLang,
          targetLang,
        });
        if (added) {
          setTerms((prev) => [added, ...prev]);
          if (onShowToast) onShowToast('New glossary term added!', 'success');
        }
      }

      // Reset form
      setSourceTerm('');
      setTargetTerm('');
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      if (onShowToast) onShowToast('Failed to save glossary term.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (term) => {
    setEditingId(term.id);
    setSourceTerm(term.sourceTerm);
    setTargetTerm(term.targetTerm);
    setSourceLang(term.sourceLang || 'en');
    setTargetLang(term.targetLang || 'te');
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    const success = await deleteGlossaryTermApi(id);
    if (success) {
      setTerms((prev) => prev.filter((t) => t.id !== id));
      if (onShowToast) onShowToast('Glossary term deleted.', 'info');
    } else {
      if (onShowToast) onShowToast('Failed to delete term.', 'danger');
    }
  };

  const filteredTerms = terms.filter(
    (t) =>
      t.sourceTerm.toLowerCase().includes(search.toLowerCase()) ||
      t.targetTerm.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📚</span>
            <div>
              <h3 style={{ margin: 0 }}>My Personal Glossary</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Customize domain words, technical jargon, and preferred translations
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Header Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search glossary terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              style={{ flex: 1, minWidth: '200px' }}
            />
            {!isAdding && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditingId(null);
                  setSourceTerm('');
                  setTargetTerm('');
                  setIsAdding(true);
                }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                + Add New Term
              </button>
            )}
          </div>

          {/* Add / Edit Term Form */}
          {isAdding && (
            <form onSubmit={handleSave} className="glossary-form-card">
              <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                {editingId ? '✏️ Edit Glossary Term' : '✨ Add New Custom Term'}
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                    Source Term
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. College"
                    value={sourceTerm}
                    onChange={(e) => setSourceTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-bg)', color: 'inherit' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                    Preferred Translation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. కళాశాల"
                    value={targetTerm}
                    onChange={(e) => setTargetTerm(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-bg)', color: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                    Source Language
                  </label>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-bg)', color: 'inherit' }}
                  >
                    {languages.filter((l) => l.code !== 'auto').map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                    Target Language
                  </label>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-input-bg)', color: 'inherit' }}
                  >
                    {languages.filter((l) => l.code !== 'auto').map((l) => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '0.4rem 1rem' }} disabled={submitting}>
                  {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Term'}
                </button>
              </div>
            </form>
          )}

          {/* Term List Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
              <span className="spinner">⏳</span>
              <p style={{ marginTop: '0.5rem' }}>Loading personal glossary...</p>
            </div>
          ) : filteredTerms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
              <span style={{ fontSize: '2rem' }}>📖</span>
              <p style={{ fontWeight: '600', margin: '0.5rem 0' }}>
                {search ? 'No terms match your search.' : 'No custom glossary terms yet.'}
              </p>
              <span style={{ fontSize: '0.85rem' }}>
                Add custom terminology to guarantee accurate translation across your projects!
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredTerms.map((term) => (
                <div key={term.id} className="glossary-term-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-text)' }}>
                        {term.sourceTerm}
                      </span>
                      <span style={{ color: 'var(--color-primary)' }}>➔</span>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: '#10b981' }}>
                        {term.targetTerm}
                      </span>
                    </div>
                    <span className="lang-badge" style={{ fontSize: '0.7rem' }}>
                      {(term.sourceLang || 'EN').toUpperCase()} → {(term.targetLang || 'TE').toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleEditClick(term)}
                      title="Edit term"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDelete(term.id)}
                      title="Delete term"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      🗑️
                    </button>
                  </div>
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
