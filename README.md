# LingoBridge – Production-Grade AI Translation Platform 🌍

> **Breaking language barriers, one translation at a time.**  
> *Developed as an internship capstone submission.*

LingoBridge is an advanced, production-style AI language translation platform engineered with React, Node.js, Express, and modern browser Web APIs. It features end-to-end user authentication with JWT, user-isolated data storage, editable translation output with undo/redo, dynamic re-translation, advanced search/filtered translation history, starred favorites, interactive translation analytics, personal glossaries, real-time speech synthesis/recognition, OCR image translation, multi-format document extraction, and QR code sharing.

---

## 🌟 Core Features & Modules

### 1. Authentication & Security
- **JWT & Bcrypt Hashing**: Passwords are securely hashed with bcrypt (salt rounds = 10).
- **Persistent Sessions**: Automatic token-based session restoration on load (`/api/auth/me`).
- **Protected Routes**: React Router protected routes prevent unauthorized access to `/translator`.
- **Quick Demo Account**: One-click demo login (`demo@example.com` / `password123`) using live backend authentication.
- **User Data Isolation**: Each user can only view and manage their own history, favorites, glossaries, and analytics.

### 2. Translation Workspace
- **18 Global Languages + Auto Detect**:
  - Auto Detect, English, Telugu, Hindi, Tamil, Kannada, Malayalam, Bengali, Marathi, Spanish, French, German, Portuguese, Japanese, Korean, Chinese, Arabic, and Russian.
- **Dynamic Language Swap**: Swap source and target languages with smooth animations and state synchronization.
- **5000 Character Counter**: Real-time counter with character validation.
- **Status Indicator**: Live badge reflecting translation state (`Ready`, `Translating...`, `Translated`, `Error`).
- **Keyboard Shortcuts**:
  - <kbd>Ctrl + Enter</kbd>: Instant translation
  - <kbd>Ctrl + K</kbd>: Focus translation input
  - <kbd>Esc</kbd>: Close active modal dialog

### 3. Translation Editor & Re-Translate
- **Inline Translation Editor**: Edit translated text after translation with full **Undo** (<kbd>↩️</kbd>) and **Redo** (<kbd>↪️</kbd>) capabilities.
- **Safe Persistence**: Save edits back to the translation output and synchronize with user history.
- **🔄 One-Click Re-Translate**: Seamlessly translate existing source text again upon target language changes or manual trigger without re-typing.

### 4. Advanced History & Date Filters
- **Full Text Search**: Search through history by original text, translated text, or language codes.
- **Date & Category Filters**:
  - `All`, `⭐ Favorites`, `Today`, `This Week`, `This Month`.
- **Per-Item Card Actions**:
  - ⭐ Toggle Favorite
  - 📋 Quick Copy
  - 🔄 Re-translate / Load
  - 🗑 Delete Item
- **Safe Clear All**: Protected by an interactive confirmation modal.

### 5. Starred Favorites
- Save frequent translations and phrases.
- Dedicated Favorites modal with real-time search, quick copy, and re-translate.
- Persisted both to backend user records and local storage fallback.

### 6. Translation Analytics
- Real-time user statistics dashboard:
  - **Total Translations Count**
  - **Total Characters Translated**
  - **Unique Languages Used**
  - **Top Translation Route** (e.g., English → Telugu)
  - **Favorites Saved Count**
  - **Target Languages Distribution Charts** (visual progress breakdown).

### 7. Personal Glossary ("My Glossary")
- Define custom domain-specific vocabulary and preferred translations (e.g. *College* → *కళాశాల*, *Internship* → *ఇంటర్న్‌షిప్*).
- Backend post-processing applies user glossary terms to matching language translations.
- Full CRUD operations: Add, Edit, Delete, and Search terms.

### 8. Translation Feedback
- Inline "Was this translation helpful? 👍 Yes / 👎 No" widget.
- Collects structured feedback reasons (*Incorrect meaning*, *Grammar issue*, *Wrong language*, *Other*) stored with translation logs.

### 9. Voice & Accessibility (TTS & STT)
- **Speech-to-Text (Voice Input)**: Web Speech Recognition with live recording status indicator and language mapping.
- **Text-to-Speech (Pronunciation)**: Web Speech Synthesis with voice selection, pitch, rate, and volume customization.
- **Speech Settings Modal**: Customize speech rate, pitch, and voice preferences.

### 10. File & OCR Processing
- **Image OCR Translation**: Upload image files (JPG, PNG, WEBP) to extract text using client-side Tesseract.js.
- **Document Translation**: Parse text from `.txt`, `.pdf` (pdfjs-dist), and `.docx` (mammoth) files up to 10MB.

### 11. Sharing & Export
- **One-Click Clipboard Copy**: With visual toast feedback.
- **File Download**: Export translations as formatted text files.
- **Native Web Share**: Share via native system share dialog on mobile/supported desktop browsers.
- **📱 QR Code Sharing**: Generate and download a scannable QR code of the translation for camera reading on mobile devices without exposing personal user data.

### 12. User Profile & Preferences
- View account statistics, member information, and update display name.
- Customize default source/target languages and appearance settings (Dark Mode / Light Mode).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, React Router v7, Vanilla CSS Design System, Web Speech API |
| **Build Tool** | Vite 5 |
| **Backend** | Node.js, Express 4, Axios, Cors, Dotenv |
| **Authentication** | JSON Web Tokens (JWT), BcryptJS |
| **Document Parsers** | `tesseract.js` (OCR), `pdfjs-dist` (PDF), `mammoth` (DOCX) |
| **Translation Engine** | Google Cloud Translation API (with resilient GTX & MyMemory fallbacks) |

---

## 📁 Project Structure

```
codealpha/
├── backend/
│   ├── .env                     # Backend environment variables
│   ├── data.json                # User, history, favorites, glossary, feedback store
│   ├── db.js                    # Database service layer & data helpers
│   ├── middleware/
│   │   └── auth.js              # JWT Bearer token authentication middleware
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express API server & routes
├── src/
│   ├── components/
│   │   ├── AITools.jsx          # AI grammar / style prompts
│   │   ├── AnalyticsModal.jsx   # Usage statistics & language breakdown charts
│   │   ├── DocumentTranslator.jsx # TXT, PDF, DOCX file text extractor
│   │   ├── Favorites.jsx        # Starred translations modal
│   │   ├── GlossaryModal.jsx    # Custom personal dictionary manager
│   │   ├── Header.jsx           # Top navigation & user profile dropdown menu
│   │   ├── ImageTranslator.jsx  # OCR image upload & scanner
│   │   ├── LanguageSelector.jsx # Searchable language dropdown
│   │   ├── LingoBridgeLogo.jsx  # SVG branding logo
│   │   ├── ProfileModal.jsx     # User profile overview & name editor
│   │   ├── ProtectedRoute.jsx   # Route guard for authenticated views
│   │   ├── QRShareModal.jsx     # Translation QR code generator & exporter
│   │   ├── QuickLanguageChips.jsx # Quick access language buttons
│   │   ├── SettingsModal.jsx    # Application & translation preferences
│   │   ├── SwapButton.jsx       # Animated language swap button
│   │   ├── ThemeToggle.jsx      # Dark / Light theme switcher
│   │   ├── Toast.jsx            # Action notifications
│   │   ├── TranslationHistory.jsx # History section with search & date filters
│   │   ├── TranslationInput.jsx # Source text editor with voice, OCR, & doc tools
│   │   ├── TranslationOutput.jsx # Output panel with inline editor & feedback
│   │   ├── VoiceInput.jsx       # Microphone speech recognition trigger
│   │   └── VoiceSettingsModal.jsx # Speech rate, pitch, & voice selector
│   ├── context/
│   │   └── AuthContext.jsx      # Global user auth provider & fetch wrapper
│   ├── pages/
│   │   ├── LoginPage.jsx        # Login & Quick Demo form
│   │   ├── SignUpPage.jsx       # Registration form
│   │   └── TranslatorPage.jsx   # Main workspace dashboard
│   ├── services/
│   │   ├── aiService.js         # Grammar & text improvement service
│   │   ├── documentService.js   # PDF & DOCX text extraction
│   │   ├── ocrService.js        # Image OCR worker
│   │   ├── speechService.js     # Web Speech helper
│   │   └── translationService.js # Translation, History, Favorites, & Glossary API client
│   ├── utils/
│   │   └── speechUtils.js       # Voice selection & synthesis utilities
│   ├── App.jsx                  # Application routing & providers
│   ├── index.css                # Core design system & component styles
│   └── main.jsx                 # Vite application entry point
├── .env                         # Root environment configuration
├── .gitignore                   # Excludes .env, node_modules, dist, and logs
├── index.html                   # HTML template
├── package.json                 # Root dependencies & concurrent dev script
└── vite.config.js               # Vite configuration & /api proxy to backend
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Creates a new user account with hashed password |
| `POST` | `/api/auth/login` | No | Authenticates credentials and issues JWT token |
| `GET` | `/api/auth/me` | Yes | Retrieves authenticated user profile |
| `PUT` | `/api/user/profile` | Yes | Updates user display name |
| `POST` | `/api/translate` | Optional | Translates text, applying personal glossary if logged in |
| `POST` | `/api/ai/improve` | No | Corrects grammar, spelling, and tone |
| `GET` | `/api/history` | Yes | Retrieves user-scoped translation history |
| `POST` | `/api/history` | Yes | Saves a translation entry to history |
| `DELETE` | `/api/history/:id` | Yes | Deletes an individual history item |
| `DELETE` | `/api/history` | Yes | Clears all user history |
| `GET` | `/api/favorites` | Yes | Retrieves user-scoped starred translations |
| `POST` | `/api/favorites` | Yes | Adds an item to favorites |
| `DELETE` | `/api/favorites/:id` | Yes | Removes a favorite item |
| `GET` | `/api/glossary` | Yes | Retrieves user personal glossary terms |
| `POST` | `/api/glossary` | Yes | Adds a new glossary term |
| `PUT` | `/api/glossary/:id` | Yes | Updates an existing glossary term |
| `DELETE` | `/api/glossary/:id` | Yes | Deletes a glossary term |
| `POST` | `/api/feedback` | Optional | Submits translation satisfaction feedback |
| `GET` | `/api/analytics` | Yes | Aggregates translation statistics and usage charts |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Ensure a `.env` file is present in the project root:
```env
PORT=5000
JWT_SECRET=super_secret_jwt_key_lingo_bridge_2026
GOOGLE_TRANSLATE_API_KEY=your_key_here
TRANSLATION_API_KEY=your_key_here
```
> **Security Notice**: Never commit `.env` files or API secrets to public repositories. All `.env` files are ignored by `.gitignore`. If no Google API key is configured, LingoBridge automatically uses built-in resilient translation fallbacks.

### 3. Running the Application
Start both the backend server and frontend development server concurrently with a single command:
```bash
npm run dev
```

Or start them individually:
```bash
# Terminal 1: Backend Server (Port 5000)
npm run start:backend

# Terminal 2: Frontend Client (Port 3000)
npm run start:frontend
```

Open your browser to:
**http://localhost:3000**

---

## 🔑 Demo Account Credentials
Evaluators can log in immediately using the **⚡ Quick Demo Login** button or entering:
- **Email:** `demo@example.com`
- **Password:** `password123`

---

## 🧪 Testing Guide for Evaluators

1. **Authentication Flow**:
   - Test Sign In using `demo@example.com` / `password123`.
   - Test Sign Up with a new test account and verify automatic redirect.
   - Verify invalid credentials return clear HTTP 401 warnings.
2. **Translation & Auto-Detect**:
   - Type `"Hello, welcome to LingoBridge"` in Auto Detect mode and translate to Telugu, Hindi, or Spanish.
   - Verify detected language badge and confidence level.
3. **Re-Translate**:
   - Change target language dropdown or click **🔄 Re-translate** to verify immediate update without retyping.
4. **Translation Editor**:
   - Click **✏️ Edit** on output, modify text, test **↩️ Undo** and **↪️ Redo**, then click **💾 Save**.
5. **Personal Glossary**:
   - Open dropdown menu $\rightarrow$ **📚 My Glossary**.
   - Add a term (e.g. *Assignment* $\rightarrow$ *అసైన్మెంట్*).
   - Translate a sentence containing that term to see your custom vocabulary applied!
6. **Analytics**:
   - Open dropdown menu $\rightarrow$ **📊 Analytics** to see total translations, characters, and language usage breakdown.
7. **History & Search**:
   - Search translations using the search bar.
   - Filter by `⭐ Favorites`, `Today`, `This Week`.
   - Test single item delete and clear history confirmation dialog.
8. **Speech & Multimedia**:
   - Click **🔊 Speak** to hear native pronunciation.
   - Click **📷 Image** or **📄 Document** to extract text via OCR or PDF/DOCX parser.
9. **QR Code Sharing**:
   - Click **📱 QR** on output to generate and download a scannable QR code.
10. **Appearance**:
    - Click theme toggle icon to switch seamlessly between Dark Navy and Clean Light modes.

---

## 🛡️ License & Submission
Developed for internship submission. Built with care for performance, accessibility, security, and exceptional user experience.
