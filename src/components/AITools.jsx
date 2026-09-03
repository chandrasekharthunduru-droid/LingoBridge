import React from 'react';

const AI_TOOLS = [
  { id: 'grammar', label: '🪄 Improve Grammar', prefix: 'Please check and correct the grammar of this text while maintaining its original meaning: ' },
  { id: 'professional', label: '💼 Make Professional', prefix: 'Rewrite this text in a clear, professional, and formal tone: ' },
  { id: 'friendly', label: '😊 Make Friendly', prefix: 'Rewrite this text in a warm, friendly, and approachable tone: ' },
  { id: 'simplify', label: '💡 Simplify Text', prefix: 'Simplify this text so it is easy to understand: ' },
  { id: 'business', label: '👔 Business Tone', prefix: 'Rewrite this text in a polished business corporate tone: ' },
];

function AITools({ text, onApplyAI }) {
  if (!text || !text.trim()) return null;

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', fontWeight: '600' }}>
        ✨ AI Assistant Tools:
      </div>
      <div className="ai-tools-container">
        {AI_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className="ai-tool-chip"
            onClick={() => onApplyAI(tool.prefix)}
            title={tool.label}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AITools;
