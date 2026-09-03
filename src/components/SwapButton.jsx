import React, { useState } from 'react';

function SwapButton({ onClick, disabled, sourceLangName, targetLangName }) {
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsRotating(true);
    onClick();
    setTimeout(() => setIsRotating(false), 400);
  };

  return (
    <div className="swap-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <button
        type="button"
        className={`swap-btn ${isRotating ? 'rotating' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        title="Swap Languages & Text"
        aria-label="Swap source and target languages"
      >
        ⇄
      </button>
      {sourceLangName && targetLangName && (
        <span className="swap-pair-badge">
          {sourceLangName} ⇄ {targetLangName}
        </span>
      )}
    </div>
  );
}

export default SwapButton;
