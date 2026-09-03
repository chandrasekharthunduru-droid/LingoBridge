const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
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
} = require('./db');
const authenticateToken = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.TRANSLATION_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_lingo_bridge_2026';

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// POST /api/auth/register or /auth/register
app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.',
        error: 'Name is required.',
      });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
        error: 'Please enter a valid email address.',
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        error: 'Password must be at least 6 characters long.',
      });
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
        error: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = createUser({ name: name.trim(), email: email.trim(), passwordHash });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to register user. Please try again.',
      error: 'Failed to register user. Please try again.',
    });
  }
});

// POST /api/auth/login or /auth/login
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
        error: 'Email and password are required.',
      });
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
        error: 'Please enter a valid email address.',
      });
    }

    const user = findUserByEmail(cleanEmail);
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: 'Invalid email or password.',
      });
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch (bcryptErr) {
      console.error('Bcrypt comparison error:', bcryptErr);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: 'Invalid email or password.',
      });
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        error: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to login right now',
      error: err.message || 'Internal server error',
    });
  }
});

// GET /api/auth/me or /auth/me
app.get(['/api/auth/me', '/auth/me'], authenticateToken, (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
      error: 'User not found.',
    });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

// PUT /api/user/profile or /user/profile
app.put(['/api/user/profile', '/user/profile'], authenticateToken, (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Name is required.',
      error: 'Name is required.',
    });
  }

  const updatedUser = updateUserProfile(req.user.id, { name: name.trim() });
  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
      error: 'User not found.',
    });
  }

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

// -------------------------------------------------------------
// TRANSLATION HISTORY ENDPOINTS (Authenticated & User-Scoped)
// -------------------------------------------------------------

// GET /api/history or /history
app.get(['/api/history', '/history'], authenticateToken, (req, res) => {
  const history = getUserHistory(req.user.id);
  return res.json({ success: true, history });
});

// POST /api/history or /history
app.post(['/api/history', '/history'], authenticateToken, (req, res) => {
  const { sourceLang, targetLang, original, translated } = req.body || {};
  if (!original || !translated) {
    return res.status(400).json({ success: false, error: 'Invalid history payload.' });
  }
  const entry = addUserHistory(req.user.id, { sourceLang, targetLang, original, translated });
  return res.status(201).json({ success: true, entry });
});

// DELETE /api/history/:id or /history/:id
app.delete(['/api/history/:id', '/history/:id'], authenticateToken, (req, res) => {
  const success = deleteUserHistoryItem(req.user.id, req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'History item not found.' });
  }
  return res.json({ success: true, message: 'Item deleted successfully.' });
});

// DELETE /api/history or /history
app.delete(['/api/history', '/history'], authenticateToken, (req, res) => {
  clearUserHistory(req.user.id);
  return res.json({ success: true, message: 'History cleared successfully.' });
});

// -------------------------------------------------------------
// FAVORITES ENDPOINTS (Authenticated & User-Scoped)
// -------------------------------------------------------------

// GET /api/favorites or /favorites
app.get(['/api/favorites', '/favorites'], authenticateToken, (req, res) => {
  const favorites = getUserFavorites(req.user.id);
  return res.json({ success: true, favorites });
});

// POST /api/favorites or /favorites
app.post(['/api/favorites', '/favorites'], authenticateToken, (req, res) => {
  const { sourceLang, targetLang, original, translated } = req.body || {};
  if (!original || !translated) {
    return res.status(400).json({ success: false, message: 'Original and translated text are required.' });
  }
  const favorite = addUserFavorite(req.user.id, { sourceLang, targetLang, original, translated });
  return res.status(201).json({ success: true, favorite });
});

// DELETE /api/favorites/:id or /favorites/:id
app.delete(['/api/favorites/:id', '/favorites/:id'], authenticateToken, (req, res) => {
  const success = removeUserFavorite(req.user.id, req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Favorite item not found.' });
  }
  return res.json({ success: true, message: 'Removed from favorites.' });
});

// -------------------------------------------------------------
// PERSONAL GLOSSARY ENDPOINTS (Authenticated & User-Scoped)
// -------------------------------------------------------------

// GET /api/glossary or /glossary
app.get(['/api/glossary', '/glossary'], authenticateToken, (req, res) => {
  const terms = getUserGlossary(req.user.id);
  return res.json({ success: true, terms });
});

// POST /api/glossary or /glossary
app.post(['/api/glossary', '/glossary'], authenticateToken, (req, res) => {
  const { sourceLang, targetLang, sourceTerm, targetTerm } = req.body || {};
  if (!sourceTerm || !targetTerm) {
    return res.status(400).json({ success: false, message: 'Source term and target term are required.' });
  }
  const term = addGlossaryTerm(req.user.id, { sourceLang, targetLang, sourceTerm, targetTerm });
  return res.status(201).json({ success: true, term });
});

// PUT /api/glossary/:id or /glossary/:id
app.put(['/api/glossary/:id', '/glossary/:id'], authenticateToken, (req, res) => {
  const { sourceTerm, targetTerm, sourceLang, targetLang } = req.body || {};
  const term = updateGlossaryTerm(req.user.id, req.params.id, { sourceTerm, targetTerm, sourceLang, targetLang });
  if (!term) {
    return res.status(404).json({ success: false, message: 'Glossary term not found.' });
  }
  return res.json({ success: true, term });
});

// DELETE /api/glossary/:id or /glossary/:id
app.delete(['/api/glossary/:id', '/glossary/:id'], authenticateToken, (req, res) => {
  const success = deleteGlossaryTerm(req.user.id, req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, message: 'Glossary term not found.' });
  }
  return res.json({ success: true, message: 'Glossary term deleted.' });
});

// -------------------------------------------------------------
// TRANSLATION FEEDBACK ENDPOINT
// -------------------------------------------------------------

// POST /api/feedback or /feedback
app.post(['/api/feedback', '/feedback'], (req, res) => {
  let userId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {}
  }

  const { sourceLang, targetLang, original, translated, helpful, reason, comments } = req.body || {};
  const feedback = addFeedback(userId, { sourceLang, targetLang, original, translated, helpful, reason, comments });
  return res.status(201).json({ success: true, message: 'Thank you for your feedback!', feedback });
});

// -------------------------------------------------------------
// TRANSLATION ANALYTICS ENDPOINT (Authenticated & User-Scoped)
// -------------------------------------------------------------

// GET /api/analytics or /analytics
app.get(['/api/analytics', '/analytics'], authenticateToken, (req, res) => {
  const analytics = getUserAnalytics(req.user.id);
  return res.json({ success: true, analytics });
});

// -------------------------------------------------------------
// AI TEXT IMPROVEMENT ENDPOINT
// -------------------------------------------------------------

app.post(['/api/ai/improve', '/ai/improve'], (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text parameter is required.' });
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  cleaned = cleaned.replace(/\s+([,.!?])/g, '$1').replace(/([,.!?])([^\s0-9])/g, '$1 $2');

  const replacements = [
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

  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  return res.json({ improved: cleaned });
});

// -------------------------------------------------------------
// TRANSLATION PROXY ENDPOINT (Preserved)
// -------------------------------------------------------------

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.post(['/translate', '/api/translate'], async (req, res) => {
  const { text, sourceLang, targetLang } = req.body || {};
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  let translated = '';
  let detectedSource = sourceLang;

  // Check if real API key is configured
  if (API_KEY && API_KEY !== 'YOUR_GOOGLE_CLOUD_API_KEY' && API_KEY !== 'your_key_here') {
    try {
      const response = await axios.post(GOOGLE_API_URL, null, {
        params: {
          q: text,
          target: targetLang,
          source: sourceLang !== 'auto' ? sourceLang : undefined,
          key: API_KEY,
        },
      });
      translated = response.data.data.translations[0].translatedText;
      detectedSource = response.data.data.translations[0].detectedSourceLanguage || sourceLang;
    } catch (error) {
      console.warn('Google Cloud Translation API error, falling back to free endpoints:', error.response?.data || error.message);
    }
  }

  // Fallback to free Google Translate endpoint if not already translated
  if (!translated) {
    try {
      const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
      const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await axios.get(fallbackUrl);
      translated = response.data[0].map((item) => item[0]).join('');
      detectedSource = response.data[2] || sourceLang;
    } catch (fallbackErr) {
      console.warn('Google GTX fallback error on backend:', fallbackErr.message);
      // Try MyMemory before returning error
      try {
        const langPair = `${sourceLang === 'auto' ? 'autodetect' : sourceLang}|${targetLang}`;
        const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        const mmRes = await axios.get(mmUrl, { timeout: 6000 });
        if (mmRes.data?.responseData?.translatedText) {
          translated = mmRes.data.responseData.translatedText;
          detectedSource = mmRes.data.responseData.detectedLanguage || sourceLang;
        }
      } catch (mmErr) {
        console.error('MyMemory backend fallback error:', mmErr.message);
      }

      if (!translated) {
        return res.status(500).json({ success: false, message: 'Translation failed. Please try again.', error: 'Translation failed.' });
      }
    }
  }

  // Apply user personal glossary terms if authenticated and present
  let userId = null;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (e) {}
  }

  if (userId) {
    try {
      const glossary = getUserGlossary(userId);
      const applicableTerms = glossary.filter(
        (g) =>
          (!g.sourceLang || g.sourceLang === 'auto' || g.sourceLang === sourceLang || g.sourceLang === detectedSource) &&
          (!g.targetLang || g.targetLang === targetLang)
      );
      for (const item of applicableTerms) {
        if (item.sourceTerm && item.targetTerm) {
          const srcRegex = new RegExp(escapeRegExp(item.sourceTerm), 'gi');
          if (srcRegex.test(text)) {
            // Apply glossary term
            translated = translated.replace(new RegExp(escapeRegExp(item.sourceTerm), 'gi'), item.targetTerm);
          }
        }
      }
    } catch (gErr) {
      console.warn('Error applying glossary terms:', gErr);
    }
  }

  return res.json({ translated, detectedSource });
});

// Fallback 404 handler for API routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
    error: 'Route not found',
  });
});

// Global error handler middleware ensuring JSON response
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload.',
      error: 'Invalid JSON payload.',
    });
  }
  console.error('Unhandled server error:', err);
  return res.status(500).json({
    success: false,
    message: 'Unable to login right now',
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Translation proxy & auth server listening on port ${PORT}`);
  });
}

module.exports = app;

