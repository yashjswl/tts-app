import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Speech, EarOff } from 'lucide-react';

export default function ConversationView({ 
  isReversed, 
  messages, 
  myRole, 
  interimTranscript, 
  isListening,
  onStartListen,
  onStopListen,
  onSendText
}) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendText(inputText, myRole);
      setInputText('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  return (
    <div className={`half-screen ${isReversed ? 'rotated' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--text-primary)', opacity: 0.8 }}>
        {myRole === 'A' ? <EarOff size={24} /> : <Speech size={24} />}
      </div>
      
      <div className="chat-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender === myRole ? 'sent' : 'received'}`}>
            {msg.text}
          </div>
        ))}
        {isListening && myRole === 'B' && interimTranscript && (
          <div className="message sent interim">{interimTranscript}</div>
        )}
        {isListening && myRole === 'A' && interimTranscript && (
          <div className="message received interim">{interimTranscript}</div>
        )}
        <div ref={chatEndRef} />
      </div>
      
      <div className="input-area" style={myRole === 'B' ? { justifyContent: 'center', padding: '20px' } : {}}>
        {myRole === 'A' ? (
          <>
            <input 
              className="neu-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="neu-button circle" onClick={handleSend} disabled={!inputText.trim()} title="Send & Speak">
              <Send size={20} />
            </button>
          </>
        ) : (
          <button 
            className={`neu-button circle ${isListening ? 'active' : ''}`} 
            onClick={isListening ? onStopListen : onStartListen}
            title="Listen"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
