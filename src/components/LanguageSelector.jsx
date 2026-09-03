import React, { useState, useRef, useEffect } from 'react';

export default function LanguageSelector({
  value,
  onChange,
  languages,
  label = 'Select Language',
  allowAuto = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  const availableLanguages = allowAuto
    ? languages
    : languages.filter((l) => l.code !== 'auto');

  const selectedLanguage = languages.find((l) => l.code === value) || availableLanguages[0];

  const filteredLanguages = availableLanguages.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-lang-selector" ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="lang-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={label}
        aria-expanded={isOpen}
      >
        <span>{selectedLanguage ? selectedLanguage.name : 'Select'}</span>
        <span className="arrow-icon" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="lang-dropdown-menu">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="lang-search-input"
              placeholder="Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="lang-options-list">
            {filteredLanguages.length === 0 ? (
              <div className="no-options">No languages match "{searchQuery}"</div>
            ) : (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-option-btn ${lang.code === value ? 'active' : ''}`}
                  onClick={() => {
                    onChange(lang.code);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <span>{lang.name}</span>
                  {lang.code === value && <span className="checkmark">✓</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
