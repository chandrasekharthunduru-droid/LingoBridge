import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header.jsx';
import TranslationInput from '../components/TranslationInput.jsx';
import TranslationOutput from '../components/TranslationOutput.jsx';
import SwapButton from '../components/SwapButton.jsx';
import TranslationHistory from '../components/TranslationHistory.jsx';
import VoiceSettingsModal from '../components/VoiceSettingsModal.jsx';
import ImageTranslator from '../components/ImageTranslator.jsx';
import DocumentTranslator from '../components/DocumentTranslator.jsx';
import Favorites from '../components/Favorites.jsx';
import SettingsModal from '../components/SettingsModal.jsx';
import AnalyticsModal from '../components/AnalyticsModal.jsx';
import GlossaryModal from '../components/GlossaryModal.jsx';
import ProfileModal from '../components/ProfileModal.jsx';
import QRShareModal from '../components/QRShareModal.jsx';
import Toast from '../components/Toast.jsx';
import {
  translate,
  fetchUserHistory,
  saveUserHistoryEntry,
  deleteUserHistoryItemApi,
  clearUserHistoryApi,
  fetchUserFavorites,
  addUserFavoriteApi,
  removeUserFavoriteApi,
} from '../services/translationService.js';
import { useAuth } from '../context/AuthContext.jsx';

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
];

function TranslatorPage() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [sourceLang, setSourceLang] = useState(() => localStorage.getItem('defaultSourceLang') || 'auto');
  const [targetLang, setTargetLang] = useState(() => localStorage.getItem('defaultTargetLang') || 'te');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lingoHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('lingoFavorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [detectedLangName, setDetectedLangName] = useState(null);

  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('lingoSettings');
      return saved ? JSON.parse(saved) : {
        defaultSourceLang: 'auto',
        defaultTargetLang: 'te',
        autoDetect: true,
        voiceURI: '',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        enableHistory: true,
      };
    } catch (e) {
      return { defaultSourceLang: 'auto', defaultTargetLang: 'te', autoDetect: true, rate: 1.0, pitch: 1.0, volume: 1.0, enableHistory: true };
    }
  });

  // Modal States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 3500);
  };

  // Sync history and favorites with backend if logged in
  useEffect(() => {
    async function syncBackendData() {
      if (user) {
        const [userHist, userFavs] = await Promise.all([
          fetchUserHistory(),
          fetchUserFavorites(),
        ]);
        if (userHist && userHist.length > 0) {
          setHistory(userHist);
        }
        if (userFavs && userFavs.length > 0) {
          setFavorites(userFavs);
        }
      }
    }
    syncBackendData();
  }, [user]);

  // Persist history & favorites to localStorage
  useEffect(() => {
    localStorage.setItem('lingoHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('lingoFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Enter, Esc)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ctrl + K or Cmd + K -> Focus input textarea
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
          showToast('Focused translation input (Ctrl + K)', 'info');
        }
      }
      // Esc -> Close any open modal
      if (e.key === 'Escape') {
        setIsVoiceModalOpen(false);
        setIsImageModalOpen(false);
        setIsDocumentModalOpen(false);
        setIsFavoritesOpen(false);
        setIsSettingsOpen(false);
        setIsAnalyticsOpen(false);
        setIsGlossaryOpen(false);
        setIsProfileOpen(false);
        setIsQRModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleTranslate = async (customText = null, customTarget = null) => {
    const textToTranslate = customText !== null ? customText : inputText;
    const tgt = customTarget || targetLang;

    if (!textToTranslate.trim()) {
      setError('Please enter text to translate.');
      showToast('Unable to translate empty input.', 'warning');
      return;
    }

    if (sourceLang === tgt && sourceLang !== 'auto') {
      setError('Source and target languages cannot be the same.');
      showToast('Source and target languages are identical.', 'warning');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { translated, detectedSource } = await translate(textToTranslate, sourceLang, tgt);
      setTranslatedText(translated);

      let detectedName = null;
      if (sourceLang === 'auto' && detectedSource) {
        const matched = LANGUAGES.find((l) => l.code === detectedSource);
        detectedName = matched ? matched.name : detectedSource.toUpperCase();
      }
      setDetectedLangName(detectedName);

      if (settings.enableHistory !== false) {
        const newEntry = {
          id: Date.now(),
          sourceLang: sourceLang === 'auto' ? (detectedSource || 'auto') : sourceLang,
          targetLang: tgt,
          original: textToTranslate,
          translated,
          timestamp: new Date().toISOString(),
        };

        setHistory((prev) => [newEntry, ...prev.filter((item) => item.id !== newEntry.id)]);
        saveUserHistoryEntry(newEntry);
      }
    } catch (e) {
      console.error('Translation error:', e);
      const friendlyMsg = 'Unable to translate right now. Please check your connection and try again.';
      setError(friendlyMsg);
      showToast(friendlyMsg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Re-translate with target language change
  const handleTargetLangChange = (newTarget) => {
    setTargetLang(newTarget);
    if (inputText.trim() && translatedText) {
      handleTranslate(inputText, newTarget);
    }
  };

  const handleReTranslate = () => {
    if (!inputText.trim()) {
      showToast('Please enter text to re-translate.', 'warning');
      return;
    }
    handleTranslate(inputText, targetLang);
    showToast('Re-translating text...', 'info');
  };

  const handleSaveEdit = (newTranslatedText) => {
    setTranslatedText(newTranslatedText);
    // Update matching or top history entry
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      if (updated[0]) {
        updated[0] = { ...updated[0], translated: newTranslatedText };
        saveUserHistoryEntry(updated[0]);
      }
      return updated;
    });
  };

  const handleApplyAI = (prefix) => {
    const combinedText = `${prefix}${inputText}`;
    setInputText(combinedText);
    handleTranslate(combinedText);
  };

  const handleSwap = () => {
    if (sourceLang === 'auto' && targetLang === 'auto') return;

    const newSource = targetLang === 'auto' ? 'en' : targetLang;
    const newTarget = sourceLang === 'auto' ? 'en' : sourceLang;

    setSourceLang(newSource);
    setTargetLang(newTarget);
    setInputText(translatedText);
    setTranslatedText(inputText);

    showToast(`Swapped: ${LANGUAGES.find((l) => l.code === newSource)?.name} ⇄ ${LANGUAGES.find((l) => l.code === newTarget)?.name}`, 'info');
  };

  const clearInput = () => {
    setInputText('');
    setError(null);
  };

  const clearOutput = () => {
    setTranslatedText('');
    setDetectedLangName(null);
  };

  const loadHistoryItem = (item) => {
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setInputText(item.original);
    setTranslatedText(item.translated);
    showToast('Loaded translation!', 'info');
  };

  const clearHistory = async () => {
    setHistory([]);
    localStorage.removeItem('lingoHistory');
    await clearUserHistoryApi();
    showToast('Translation history cleared.', 'info');
  };

  const deleteHistoryItem = async (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    await deleteUserHistoryItemApi(id);
    showToast('Translation removed from history.', 'info');
  };

  const toggleFavorite = async (item) => {
    if (!item || !item.original || !item.translated) return;
    const exists = favorites.some(
      (f) => f.id === item.id || (f.original === item.original && f.translated === item.translated)
    );

    if (exists) {
      const match = favorites.find(
        (f) => f.id === item.id || (f.original === item.original && f.translated === item.translated)
      );
      setFavorites((prev) => prev.filter((f) => f.id !== item.id && f.original !== item.original));
      if (match?.id) {
        await removeUserFavoriteApi(match.id);
      }
      showToast('Removed from favorites.', 'info');
    } else {
      const favItem = item.id && item.id !== 'current' ? item : { ...item, id: Date.now() };
      setFavorites((prev) => [favItem, ...prev]);
      await addUserFavoriteApi(favItem);
      showToast('⭐ Added to favorites!', 'success');
    }
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('lingoSettings', JSON.stringify(newSettings));
    if (newSettings.defaultSourceLang) setSourceLang(newSettings.defaultSourceLang);
    if (newSettings.defaultTargetLang) setTargetLang(newSettings.defaultTargetLang);
  };

  const sourceLangObj = LANGUAGES.find((l) => l.code === sourceLang) || LANGUAGES[0];
  const targetLangObj = LANGUAGES.find((l) => l.code === targetLang) || LANGUAGES[1];

  const currentTranslationItem = {
    id: 'current',
    sourceLang,
    targetLang,
    original: inputText,
    translated: translatedText,
  };
  const isCurrentFavorite = favorites.some(
    (f) => f.original === inputText && f.translated === translatedText && inputText.trim() !== ''
  );

  return (
    <div className="app-container">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenHistoryModal={() => {}}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <h2 className="hero-title">Translate with LingoBridge</h2>
        <p className="hero-subtitle">Fast • Accurate • Simple • AI-powered</p>
      </section>

      {/* Main Grid */}
      <main className="translator-grid">
        <TranslationInput
          ref={inputRef}
          text={inputText}
          onChange={setInputText}
          sourceLang={sourceLang}
          onSelectLang={setSourceLang}
          languages={LANGUAGES}
          onTranslate={() => handleTranslate()}
          onApplyAI={handleApplyAI}
          onClear={clearInput}
          onOpenImageModal={() => setIsImageModalOpen(true)}
          onOpenDocumentModal={() => setIsDocumentModalOpen(true)}
          onShowToast={showToast}
          maxChars={5000}
        />

        <div className="swap-container">
          <SwapButton
            onClick={handleSwap}
            disabled={loading}
            sourceLangName={sourceLangObj.name}
            targetLangName={targetLangObj.name}
          />
        </div>

        <TranslationOutput
          text={translatedText}
          sourceText={inputText}
          sourceLang={sourceLang}
          loading={loading}
          error={error}
          targetLang={targetLang}
          onSelectLang={handleTargetLangChange}
          languages={LANGUAGES}
          detectedLangName={detectedLangName}
          voiceSettings={settings}
          onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
          onClear={clearOutput}
          onShowToast={showToast}
          isFavorite={isCurrentFavorite}
          onToggleFavorite={() => toggleFavorite(currentTranslationItem)}
          onReTranslate={handleReTranslate}
          onSaveEdit={handleSaveEdit}
          onOpenQRShare={() => setIsQRModalOpen(true)}
        />
      </main>

      {/* Main Translate Trigger */}
      <div className="main-translate-wrapper">
        <button
          type="button"
          className="main-translate-btn"
          onClick={() => handleTranslate()}
          disabled={loading || !inputText.trim()}
        >
          {loading ? '⏳ Translating...' : '✨ Translate'}
        </button>
        <span className="kbd-shortcut">
          Pro tip: Press <kbd>Ctrl + Enter</kbd> to translate • <kbd>Ctrl + K</kbd> to focus input
        </span>
      </div>

      {/* Recent History */}
      <TranslationHistory
        items={history}
        onSelect={loadHistoryItem}
        onClear={clearHistory}
        onDeleteItem={deleteHistoryItem}
        onToggleFavorite={toggleFavorite}
        favorites={favorites}
        onShowToast={showToast}
      />

      {/* Modals & Components */}
      <VoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        targetLang={targetLang}
        voiceSettings={settings}
        onUpdateSettings={(newVoice) => handleSaveSettings({ ...settings, ...newVoice })}
        testText={translatedText}
      />

      <ImageTranslator
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onExtractedText={(extracted) => setInputText((prev) => (prev ? `${prev}\n${extracted}` : extracted))}
        onShowToast={showToast}
      />

      <DocumentTranslator
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        onExtractedText={(extracted) => setInputText(extracted)}
        onShowToast={showToast}
      />

      <Favorites
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favorites={favorites}
        onSelect={loadHistoryItem}
        onRemoveFavorite={(id) => {
          setFavorites((prev) => prev.filter((f) => f.id !== id));
          removeUserFavoriteApi(id);
          showToast('Favorite removed.', 'info');
        }}
        onShowToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onClearHistory={clearHistory}
        languages={LANGUAGES}
        onShowToast={showToast}
      />

      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
        languages={LANGUAGES}
        onShowToast={showToast}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        totalTranslations={history.length}
        favoritesCount={favorites.length}
        onShowToast={showToast}
      />

      <QRShareModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        text={translatedText}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onShowToast={showToast}
      />

      {/* Toast Notification */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}

export default TranslatorPage;
