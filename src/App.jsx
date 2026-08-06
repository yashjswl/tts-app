import React, { useState, useEffect, useCallback } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import ConversationView from './components/ConversationView';
import SettingsModal from './components/SettingsModal';
import { useHybridSpeech } from './hooks/useHybridSpeech';
import './index.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [sarvamApiKey, setSarvamApiKey] = useState('');
  const [language, setLanguage] = useState('auto');
  const [messages, setMessages] = useState([]);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('deepgramLanguage');
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const saveSettings = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('deepgramLanguage', newLang);
  };

  const onFinalTranscript = useCallback((text) => {
    if (text.trim()) {
      setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender: 'B', text }]);
    }
  }, []);

  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    speak
  } = useHybridSpeech(apiKey, sarvamApiKey, language, onFinalTranscript);

  const handleSendText = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), sender, text }]);
    speak(text);
  };

  return (
    <div className="split-screen">
      {/* Top Half */}
      <ConversationView 
        isReversed={true}
        messages={messages}
        myRole={isFlipped ? "A" : "B"}
        interimTranscript={interimTranscript}
        isListening={isListening}
        onStartListen={startListening}
        onStopListen={stopListening}
        onSendText={handleSendText}
      />

      {/* Bottom Half */}
      <ConversationView 
        isReversed={false}
        messages={messages}
        myRole={isFlipped ? "B" : "A"}
        interimTranscript={interimTranscript}
        isListening={isListening}
        onStartListen={startListening}
        onStopListen={stopListening}
        onSendText={handleSendText}
      />

      {/* Middle Controls Container */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '0',
        right: '0',
        transform: 'translateY(-50%)',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        <button 
          className="neu-button circle"
          style={{
            background: 'var(--bg-color)',
            boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
            pointerEvents: 'auto'
          }}
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Settings size={20} />
        </button>

        <button 
          className="neu-button circle"
          style={{
            background: 'var(--bg-color)',
            boxShadow: '4px 4px 8px var(--shadow-dark), -4px -4px 8px var(--shadow-light)',
            pointerEvents: 'auto'
          }}
          onClick={() => setIsFlipped(!isFlipped)}
          title="Flip Views"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)}
          saveSettings={saveSettings}
          initialLang={language}
          onClearChat={() => setMessages([])}
        />
      )}
    </div>
  );
}

export default App;
