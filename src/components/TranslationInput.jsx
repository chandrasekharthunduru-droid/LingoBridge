import React, { useState, forwardRef } from 'react';
import LanguageSelector from './LanguageSelector';
import QuickLanguageChips from './QuickLanguageChips';
import VoiceInput from './VoiceInput';
import AITools from './AITools';
import { improveText } from '../services/aiService';

const TranslationInput = forwardRef(function TranslationInput(
  {
    text,
    onChange,
    maxChars = 5000,
    sourceLang,
    onSelectLang,
    languages,
    onTranslate,
    onApplyAI,
    onClear,
    onOpenImageModal,
    onOpenDocumentModal,
    onShowToast,
  },
  ref
) {
  const [isImproving, setIsImproving] = useState(false);
  const remaining = maxChars - text.length;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (text.trim() && onTranslate) {
        onTranslate();
      }
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        onChange(text + (text ? '\n' : '') + clipboardText);
        if (onShowToast) onShowToast('Text pasted from clipboard!', 'info');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Unable to access clipboard. Please paste manually.', 'warning');
    }
  };

  const handleImproveText = async () => {
    if (!text || !text.trim()) {
      if (onShowToast) onShowToast('Please enter text to improve.', 'warning');
      return;
    }
    setIsImproving(true);
    try {
      const improved = await improveText(text);
      onChange(improved);
      if (onShowToast) onShowToast('Text improved with AI!', 'success');
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to improve text.', 'danger');
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="translator-card">
      <div className="card-header-bar">
        <div className="select-and-detection">
          <LanguageSelector
            value={sourceLang}
            onChange={onSelectLang}
            languages={languages}
            label="Select source language"
            allowAuto={true}
          />
          <QuickLanguageChips
            selectedCode={sourceLang}
            onSelect={onSelectLang}
            includeAuto={true}
          />
        </div>
      </div>

      <textarea
        ref={ref}
        className="input-textarea"
        value={text}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        onKeyDown={handleKeyDown}
        placeholder="Type or paste your text here... (Ctrl + Enter to translate, Ctrl + K to focus)"
        aria-label="Source text to translate"
      />

      <AITools text={text} onApplyAI={onApplyAI} />

      <div className="card-bottom-bar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="action-btn-group" style={{ flexWrap: 'wrap' }}>
          <VoiceInput
            onTranscript={(transcript) => onChange(text ? `${text} ${transcript}` : transcript)}
            sourceLang={sourceLang}
            onShowToast={onShowToast}
          />

          <button
            type="button"
            className="icon-btn"
            onClick={handlePaste}
            title="Paste text from clipboard"
            aria-label="Paste text"
          >
            📋 Paste
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={onOpenImageModal}
            title="Upload image for text extraction (OCR)"
            aria-label="Upload image"
          >
            📷 Image
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={onOpenDocumentModal}
            title="Upload document file (TXT, PDF, DOCX)"
            aria-label="Upload document"
          >
            📄 Document
          </button>

          <button
            type="button"
            className="icon-btn"
            onClick={handleImproveText}
            disabled={isImproving || !text.trim()}
            title="Fix grammar, spelling, and improve clarity"
            aria-label="Improve text"
          >
            {isImproving ? '⏳ Improving...' : '✨ Improve Text'}
          </button>

          {text && (
            <button
              type="button"
              className="icon-btn"
              onClick={onClear}
              title="Clear text"
              aria-label="Clear input text"
            >
              🗑️ Clear
            </button>
          )}
        </div>

        <span
          style={{
            color: remaining < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
            fontWeight: '600',
            fontSize: '0.85rem',
          }}
        >
          {text.length} / {maxChars}
        </span>
      </div>
    </div>
  );
});

export default TranslationInput;
