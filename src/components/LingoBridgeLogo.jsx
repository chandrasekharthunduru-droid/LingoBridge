import React from 'react';

export default function LingoBridgeLogo({ size = 44, className = '', showText = false, showTagline = false }) {
  return (
    <div className={`lingobridge-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(79, 70, 229, 0.3))' }}
      >
        <defs>
          <linearGradient id="lingoPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          <linearGradient id="bubbleLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>

          <linearGradient id="bubbleRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#4f46e5" floodOpacity="0.35" />
          </filter>
        </defs>

        <g filter="url(#logoGlow)">
          <path d="M 120 256 A 136 136 0 0 1 392 256" fill="none" stroke="url(#lingoPrimaryGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray="8 8" opacity="0.4" />

          <path d="M 140 260 C 200 130, 312 130, 372 260" fill="none" stroke="url(#lingoPrimaryGrad)" strokeWidth="24" strokeLinecap="round" />

          <path d="M 170 245 Q 256 185, 342 245" fill="none" stroke="#ffffff" strokeWidth="6" opacity="0.8" strokeLinecap="round" />

          <g transform="translate(40, 0)">
            <path d="M 120 230 C 75 230 40 265 40 310 C 40 338 54 362 76 376 L 65 415 L 110 395 C 113 396 117 396 120 396 C 165 396 200 361 200 316 C 200 271 165 230 120 230 Z" fill="url(#bubbleLeftGrad)" />
            <text x="120" y="328" fontFamily="'Inter', sans-serif" fontWeight="800" fontSize="52" fill="#ffffff" textAnchor="middle">A</text>
          </g>

          <g transform="translate(-40, 0)">
            <path d="M 392 230 C 347 230 312 271 312 316 C 312 361 347 396 392 396 C 395 396 399 396 402 395 L 447 415 L 436 376 C 458 362 472 338 472 310 C 472 265 437 230 392 230 Z" fill="url(#bubbleRightGrad)" />
            <text x="392" y="328" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="48" fill="#ffffff" textAnchor="middle">文</text>
          </g>

          <circle cx="256" cy="180" r="16" fill="#ffffff" />
          <circle cx="256" cy="180" r="10" fill="url(#lingoPrimaryGrad)" />
        </g>
      </svg>

      {showText && (
        <div>
          <h1 className="brand-title" style={{ margin: 0 }}>LingoBridge</h1>
          {showTagline && (
            <p className="brand-tagline" style={{ margin: 0 }}>Breaking language barriers, one translation at a time.</p>
          )}
        </div>
      )}
    </div>
  );
}
