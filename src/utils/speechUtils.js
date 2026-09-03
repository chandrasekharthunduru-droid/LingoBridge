const FEMALE_KEYWORDS = [
  'female', 'zira', 'samantha', 'victoria', 'karen', 'fiona', 'veena',
  'jenny', 'aria', 'siri', 'catherine', 'heather', 'monica', 'paulina',
  'amélie', 'anna', 'lucia', 'meijia', 'sin-ji', 'kyoko', 'yuri', 'hiroda',
  'zoe', 'claire', 'julie', 'hortense', 'helena', 'laura', 'sara', 'alva',
  'yelda', 'google uk english female', 'google us english', 'natural', 'online'
];

export function isFemaleVoice(voice) {
  if (!voice || !voice.name) return false;
  const nameLower = voice.name.toLowerCase();
  return FEMALE_KEYWORDS.some((kw) => nameLower.includes(kw));
}

export function findBestFemaleVoice(voices, targetLang) {
  if (!voices || voices.length === 0) return null;

  const langVoices = targetLang && targetLang !== 'auto'
    ? voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang.toLowerCase()))
    : voices;

  const searchPool = langVoices.length > 0 ? langVoices : voices;

  // 1. Look for explicit female keyword
  const explicitFemale = searchPool.find(isFemaleVoice);
  if (explicitFemale) return explicitFemale;

  // 2. Fallback to first voice in matching language pool
  return searchPool[0] || voices[0];
}

export function speakText(text, targetLang, voiceSettings, onEnd, onError) {
  if (!('speechSynthesis' in window) || !text) return null;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  let voiceToUse = null;
  if (voiceSettings?.voiceURI) {
    voiceToUse = voices.find((v) => v.voiceURI === voiceSettings.voiceURI);
  }

  // If no voice explicitly selected or invalid, pick the best female voice for target language
  if (!voiceToUse) {
    voiceToUse = findBestFemaleVoice(voices, targetLang);
  }

  if (voiceToUse) {
    utterance.voice = voiceToUse;
  }

  utterance.rate = voiceSettings?.rate || 1.0;
  // Default pitch 1.1 for clear feminine tone
  utterance.pitch = voiceSettings?.pitch || 1.1;
  utterance.volume = voiceSettings?.volume || 1.0;

  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
}
