import React, { useState, useEffect } from 'react';
import LanguageSelector from './LanguageSelector';
import QuickLanguageChips from './QuickLanguageChips';
import { speakText } from '../utils/speechUtils';
import { submitFeedbackApi } from '../services/translationService';

function TranslationOutput({
  text,
  sourceText,
  sourceLang,
  loading,
  error,
  status = 'Ready',
  targetLang,
  onSelectLang,
  languages,
  detectedLangName,
  detectedConfidence = '98%',
  voiceSettings,
  onOpenVoiceSettings,
  onClear,
  onShowToast,
  isFavorite = false,
  onToggleFavorite,
  onReTranslate,
  onSaveEdit,
  onOpenQRShare,
}) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Translation Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackNegative, setFeedbackNegative] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');

  // Sync edit text whenever external translation changes
  useEffect(() => {
    setEditText(text || '');
    setIsEditing(false);
    setHistoryStack(text ? [text] : []);
    setHistoryIndex(text ? 0 : -1);
    setFeedbackSubmitted(false);
    setFeedbackNegative(false);
    setFeedbackReason('');
  }, [text]);

  const handleCopy = () => {
    const textToCopy = isEditing ? editText : text;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onShowToast) onShowToast('✓ Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    const textToSpeak = isEditing ? editText : text;
    if (!textToSpeak) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speakText(
      textToSpeak,
      targetLang,
      voiceSettings,
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const handleDownload = () => {
    const textToDownload = isEditing ? editText : text;
    if (!textToDownload) return;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LingoBridge-${targetLang.toUpperCase()}-Translation.txt`;
    link.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Downloaded translation file!', 'info');
  };

  const handleShare = async () => {
    const shareText = isEditing ? editText : text;
    if (!shareText) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LingoBridge Translation',
          text: shareText,
        });
        if (onShowToast) onShowToast('Shared successfully!', 'success');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(shareText);
    if (onShowToast) onShowToast('Translation copied to clipboard!', 'info');
  };

  // Editor Actions
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditText(text);
    setHistoryStack([text]);
    setHistoryIndex(0);
  };

  const handleTextChange = (val) => {
    setEditText(val);
    const updated = historyStack.slice(0, historyIndex + 1);
    updated.push(val);
    setHistoryStack(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setEditText(historyStack[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setEditText(historyStack[newIdx]);
    }
  };

  const handleSaveEditAction = () => {
    if (onSaveEdit) onSaveEdit(editText);
    setIsEditing(false);
    if (onShowToast) onShowToast('Edited translation saved!', 'success');
  };

  const handleCancelEdit = () => {
    setEditText(text);
    setIsEditing(false);
  };

  // Feedback Actions
  const handleFeedback = async (helpful, reason = '') => {
    setFeedbackSubmitted(true);
    await submitFeedbackApi({
      sourceLang,
      targetLang,
      original: sourceText || '',
      translated: text || '',
      helpful,
      reason,
    });
    if (onShowToast) onShowToast('Thank you for your feedback!', 'success');
  };

  return (
    <div className="translator-card">
      <div className="card-header-bar">
        <div className="select-and-detection">
          <LanguageSelector
            value={targetLang}
            onChange={onSelectLang}
            languages={languages}
            label="Select target language"
            allowAuto={false}
          />
          <QuickLanguageChips
            selectedCode={targetLang}
            onSelect={onSelectLang}
            includeAuto={false}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          {detectedLangName && (
            <span className="detection-badge">
              🔍 Detected: {detectedLangName} • {detectedConfidence}
            </span>
          )}
          <span
            className={`status-pill ${
              loading ? 'status-translating' : error ? 'status-error' : text ? 'status-translated' : 'status-ready'
            }`}
          >
            {loading ? 'Translating...' : error ? 'Error' : text ? 'Translated' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Output / Editor Area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div className="output-loading-skeleton">
            <span className="spinner">⏳</span>
            <p>Translating with AI...</p>
          </div>
        ) : error ? (
          <div className="output-error-banner">
            ⚠️ {error}
          </div>
        ) : isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="editor-controls-bar">
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                ✏️ Editing Output
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo edit (Ctrl+Z)"
                >
                  ↩️ Undo
                </button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= historyStack.length - 1}
                  title="Redo edit"
                >
                  ↪️ Redo
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveEditAction}
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.8rem' }}
                >
                  💾 Save
                </button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
            <textarea
              className="output-textarea"
              style={{ border: '1px solid var(--color-primary)' }}
              value={editText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Edit translation result here..."
              aria-label="Editable translated text result"
            />
          </div>
        ) : (
          <textarea
            className="output-textarea"
            readOnly
            value={text}
            placeholder="Translation result will appear here..."
            aria-label="Translated text result"
          />
        )}
      </div>

      {/* Translation Helpful Feedback Widget */}
      {text && !loading && (
        <div className="feedback-banner">
          {!feedbackSubmitted ? (
            !feedbackNegative ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Was this translation helpful?
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="feedback-btn"
                    onClick={() => handleFeedback(true)}
                    title="Helpful translation"
                  >
                    👍 Yes
                  </button>
                  <button
                    type="button"
                    className="feedback-btn"
                    onClick={() => setFeedbackNegative(true)}
                    title="Needs improvement"
                  >
                    👎 No
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>What went wrong?</span>
                {['Incorrect meaning', 'Grammar issue', 'Wrong language', 'Other'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="btn-secondary-sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => handleFeedback(false, reason)}
                  >
                    {reason}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-secondary-sm"
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                  onClick={() => setFeedbackNegative(false)}
                >
                  Cancel
                </button>
              </div>
            )
          ) : (
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '500' }}>
              ✓ Feedback submitted. Thank you!
            </span>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="card-bottom-bar">
        <div className="action-btn-group" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={handleCopy}
            disabled={!text}
            title="Copy to clipboard"
            aria-label="Copy translated text"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={handleSpeak}
            disabled={!text}
            title="Listen to speech translation"
            aria-label="Speak translated text"
          >
            {isSpeaking ? '⏹️ Stop' : '🔊 Speak'}
          </button>

          {/* Edit Mode Toggle */}
          {text && !isEditing && (
            <button
              type="button"
              className="icon-btn"
              onClick={handleStartEdit}
              title="Edit translation result"
              aria-label="Edit translated text"
            >
              ✏️ Edit
            </button>
          )}

          {/* Re-translate Button */}
          {onReTranslate && (
            <button
              type="button"
              className="icon-btn"
              onClick={onReTranslate}
              disabled={loading || !sourceText}
              title="Re-translate original text"
              aria-label="Re-translate"
            >
              🔄 Re-translate
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={handleShare}
            disabled={!text}
            title="Share translation"
            aria-label="Share translation"
          >
            📤 Share
          </button>

          {onOpenQRShare && (
            <button
              type="button"
              className="icon-btn"
              onClick={onOpenQRShare}
              disabled={!text}
              title="Generate QR code for translation"
              aria-label="QR Share"
            >
              📱 QR
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={handleDownload}
            disabled={!text}
            title="Download translation as .txt file"
            aria-label="Download translation"
          >
            ⬇️ Download
          </button>

          {onToggleFavorite && text && (
            <button
              type="button"
              className={`icon-btn ${isFavorite ? 'favorited' : ''}`}
              onClick={onToggleFavorite}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Favorite translation"
            >
              {isFavorite ? '⭐ Favorited' : '☆ Favorite'}
            </button>
          )}

          <button
            type="button"
            className="icon-btn"
            onClick={onOpenVoiceSettings}
            title="Voice & Speech Settings"
            aria-label="Voice settings"
          >
            ⚙️ Voice
          </button>
        </div>

        {text && (
          <button
            type="button"
            className="icon-btn"
            onClick={onClear}
            title="Clear output"
            aria-label="Clear output text"
          >
            🗑️ Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default TranslationOutput;
