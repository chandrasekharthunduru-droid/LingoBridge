import React from 'react';

function TranslateButton({ onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: 'bold',
        width: '100%',
        margin: '0.5rem 0'
      }}
    >
      {loading ? 'Translating...' : 'Translate'}
    </button>
  );
}

export default TranslateButton;
