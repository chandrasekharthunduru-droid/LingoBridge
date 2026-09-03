import React, { useState, useEffect } from 'react';
import { isFemaleVoice, findBestFemaleVoice, speakText } from '../utils/speechUtils';

function VoiceSettingsModal({ isOpen, onClose, targetLang, voiceSettings, onUpdateSettings, testText }) {
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Auto pre-select female voice if none is selected yet
        if (!voiceSettings.voiceURI && voices.length > 0) {
          const bestFemale = findBestFemaleVoice(voices, targetLang);
          if (bestFemale) {
            onUpdateSettings({ ...voiceSettings, voiceURI: bestFemale.voiceURI, pitch: voiceSettings.pitch || 1.1 });
          }
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [targetLang]);

  if (!isOpen) return null;

  // Filter voices by target language if applicable
  const filteredVoices = availableVoices.filter((v) =>
    targetLang && targetLang !== 'auto'
      ? v.lang.toLowerCase().startsWith(targetLang.toLowerCase())
      : true
  );

  const displayVoices = filteredVoices.length > 0 ? filteredVoices : availableVoices;

  // Sort female voices to top
  const sortedVoices = [...displayVoices].sort((a, b) => {
    const aFemale = isFemaleVoice(a);
    const bFemale = isFemaleVoice(b);
    if (aFemale && !bFemale) return -1;
    if (!aFemale && bFemale) return 1;
    return 0;
  });

  const handleTestSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const textToSpeak = testText || 'Hello! This is a clear female voice preview for LingoBridge.';
    setIsPlaying(true);
    speakText(
      textToSpeak,
      targetLang,
      voiceSettings,
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>👩⚙️ Female Voice & Speech Settings</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="slider-group">
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600' }}>Select Voice (Female Prioritized)</label>
          <select
            className="lang-select"
            style={{ width: '100%' }}
            value={voiceSettings.voiceURI || ''}
            onChange={(e) => onUpdateSettings({ ...voiceSettings, voiceURI: e.target.value })}
          >
            <option value="">✨ Auto Female Voice (Recommended)</option>
            {sortedVoices.map((v) => {
              const femaleLabel = isFemaleVoice(v) ? '👩 [Female]' : '🗣️';
              return (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {femaleLabel} {v.name} ({v.lang})
                </option>
              );
            })}
          </select>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.35rem', fontWeight: '500' }}>
            👩 Female voices are automatically detected and prioritized for text-to-speech.
          </div>
        </div>

        <div className="slider-group">
          <label>
            <span>Speed (Rate)</span>
            <span>{voiceSettings.rate.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            className="slider-input"
            value={voiceSettings.rate}
            onChange={(e) => onUpdateSettings({ ...voiceSettings, rate: parseFloat(e.target.value) })}
          />
        </div>

        <div className="slider-group">
          <label>
            <span>Pitch</span>
            <span>{voiceSettings.pitch.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            className="slider-input"
            value={voiceSettings.pitch}
            onChange={(e) => onUpdateSettings({ ...voiceSettings, pitch: parseFloat(e.target.value) })}
          />
        </div>

        <div className="slider-group">
          <label>
            <span>Volume</span>
            <span>{Math.round(voiceSettings.volume * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            className="slider-input"
            value={voiceSettings.volume}
            onChange={(e) => onUpdateSettings({ ...voiceSettings, volume: parseFloat(e.target.value) })}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="icon-btn"
            style={{ flex: 1, justifyContent: 'center', padding: '0.65rem' }}
            onClick={handleTestSpeech}
          >
            {isPlaying ? '⏹️ Stop Preview' : '🔊 Test Voice'}
          </button>
          <button
            type="button"
            className="main-translate-btn"
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceSettingsModal;
