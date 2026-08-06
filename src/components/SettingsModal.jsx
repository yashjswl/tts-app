import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect (All Languages)' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hi-Latn', name: 'Hinglish' },
  { code: 'bn', name: 'Bengali' },
  { code: 'kn', name: 'Kannada' },
  { code: 'mr', name: 'Marathi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ur', name: 'Urdu' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'as-IN', name: 'Assamese' },
  { code: 'brx-IN', name: 'Bodo' },
  { code: 'doi-IN', name: 'Dogri' },
  { code: 'ks-IN', name: 'Kashmiri' },
  { code: 'kok-IN', name: 'Konkani' },
  { code: 'mai-IN', name: 'Maithili' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mni-IN', name: 'Manipuri' },
  { code: 'ne-IN', name: 'Nepali' },
  { code: 'or-IN', name: 'Odia' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'sa-IN', name: 'Sanskrit' },
  { code: 'sat-IN', name: 'Santali' },
  { code: 'sd-IN', name: 'Sindhi' }
];

export default function SettingsModal({ onClose, saveSettings, initialLang, onClearChat }) {
  const [language, setLanguage] = useState(initialLang || 'auto');

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    saveSettings(newLang);
  };

  return (
    <div className="modal-overlay">
      <div className="neu-panel modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onClearChat ? (
            <button className="neu-button circle" onClick={() => { onClearChat(); onClose(); }} style={{ width: '40px', height: '40px', color: 'var(--danger-color)' }} title="Clear Chat">
              <Trash2 size={18} />
            </button>
          ) : <div style={{ width: '40px' }} />}
          
          <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>Settings</h2>
          
          <button className="neu-button circle" onClick={onClose} style={{ width: '40px', height: '40px' }} title="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Communication Language</label>
          <select 
            className="neu-input" 
            value={language}
            onChange={handleLanguageChange}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}
