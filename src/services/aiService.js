// AI Text Improvement Service (Grammar, Spelling, & Clarity Refinement)

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

export async function improveText(text) {
  if (!text || !text.trim()) {
    throw new Error('Please enter text to improve.');
  }

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Try backend AI endpoint first
  try {
    const res = await fetch(`${API_BASE}/api/ai/improve`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.improved) return data.improved;
    }
  } catch (err) {
    console.warn('Backend AI improve endpoint unavailable, using client-side grammar refinement fallback:', err);
  }

  // Client-side rule-based text refinement fallback
  let cleaned = text.trim();

  // 1. Capitalize first letter of sentences
  cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());

  // 2. Fix common spacing issues around punctuation
  cleaned = cleaned.replace(/\s+([,.!?])/g, '$1').replace(/([,.!?])([^\s0-9])/g, '$1 $2');

  // 3. Fix common typos / informal words
  const Replacements = [
    [/\bi want go\b/gi, 'I want to go'],
    [/\bpls\b/gi, 'please'],
    [/\bplz\b/gi, 'please'],
    [/\bthx\b/gi, 'thank you'],
    [/\bu\b/gi, 'you'],
    [/\bur\b/gi, 'your'],
    [/\br\b/gi, 'are'],
    [/\bcant\b/gi, "can't"],
    [/\bdont\b/gi, "don't"],
    [/\bwont\b/gi, "won't"],
    [/\bim\b/gi, "I'm"],
    [/\bi\b/g, 'I'],
  ];

  for (const [pattern, replacement] of Replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Ensure ending punctuation if missing
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return cleaned;
}
