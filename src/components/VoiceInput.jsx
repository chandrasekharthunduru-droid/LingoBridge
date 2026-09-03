import React, { useState, useEffect, useRef } from 'react';
import { createSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechService';

export default function VoiceInput({ onTranscript, sourceLang = 'en', onShowToast }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSpeechRecognitionSupported()) {
      if (onShowToast) {
        onShowToast('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'warning');
      }
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const langCode = sourceLang === 'auto' ? 'en-US' : `${sourceLang}-${sourceLang.toUpperCase()}`;
    const recognition = createSpeechRecognition({
      lang: langCode,
      onResult: (transcript, isFinal) => {
        onTranscript(transcript);
        if (isFinal) {
          setIsListening(false);
        }
      },
      onError: (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
        if (onShowToast) {
          onShowToast(`Voice input error: ${err}`, 'danger');
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  return (
    <button
      type="button"
      className={`icon-btn ${isListening ? 'listening-active' : ''}`}
      onClick={toggleListening}
      title={isListening ? 'Stop recording' : 'Start voice input'}
      aria-label="Voice input"
    >
      {isListening ? (
        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 Listening...</span>
      ) : (
        <span>🎤 Voice Input</span>
      )}
    </button>
  );
}
