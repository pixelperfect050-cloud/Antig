import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/funkiai.css';

const FunkiAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Namaste! I am FunkiAI, your society assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'https://society-backend-b004.onrender.com';

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/ai/chat`, { message: text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const aiMsg = { role: 'ai', content: res.data.response };
      setMessages(prev => [...prev, aiMsg]);
      speak(res.data.response);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="funkiai-container">
      {/* TRIGGER BUTTON */}
      <button className="funkiai-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>

      {/* CHAT WINDOW */}
      <div className={`funkiai-window ${isOpen ? '' : 'hidden'}`}>
        <div className="funkiai-header">
          <div className="funkiai-avatar">🤖</div>
          <div className="funkiai-title">
            <h3>FunkiAI</h3>
            <p>{isTyping ? 'Typing...' : 'Online'}</p>
          </div>
          <button className="funkiai-close" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="funkiai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`funkiai-msg funkiai-msg--${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="funkiai-msg funkiai-msg--ai">
              <div className="voice-wave">
                <span style={{ animationDelay: '0.1s' }}></span>
                <span style={{ animationDelay: '0.2s' }}></span>
                <span style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="funkiai-input-area">
          <div className="funkiai-input-wrap">
            <input 
              type="text" 
              placeholder="Ask anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className={`funkiai-btn funkiai-btn--mic ${isListening ? 'active' : ''}`} onClick={toggleVoice}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            <button className="funkiai-btn" onClick={() => handleSend()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunkiAI;
