export async function translate(text, sourceLang = 'auto', targetLang = 'en') {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Try backend proxy server first if available
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        translated: data.translated,
        detectedSource: data.detectedSource || sourceLang,
      };
    }
  } catch (err) {
    console.warn('Backend proxy unavailable or failed, attempting direct translation API fallback...', err);
  }

  // Fallback 1: Google Free GTX API
  try {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const translated = data[0].map((item) => item[0]).join('');
      const detectedSource = data[2] || sourceLang;
      return { translated, detectedSource };
    }
  } catch (err) {
    console.warn('Google GTX fallback failed, trying MyMemory...', err);
  }

  // Fallback 2: MyMemory API
  try {
    const langPair = `${sourceLang === 'auto' ? 'autodetect' : sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.responseData && data.responseData.translatedText) {
        return {
          translated: data.responseData.translatedText,
          detectedSource: data.responseData.detectedLanguage || sourceLang,
        };
      }
    }
  } catch (err) {
    console.error('All translation options failed', err);
  }

  throw new Error('Translation failed. Please check your network connection.');
}

// User-scoped History API Helpers
export async function fetchUserHistory() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const res = await fetch('/api/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (err) {
    console.error('Failed to fetch user history from API', err);
  }
  return [];
}

export async function saveUserHistoryEntry(entry) {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const data = await res.json();
      return data.entry;
    }
  } catch (err) {
    console.error('Failed to save history entry to API', err);
  }
  return null;
}

export async function deleteUserHistoryItemApi(id) {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const res = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete history item via API', err);
    return false;
  }
}

export async function clearUserHistoryApi() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    await fetch('/api/history', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error('Failed to clear user history via API', err);
  }
}

// User-scoped Favorites API Helpers
export async function fetchUserFavorites() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const res = await fetch('/api/favorites', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.favorites || [];
    }
  } catch (err) {
    console.error('Failed to fetch user favorites from API', err);
  }
  return [];
}

export async function addUserFavoriteApi(favorite) {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(favorite),
    });
    if (res.ok) {
      const data = await res.json();
      return data.favorite;
    }
  } catch (err) {
    console.error('Failed to add favorite via API', err);
  }
  return null;
}

export async function removeUserFavoriteApi(id) {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const res = await fetch(`/api/favorites/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to remove favorite via API', err);
    return false;
  }
}

// Personal Glossary API Helpers
export async function fetchUserGlossary() {
  const token = localStorage.getItem('token');
  if (!token) return [];
  try {
    const res = await fetch('/api/glossary', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.terms || [];
    }
  } catch (err) {
    console.error('Failed to fetch glossary from API', err);
  }
  return [];
}

export async function addGlossaryTermApi(term) {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch('/api/glossary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(term),
    });
    if (res.ok) {
      const data = await res.json();
      return data.term;
    }
  } catch (err) {
    console.error('Failed to add glossary term via API', err);
  }
  return null;
}

export async function updateGlossaryTermApi(id, updates) {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch(`/api/glossary/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      return data.term;
    }
  } catch (err) {
    console.error('Failed to update glossary term via API', err);
  }
  return null;
}

export async function deleteGlossaryTermApi(id) {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const res = await fetch(`/api/glossary/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete glossary term via API', err);
    return false;
  }
}

// Feedback API Helper
export async function submitFeedbackApi(feedback) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers,
      body: JSON.stringify(feedback),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to submit feedback via API', err);
    return false;
  }
}

// Analytics API Helper
export async function fetchUserAnalyticsApi() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch('/api/analytics', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return data.analytics;
    }
  } catch (err) {
    console.error('Failed to fetch analytics from API', err);
  }
  return null;
}

// Profile API Helper
export async function updateUserProfileApi(name) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not logged in.');
  const res = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Failed to update profile.');
  }
  return data.user;
}
