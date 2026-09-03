import React, { useState } from 'react';

export default function QRShareModal({ isOpen, onClose, text, sourceLang, targetLang, onShowToast }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedData = encodeURIComponent(text || '');
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedData}&margin=10`;

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onShowToast) onShowToast('Translation copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LingoBridge-Translation-QR.png';
      a.click();
      URL.revokeObjectURL(url);
      if (onShowToast) onShowToast('QR Code downloaded successfully!', 'info');
    } catch (e) {
      // Fallback direct open
      window.open(qrImageUrl, '_blank');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📱</span>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: 0 }}>QR Code Share</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Scan with any phone camera to read this translation
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              marginBottom: '1rem',
            }}
          >
            <img
              src={qrImageUrl}
              alt="Translation QR Code"
              width={220}
              height={220}
              style={{ display: 'block', borderRadius: '4px' }}
            />
          </div>

          <div className="lang-badge" style={{ marginBottom: '0.75rem' }}>
            {(sourceLang || 'AUTO').toUpperCase()} → {(targetLang || 'EN').toUpperCase()}
          </div>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text)',
              maxHeight: '80px',
              overflowY: 'auto',
              backgroundColor: 'var(--color-input-bg)',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              width: '100%',
              boxSizing: 'border-box',
              margin: '0 0 1rem 0',
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {text}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopy}
              style={{ flex: 1, padding: '0.6rem' }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Text'}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownloadQR}
              style={{ flex: 1, padding: '0.6rem' }}
            >
              ⬇️ Save QR
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
