import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/funkiai.css';
import { API_BASE } from '../lib/apiConfig';

const PUBLIC_QUICK_ACTIONS = [
  { label: '✨ Features', msg: 'What features does SocietySync offer?' },
  { label: '💰 Pricing', msg: 'What are the pricing plans?' },
  { label: '📅 Book Demo', msg: 'I want to book a demo' },
  { label: '📱 APK Download', msg: 'Is there an Android app available?' },
  { label: '🏠 Setup Process', msg: 'How do I set up my society on SocietySync?' },
  { label: '📧 Contact', msg: 'How can I contact support?' },
];

const PublicFunkiAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Namaste! 👋\n\nMain **FunkiAI** hoon — SocietySync ka smart assistant!\n\nMujhse poochho:\n• 📋 App features\n• 💰 Pricing plans\n• 📅 Demo booking\n• 🏠 Society setup\n• 📱 APK download\n\nKaise help karun?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [pulseAnimation, setPulseAnimation] = useState(true);
  const [language, setLanguage] = useState('hindi');
  const [demoState, setDemoState] = useState(null); // Tracks demo booking flow
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Stop pulse
  useEffect(() => {
    const timer = setTimeout(() => setPulseAnimation(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        if (event.results[0].isFinal) {
          handleSend(transcript);
          setIsListening(false);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      setInput('');
      recognitionRef.current.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
      try { recognitionRef.current.start(); } catch (e) { setIsListening(false); }
    }
  }, [isListening, language]);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[•\-]\s/g, '')
      .replace(/\n+/g, '. ')
      // Convert phone numbers (7+ digits) to spaced digits for TTS
      .replace(/\b(\d{7,})\b/g, (match) => match.split('').join(' '))
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const targetLang = language === 'hindi' ? 'hi' : 'en-IN';
    const voice = voices.find(v => v.lang.includes(targetLang)) || voices.find(v => v.lang.includes('en-IN'));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // Demo booking flow handler
  const handleDemoFlow = useCallback(async (text) => {
    if (!demoState) return false;

    const state = { ...demoState };
    const step = state.step;

    if (step === 'name') {
      state.name = text;
      state.step = 'mobile';
      setDemoState(state);
      return "Shukriya! 📝 Ab apna **mobile number** batao:";
    } else if (step === 'mobile') {
      state.mobile = text;
      state.step = 'society';
      setDemoState(state);
      return "👍 Ab apni **society ka naam** batao:";
    } else if (step === 'society') {
      state.societyName = text;
      state.step = 'flats';
      setDemoState(state);
      return "🏢 Society mein **kitne flats** hain?";
    } else if (step === 'flats') {
      state.numberOfFlats = parseInt(text) || 0;
      state.step = 'city';
      setDemoState(state);
      return "📍 Aapki **city** kya hai?";
    } else if (step === 'city') {
      state.city = text;
      state.step = 'time';
      setDemoState(state);
      return "⏰ **Preferred demo time** batao (e.g., 'Kal shaam 5 baje'):";
    } else if (step === 'time') {
      state.preferredDemoTime = text;
      setDemoState(null);

      // Save lead
      try {
        await fetch(`${API_BASE}/api/ai/demo-lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
        return `🎉 **Demo booked successfully!**\n\n📋 Details:\n• Name: **${state.name}**\n• Mobile: **${state.mobile}**\n• Society: **${state.societyName}**\n• Flats: **${state.numberOfFlats}**\n• City: **${state.city}**\n• Time: **${state.preferredDemoTime}**\n\nHumari team aapko jaldi contact karegi! 🤝`;
      } catch (err) {
        return `Demo details mil gayi! 🎉 Humari team aapko **${state.mobile}** par contact karegi. Thank you! 🤝`;
      }
    }
    return false;
  }, [demoState]);

  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setShowQuickActions(false);

    // Check demo booking trigger
    const lowerText = text.toLowerCase();
    if (!demoState && (lowerText.includes('demo') || lowerText.includes('book'))) {
      setDemoState({ step: 'name' });
      const aiMsg = {
        role: 'ai',
        content: "Bahut badhiya! 🎯 Demo book karte hain!\n\nSabse pehle, apna **naam** batao:",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      speak(aiMsg.content);
      setIsTyping(false);
      return;
    }

    // Handle demo flow steps
    if (demoState) {
      const demoResponse = await handleDemoFlow(text);
      if (demoResponse) {
        const aiMsg = { role: 'ai', content: demoResponse, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        speak(demoResponse);
        setIsTyping(false);
        return;
      }
    }

    // Regular public chat
    try {
      const res = await fetch(`${API_BASE}/api/ai/public-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          conversationHistory: messages.slice(-6)
        })
      });

      const data = await res.json();
      const aiMsg = { role: 'ai', content: data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speak(data.response);
    } catch (error) {
      const fallback = language === 'hindi'
        ? "Abhi connection mein thoda issue hai. Kripya thodi der mein try karo ya funkariya.shop@gmail.com par email karo! 📧"
        : "Having some connection issues. Please try again or email us at funkariya.shop@gmail.com! 📧";
      setMessages(prev => [...prev, { role: 'ai', content: fallback, timestamp: new Date(), isError: true }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, language, messages, demoState, handleDemoFlow, speak]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      content: `Chat cleared! 🧹 Kuch aur help chahiye?`,
      timestamp: new Date()
    }]);
    setShowQuickActions(true);
    setDemoState(null);
  };

  return (
    <div className="funkiai-container funkiai-container--public">
      {/* ═══ FLOATING TRIGGER ═══ */}
      <button
        className={`funkiai-trigger ${isOpen ? 'funkiai-trigger--active' : ''} ${pulseAnimation ? 'funkiai-trigger--pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close FunkiAI' : 'Open FunkiAI'}
        id="public-funkiai-trigger"
      >
        <div className="funkiai-trigger__glow" />
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            <span className="funkiai-trigger__badge">AI</span>
          </>
        )}
      </button>

      {/* ═══ CHAT WINDOW ═══ */}
      <div className={`funkiai-window ${isOpen ? 'funkiai-window--open' : ''}`}>
        {/* Header */}
        <div className="funkiai-header funkiai-header--public">
          <div className="funkiai-header__left">
            <div className="funkiai-avatar">
              <div className="funkiai-avatar__inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1h-1a2 2 0 0 0 0 4h1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1h1a2 2 0 0 0 0-4H3v-1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="13" r="1" fill="currentColor"/>
                  <circle cx="15" cy="13" r="1" fill="currentColor"/>
                  <path d="M9 17c1.5 1 4.5 1 6 0" strokeLinecap="round"/>
                </svg>
              </div>
              <span className={`funkiai-avatar__status ${isTyping ? 'funkiai-avatar__status--typing' : ''}`} />
            </div>
            <div className="funkiai-header__info">
              <h3>FunkiAI <span className="funkiai-header__public-badge">Sales</span></h3>
              <p>{isTyping ? 'Thinking...' : isSpeaking ? '🔊 Speaking...' : 'Online • Ask me anything!'}</p>
            </div>
            <select
              className="funkiai-lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select language"
            >
              <option value="hindi">हिंदी</option>
              <option value="english">English</option>
            </select>
          </div>
          <div className="funkiai-header__actions">
            {isSpeaking && (
              <button className="funkiai-header__btn" onClick={stopSpeaking} title="Stop speaking">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              </button>
            )}
            <button className="funkiai-header__btn" onClick={clearChat} title="Clear chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
            <button className="funkiai-header__btn funkiai-header__btn--close" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="funkiai-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`funkiai-msg funkiai-msg--${msg.role} ${msg.isError ? 'funkiai-msg--error' : ''}`}>
              {msg.role === 'ai' && (
                <div className="funkiai-msg__avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1h-1a2 2 0 0 0 0 4h1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1h1a2 2 0 0 0 0-4H3v-1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="funkiai-msg__bubble">
                <div className="funkiai-msg__text" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                <span className="funkiai-msg__time">{formatTime(msg.timestamp)}</span>
              </div>
              {msg.role === 'ai' && !msg.isError && (
                <button className="funkiai-msg__speak" onClick={() => speak(msg.content)} title="Listen">🔊</button>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="funkiai-msg funkiai-msg--ai funkiai-msg--typing">
              <div className="funkiai-msg__avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1h-1a2 2 0 0 0 0 4h1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1h1a2 2 0 0 0 0-4H3v-1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="funkiai-msg__bubble">
                <div className="funkiai-typing-dots"><span /><span /><span /></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {showQuickActions && messages.length <= 1 && (
          <div className="funkiai-quick-actions">
            {PUBLIC_QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                className="funkiai-quick-btn"
                onClick={() => handleSend(action.msg)}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="funkiai-input-area">
          {isListening && (
            <div className="funkiai-listening">
              <div className="funkiai-listening__waves">
                {[...Array(5)].map((_, i) => <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
              <span className="funkiai-listening__text">Listening...</span>
            </div>
          )}

          <div className="funkiai-input-wrap">
            <input
              ref={inputRef}
              type="text"
              placeholder={isListening ? 'Listening...' : demoState ? `Enter your ${demoState.step}...` : 'Ask about SocietySync...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isListening}
              id="public-funkiai-input"
              autoComplete="off"
            />
            <button
              className={`funkiai-btn funkiai-btn--mic ${isListening ? 'funkiai-btn--mic-active' : ''}`}
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
              id="public-funkiai-mic"
            >
              {isListening ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <rect x="4" y="4" width="16" height="16" rx="2"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
            <button
              className="funkiai-btn funkiai-btn--send"
              onClick={() => handleSend()}
              disabled={!input.trim() && !isListening}
              title="Send"
              id="public-funkiai-send"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
              </svg>
            </button>
          </div>

          <div className="funkiai-footer">
            Powered by <strong>FunkiAI</strong> • Gemini
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFunkiAI;
