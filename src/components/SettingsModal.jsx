import React, { useState, useEffect } from 'react';
import { getAvailableVoices } from '../services/speechService';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearHistory,
  languages,
  onShowToast,
}) {
  const [voices, setVoices] = useState([]);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
    const available = getAvailableVoices();
    setVoices(available);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    if (onShowToast) onShowToast('Settings saved successfully!', 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h3>⚙️ Application Settings</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* General */}
          <div className="settings-group">
            <h4 className="settings-title">🌐 General Preferences</h4>
            <div className="settings-row">
              <label>Default Source Language</label>
              <select
                className="lang-select"
                value={localSettings.defaultSourceLang || 'auto'}
                onChange={(e) => handleChange('defaultSourceLang', e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            <div className="settings-row">
              <label>Default Target Language</label>
              <select
                className="lang-select"
                value={localSettings.defaultTargetLang || 'te'}
                onChange={(e) => handleChange('defaultTargetLang', e.target.value)}
              >
                {languages.filter((l) => l.code !== 'auto').map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation */}
          <div className="settings-group">
            <h4 className="settings-title">⚡ Translation Options</h4>
            <div className="settings-row">
              <label>Auto Detect Language</label>
              <input
                type="checkbox"
                checked={localSettings.autoDetect !== false}
                onChange={(e) => handleChange('autoDetect', e.target.checked)}
              />
            </div>
            <div className="settings-row">
              <label>Max Character Limit</label>
              <span className="badge-info">5,000 Chars</span>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="settings-group">
            <h4 className="settings-title">🔊 Speech & TTS</h4>
            <div className="settings-row">
              <label>Preferred Voice</label>
              <select
                className="lang-select"
                value={localSettings.voiceURI || ''}
                onChange={(e) => handleChange('voiceURI', e.target.value)}
              >
                <option value="">Default (Auto Female Selection)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-row">
              <label>Speech Speed (Rate): {localSettings.rate || 1.0}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localSettings.rate || 1.0}
                onChange={(e) => handleChange('rate', parseFloat(e.target.value))}
              />
            </div>

            <div className="settings-row">
              <label>Speech Pitch: {localSettings.pitch || 1.0}</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={localSettings.pitch || 1.0}
                onChange={(e) => handleChange('pitch', parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* History */}
          <div className="settings-group">
            <h4 className="settings-title">🕘 History & Storage</h4>
            <div className="settings-row">
              <label>Enable Local History</label>
              <input
                type="checkbox"
                checked={localSettings.enableHistory !== false}
                onChange={(e) => handleChange('enableHistory', e.target.checked)}
              />
            </div>
            <div className="settings-row" style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn-danger-outline"
                onClick={() => {
                  onClearHistory();
                  if (onShowToast) onShowToast('All history cleared.', 'info');
                }}
              >
                🗑️ Clear All Translation History
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
