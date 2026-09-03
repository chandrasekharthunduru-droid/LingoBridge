const fs = require('fs');
const path = require('path');

const SEED_DATA_FILE = path.join(__dirname, 'data.json');

function getDataFilePath() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpPath = path.join('/tmp', 'lingobridge_data.json');
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(SEED_DATA_FILE)) {
          fs.copyFileSync(SEED_DATA_FILE, tmpPath);
        } else {
          fs.writeFileSync(
            tmpPath,
            JSON.stringify({ users: [], history: [], favorites: [], glossary: [], feedback: [] })
          );
        }
      } catch (err) {
        console.warn('Could not initialize /tmp data file:', err.message);
      }
    }
    return tmpPath;
  }
  return SEED_DATA_FILE;
}

let memoryCache = null;

function loadData() {
  const filePath = getDataFilePath();
  if (!fs.existsSync(filePath)) {
    const defaultData = { users: [], history: [], favorites: [], glossary: [], feedback: [] };
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    } catch (e) {
      console.warn('Filesystem write not permitted, using in-memory fallback:', e.message);
    }
    memoryCache = defaultData;
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    memoryCache = {
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : [],
      glossary: Array.isArray(parsed?.glossary) ? parsed.glossary : [],
      feedback: Array.isArray(parsed?.feedback) ? parsed.feedback : [],
    };
    return memoryCache;
  } catch (e) {
    console.error('Error reading data file:', e.message);
    if (memoryCache) return memoryCache;
    return { users: [], history: [], favorites: [], glossary: [], feedback: [] };
  }
}

function saveData(data) {
  memoryCache = data;
  const filePath = getDataFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('Error writing data file (data held in memory):', e.message);
  }
}

function findUserByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const data = loadData();
  const searchEmail = email.trim().toLowerCase();
  return data.users.find(
    (u) => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === searchEmail
  );
}

function findUserById(id) {
  if (!id) return null;
  const data = loadData();
  return data.users.find((u) => u && u.id === id);
}

function updateUserProfile(userId, { name }) {
  if (!userId) return null;
  const data = loadData();
  const user = data.users.find((u) => u && u.id === userId);
  if (!user) return null;
  if (name && typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }
  saveData(data);
  return { id: user.id, name: user.name, email: user.email };
}

function createUser({ name, email, passwordHash }) {
  const data = loadData();
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: cleanName,
    email: cleanEmail,
    passwordHash: passwordHash || '',
    createdAt: new Date().toISOString(),
  };
  data.users.push(newUser);
  saveData(data);
  return newUser;
}

// -------------------------------------------------------------
// HISTORY (User-scoped)
// -------------------------------------------------------------

function getUserHistory(userId) {
  if (!userId) return [];
  const data = loadData();
  return (data.history || [])
    .filter((h) => h && h.userId === userId)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

function addUserHistory(userId, entry) {
  if (!userId || !entry) return null;
  const data = loadData();
  const newHistory = {
    id: entry.id || Date.now(),
    userId,
    sourceLang: entry.sourceLang || 'auto',
    targetLang: entry.targetLang || 'en',
    original: entry.original || '',
    translated: entry.translated || '',
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  data.history.unshift(newHistory);
  saveData(data);
  return newHistory;
}

function deleteUserHistoryItem(userId, itemId) {
  if (!userId || !itemId) return false;
  const data = loadData();
  const initialLength = data.history.length;
  data.history = (data.history || []).filter(
    (h) => !(h && h.userId === userId && String(h.id) === String(itemId))
  );
  if (data.history.length !== initialLength) {
    saveData(data);
    return true;
  }
  return false;
}

function clearUserHistory(userId) {
  if (!userId) return;
  const data = loadData();
  data.history = (data.history || []).filter((h) => h && h.userId !== userId);
  saveData(data);
}

// -------------------------------------------------------------
// FAVORITES (User-scoped)
// -------------------------------------------------------------

function getUserFavorites(userId) {
  if (!userId) return [];
  const data = loadData();
  return (data.favorites || [])
    .filter((f) => f && f.userId === userId)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

function addUserFavorite(userId, item) {
  if (!userId || !item) return null;
  const data = loadData();
  if (!Array.isArray(data.favorites)) data.favorites = [];

  // Prevent duplicates for identical original + translated
  const existing = data.favorites.find(
    (f) => f.userId === userId && f.original === item.original && f.translated === item.translated
  );
  if (existing) return existing;

  const newFav = {
    id: item.id || Date.now(),
    userId,
    sourceLang: item.sourceLang || 'auto',
    targetLang: item.targetLang || 'en',
    original: item.original || '',
    translated: item.translated || '',
    timestamp: item.timestamp || new Date().toISOString(),
  };
  data.favorites.unshift(newFav);
  saveData(data);
  return newFav;
}

function removeUserFavorite(userId, favoriteId) {
  if (!userId || !favoriteId) return false;
  const data = loadData();
  const initialLength = (data.favorites || []).length;
  data.favorites = (data.favorites || []).filter(
    (f) => !(f && f.userId === userId && String(f.id) === String(favoriteId))
  );
  if (data.favorites.length !== initialLength) {
    saveData(data);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// PERSONAL GLOSSARY (User-scoped)
// -------------------------------------------------------------

function getUserGlossary(userId) {
  if (!userId) return [];
  const data = loadData();
  return (data.glossary || [])
    .filter((g) => g && g.userId === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function addGlossaryTerm(userId, { sourceLang, targetLang, sourceTerm, targetTerm }) {
  if (!userId || !sourceTerm || !targetTerm) return null;
  const data = loadData();
  if (!Array.isArray(data.glossary)) data.glossary = [];

  const newTerm = {
    id: 'term_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    userId,
    sourceLang: (sourceLang || 'en').toLowerCase().trim(),
    targetLang: (targetLang || 'te').toLowerCase().trim(),
    sourceTerm: sourceTerm.trim(),
    targetTerm: targetTerm.trim(),
    createdAt: new Date().toISOString(),
  };
  data.glossary.unshift(newTerm);
  saveData(data);
  return newTerm;
}

function updateGlossaryTerm(userId, termId, { sourceTerm, targetTerm, sourceLang, targetLang }) {
  if (!userId || !termId) return null;
  const data = loadData();
  const term = (data.glossary || []).find((g) => g && g.userId === userId && g.id === termId);
  if (!term) return null;

  if (sourceTerm) term.sourceTerm = sourceTerm.trim();
  if (targetTerm) term.targetTerm = targetTerm.trim();
  if (sourceLang) term.sourceLang = sourceLang.toLowerCase().trim();
  if (targetLang) term.targetLang = targetLang.toLowerCase().trim();
  term.updatedAt = new Date().toISOString();

  saveData(data);
  return term;
}

function deleteGlossaryTerm(userId, termId) {
  if (!userId || !termId) return false;
  const data = loadData();
  const initialLength = (data.glossary || []).length;
  data.glossary = (data.glossary || []).filter(
    (g) => !(g && g.userId === userId && g.id === termId)
  );
  if (data.glossary.length !== initialLength) {
    saveData(data);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// TRANSLATION FEEDBACK (User-scoped)
// -------------------------------------------------------------

function addFeedback(userId, { sourceLang, targetLang, original, translated, helpful, reason, comments }) {
  const data = loadData();
  if (!Array.isArray(data.feedback)) data.feedback = [];

  const newFeedback = {
    id: 'fb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    userId: userId || 'anonymous',
    sourceLang: sourceLang || 'auto',
    targetLang: targetLang || 'en',
    original: original || '',
    translated: translated || '',
    helpful: Boolean(helpful),
    reason: reason || '',
    comments: comments || '',
    createdAt: new Date().toISOString(),
  };
  data.feedback.push(newFeedback);
  saveData(data);
  return newFeedback;
}

// -------------------------------------------------------------
// TRANSLATION ANALYTICS (User-scoped aggregation)
// -------------------------------------------------------------

function getUserAnalytics(userId) {
  if (!userId) {
    return {
      totalTranslations: 0,
      totalCharacters: 0,
      languagesUsed: 0,
      mostUsedPair: 'None',
      favoritesCount: 0,
      languageBreakdown: {},
    };
  }

  const history = getUserHistory(userId);
  const favorites = getUserFavorites(userId);

  let totalCharacters = 0;
  const langSet = new Set();
  const pairCounts = {};
  const targetCounts = {};

  for (const item of history) {
    const chars = (item.original || '').length;
    totalCharacters += chars;

    if (item.sourceLang) langSet.add(item.sourceLang.toLowerCase());
    if (item.targetLang) {
      langSet.add(item.targetLang.toLowerCase());
      const tgt = item.targetLang.toLowerCase();
      targetCounts[tgt] = (targetCounts[tgt] || 0) + 1;
    }

    const pair = `${(item.sourceLang || 'auto').toUpperCase()} → ${(item.targetLang || 'en').toUpperCase()}`;
    pairCounts[pair] = (pairCounts[pair] || 0) + 1;
  }

  let mostUsedPair = 'None';
  let maxPairCount = 0;
  for (const [pair, count] of Object.entries(pairCounts)) {
    if (count > maxPairCount) {
      maxPairCount = count;
      mostUsedPair = pair;
    }
  }

  return {
    totalTranslations: history.length,
    totalCharacters,
    languagesUsed: langSet.size,
    mostUsedPair: history.length > 0 ? mostUsedPair : 'English → Telugu',
    favoritesCount: favorites.length,
    targetCounts,
    historyCount: history.length,
  };
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  getUserHistory,
  addUserHistory,
  deleteUserHistoryItem,
  clearUserHistory,
  getUserFavorites,
  addUserFavorite,
  removeUserFavorite,
  getUserGlossary,
  addGlossaryTerm,
  updateGlossaryTerm,
  deleteGlossaryTerm,
  addFeedback,
  getUserAnalytics,
};

