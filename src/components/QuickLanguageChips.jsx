import React from 'react';

const POPULAR_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

function QuickLanguageChips({ selectedCode, onSelect, includeAuto = false }) {
  const languagesToDisplay = includeAuto
    ? [{ code: 'auto', name: 'Auto' }, ...POPULAR_LANGUAGES]
    : POPULAR_LANGUAGES;

  return (
    <div className="quick-chips-container" aria-label="Quick language selection">
      {languagesToDisplay.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`chip-btn ${selectedCode === lang.code ? 'active' : ''}`}
          onClick={() => onSelect(lang.code)}
          aria-label={`Select ${lang.name}`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}

export default QuickLanguageChips;
