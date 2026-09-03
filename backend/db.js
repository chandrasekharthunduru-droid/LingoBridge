const fs = require('fs');
const path = require('path');

const SEED_DATA_FILE = path.join(__dirname, 'data.json');

// Helper to determine active JSON file path
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

// Read default seed data
function getSeedData() {
  try {
    if (fs.existsSync(SEED_DATA_FILE)) {
      const raw = fs.readFileSync(SEED_DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return { users: [], history: [], favorites: [], glossary: [], feedback: [] };
}

// -------------------------------------------------------------
// VERCEL KV / UPSTASH REST HELPER
// -------------------------------------------------------------
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function getFromKv() {
  if (!kvUrl || !kvToken) return null;
  try {
    const res = await fetch(`${kvUrl}/get/lingobridge:data`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (res.ok) {
      const json = await res.json();
      let val = json.result;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch (e) {}
      }
      if (val && typeof val === 'object' && Array.isArray(val.users)) {
        return val;
      }
    }
  } catch (err) {
    console.warn('Vercel KV read failed:', err.message);
  }
  return null;
}

async function saveToKv(data) {
  if (!kvUrl || !kvToken) return false;
  try {
    const res = await fetch(`${kvUrl}/set/lingobridge:data`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}` },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn('Vercel KV write failed:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// MONGODB CONNECTION (Optional, if MONGODB_URI is provided)
// -------------------------------------------------------------
let mongoClient = null;
let mongoDbInstance = null;

async function getMongoDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (mongoDbInstance) return mongoDbInstance;
  try {
    const { MongoClient } = require('mongodb');
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    mongoDbInstance = mongoClient.db(process.env.MONGODB_DB_NAME || 'lingobridge');
    console.log('Connected to MongoDB database');
    return mongoDbInstance;
  } catch (err) {
    console.warn('MongoDB connection failed, using local/KV store:', err.message);
    return null;
  }
}

// -------------------------------------------------------------
// CORE DATA ACCESS (Unifies Local JSON, KV, & Mongo)
// -------------------------------------------------------------
async function loadData() {
  // 1. Try Vercel KV / Upstash if configured
  if (kvUrl && kvToken) {
    const kvData = await getFromKv();
    if (kvData) {
      memoryCache = kvData;
      return kvData;
    }
  }

  // 2. Try in-memory cache if valid
  if (memoryCache && Array.isArray(memoryCache.users) && memoryCache.users.length > 0) {
    return memoryCache;
  }

  // 3. Fallback to filesystem
  const filePath = getDataFilePath();
  if (!fs.existsSync(filePath)) {
    const defaultData = getSeedData();
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    } catch (e) {
      console.warn('Filesystem write not permitted:', e.message);
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
    return getSeedData();
  }
}

async function saveData(data) {
  memoryCache = data;

  // 1. Save to Vercel KV / Upstash if configured
  if (kvUrl && kvToken) {
    await saveToKv(data);
  }

  // 2. Save to filesystem
  const filePath = getDataFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('Error writing data file (held in memory):', e.message);
  }
}

// -------------------------------------------------------------
// USER AUTHENTICATION & PROFILE METHODS
// -------------------------------------------------------------

async function findUserByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const searchEmail = email.trim().toLowerCase();

  // Try MongoDB if configured
  const mdb = await getMongoDb();
  if (mdb) {
    try {
      const user = await mdb.collection('users').findOne({ email: searchEmail });
      if (user) return user;
    } catch (e) {
      console.warn('Mongo findUserByEmail error:', e.message);
    }
  }

  const data = await loadData();
  return (data.users || []).find(
    (u) => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === searchEmail
  );
}

async function findUserById(id) {
  if (!id) return null;

  // Try MongoDB if configured
  const mdb = await getMongoDb();
  if (mdb) {
    try {
      const user = await mdb.collection('users').findOne({ id });
      if (user) return user;
    } catch (e) {
      console.warn('Mongo findUserById error:', e.message);
    }
  }

  const data = await loadData();
  return (data.users || []).find((u) => u && u.id === id);
}

async function updateUserProfile(userId, { name }) {
  if (!userId) return null;
  const cleanName = (name || '').trim();

  // Try MongoDB if configured
  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('users').updateOne({ id: userId }, { $set: { name: cleanName } });
      const user = await mdb.collection('users').findOne({ id: userId });
      if (user) return { id: user.id, name: user.name, email: user.email };
    } catch (e) {
      console.warn('Mongo updateUserProfile error:', e.message);
    }
  }

  const data = await loadData();
  const user = (data.users || []).find((u) => u && u.id === userId);
  if (!user) return null;
  if (cleanName) {
    user.name = cleanName;
  }
  await saveData(data);
  return { id: user.id, name: user.name, email: user.email };
}

async function createUser({ name, email, passwordHash }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: cleanName,
    email: cleanEmail,
    passwordHash: passwordHash || '',
    createdAt: new Date().toISOString(),
  };

  // Try MongoDB if configured
  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('users').insertOne(newUser);
    } catch (e) {
      console.warn('Mongo createUser error:', e.message);
    }
  }

  const data = await loadData();
  // Prevent duplicate insertion
  if (!data.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    data.users.push(newUser);
    await saveData(data);
  }

  return newUser;
}

// -------------------------------------------------------------
// HISTORY (User-scoped)
// -------------------------------------------------------------

async function getUserHistory(userId) {
  if (!userId) return [];

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      const items = await mdb.collection('history').find({ userId }).sort({ timestamp: -1 }).toArray();
      if (items && items.length > 0) return items;
    } catch (e) {
      console.warn('Mongo getUserHistory error:', e.message);
    }
  }

  const data = await loadData();
  return (data.history || [])
    .filter((h) => h && h.userId === userId)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

async function addUserHistory(userId, entry) {
  if (!userId || !entry) return null;
  const newHistory = {
    id: entry.id || Date.now(),
    userId,
    sourceLang: entry.sourceLang || 'auto',
    targetLang: entry.targetLang || 'en',
    original: entry.original || '',
    translated: entry.translated || '',
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('history').insertOne(newHistory);
    } catch (e) {
      console.warn('Mongo addUserHistory error:', e.message);
    }
  }

  const data = await loadData();
  data.history.unshift(newHistory);
  await saveData(data);
  return newHistory;
}

async function deleteUserHistoryItem(userId, itemId) {
  if (!userId || !itemId) return false;

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('history').deleteOne({ userId, id: itemId });
    } catch (e) {
      console.warn('Mongo deleteUserHistoryItem error:', e.message);
    }
  }

  const data = await loadData();
  const initialLength = data.history.length;
  data.history = (data.history || []).filter(
    (h) => !(h && h.userId === userId && String(h.id) === String(itemId))
  );
  if (data.history.length !== initialLength) {
    await saveData(data);
    return true;
  }
  return false;
}

async function clearUserHistory(userId) {
  if (!userId) return;

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('history').deleteMany({ userId });
    } catch (e) {
      console.warn('Mongo clearUserHistory error:', e.message);
    }
  }

  const data = await loadData();
  data.history = (data.history || []).filter((h) => h && h.userId !== userId);
  await saveData(data);
}

// -------------------------------------------------------------
// FAVORITES (User-scoped)
// -------------------------------------------------------------

async function getUserFavorites(userId) {
  if (!userId) return [];

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      const items = await mdb.collection('favorites').find({ userId }).sort({ timestamp: -1 }).toArray();
      if (items && items.length > 0) return items;
    } catch (e) {
      console.warn('Mongo getUserFavorites error:', e.message);
    }
  }

  const data = await loadData();
  return (data.favorites || [])
    .filter((f) => f && f.userId === userId)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

async function addUserFavorite(userId, item) {
  if (!userId || !item) return null;
  const newFav = {
    id: item.id || Date.now(),
    userId,
    sourceLang: item.sourceLang || 'auto',
    targetLang: item.targetLang || 'en',
    original: item.original || '',
    translated: item.translated || '',
    timestamp: item.timestamp || new Date().toISOString(),
  };

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      const existing = await mdb.collection('favorites').findOne({
        userId,
        original: item.original,
        translated: item.translated,
      });
      if (!existing) {
        await mdb.collection('favorites').insertOne(newFav);
      }
    } catch (e) {
      console.warn('Mongo addUserFavorite error:', e.message);
    }
  }

  const data = await loadData();
  if (!Array.isArray(data.favorites)) data.favorites = [];

  const existing = data.favorites.find(
    (f) => f.userId === userId && f.original === item.original && f.translated === item.translated
  );
  if (existing) return existing;

  data.favorites.unshift(newFav);
  await saveData(data);
  return newFav;
}

async function removeUserFavorite(userId, favoriteId) {
  if (!userId || !favoriteId) return false;

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('favorites').deleteOne({ userId, id: favoriteId });
    } catch (e) {
      console.warn('Mongo removeUserFavorite error:', e.message);
    }
  }

  const data = await loadData();
  const initialLength = (data.favorites || []).length;
  data.favorites = (data.favorites || []).filter(
    (f) => !(f && f.userId === userId && String(f.id) === String(favoriteId))
  );
  if (data.favorites.length !== initialLength) {
    await saveData(data);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// PERSONAL GLOSSARY (User-scoped)
// -------------------------------------------------------------

async function getUserGlossary(userId) {
  if (!userId) return [];

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      const items = await mdb.collection('glossary').find({ userId }).sort({ createdAt: -1 }).toArray();
      if (items && items.length > 0) return items;
    } catch (e) {
      console.warn('Mongo getUserGlossary error:', e.message);
    }
  }

  const data = await loadData();
  return (data.glossary || [])
    .filter((g) => g && g.userId === userId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

async function addGlossaryTerm(userId, { sourceLang, targetLang, sourceTerm, targetTerm }) {
  if (!userId || !sourceTerm || !targetTerm) return null;

  const newTerm = {
    id: 'term_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    userId,
    sourceLang: (sourceLang || 'en').toLowerCase().trim(),
    targetLang: (targetLang || 'te').toLowerCase().trim(),
    sourceTerm: sourceTerm.trim(),
    targetTerm: targetTerm.trim(),
    createdAt: new Date().toISOString(),
  };

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('glossary').insertOne(newTerm);
    } catch (e) {
      console.warn('Mongo addGlossaryTerm error:', e.message);
    }
  }

  const data = await loadData();
  if (!Array.isArray(data.glossary)) data.glossary = [];
  data.glossary.unshift(newTerm);
  await saveData(data);
  return newTerm;
}

async function updateGlossaryTerm(userId, termId, { sourceTerm, targetTerm, sourceLang, targetLang }) {
  if (!userId || !termId) return null;

  const updates = {};
  if (sourceTerm) updates.sourceTerm = sourceTerm.trim();
  if (targetTerm) updates.targetTerm = targetTerm.trim();
  if (sourceLang) updates.sourceLang = sourceLang.toLowerCase().trim();
  if (targetLang) updates.targetLang = targetLang.toLowerCase().trim();
  updates.updatedAt = new Date().toISOString();

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('glossary').updateOne({ userId, id: termId }, { $set: updates });
    } catch (e) {
      console.warn('Mongo updateGlossaryTerm error:', e.message);
    }
  }

  const data = await loadData();
  const term = (data.glossary || []).find((g) => g && g.userId === userId && g.id === termId);
  if (!term) return null;

  Object.assign(term, updates);
  await saveData(data);
  return term;
}

async function deleteGlossaryTerm(userId, termId) {
  if (!userId || !termId) return false;

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('glossary').deleteOne({ userId, id: termId });
    } catch (e) {
      console.warn('Mongo deleteGlossaryTerm error:', e.message);
    }
  }

  const data = await loadData();
  const initialLength = (data.glossary || []).length;
  data.glossary = (data.glossary || []).filter(
    (g) => !(g && g.userId === userId && g.id === termId)
  );
  if (data.glossary.length !== initialLength) {
    await saveData(data);
    return true;
  }
  return false;
}

// -------------------------------------------------------------
// TRANSLATION FEEDBACK (User-scoped)
// -------------------------------------------------------------

async function addFeedback(userId, { sourceLang, targetLang, original, translated, helpful, reason, comments }) {
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

  const mdb = await getMongoDb();
  if (mdb) {
    try {
      await mdb.collection('feedback').insertOne(newFeedback);
    } catch (e) {
      console.warn('Mongo addFeedback error:', e.message);
    }
  }

  const data = await loadData();
  if (!Array.isArray(data.feedback)) data.feedback = [];
  data.feedback.push(newFeedback);
  await saveData(data);
  return newFeedback;
}

// -------------------------------------------------------------
// TRANSLATION ANALYTICS (User-scoped aggregation)
// -------------------------------------------------------------

async function getUserAnalytics(userId) {
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

  const history = await getUserHistory(userId);
  const favorites = await getUserFavorites(userId);

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
