import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  Globe,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  MapPin,
  Thermometer,
  Shield,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const QUICKPROMPTS = [
  { label: '🌧️ Flood safety tips', prompt: 'What should I do during a flood in Tamil Nadu?' },
  { label: '🚗 Travel advisory', prompt: 'Is it safe to travel during cyclone season in Chennai?' },
  { label: '🏥 Nearest shelter', prompt: 'How can I find the nearest relief shelter during a disaster?' },
  { label: '📞 Emergency contacts', prompt: 'What are the emergency helpline numbers in Tamil Nadu?' },
];

const SYSTEM_PROMPT = `You are SafeRoute AI Assistant, a disaster safety and navigation expert for Tamil Nadu, India.
You provide accurate, helpful guidance about:
- Flood safety, cyclone preparedness, and disaster response
- Safe travel routes and road conditions
- Emergency procedures and evacuation protocols
- Weather conditions and forecasts for Tamil Nadu
- Local relief centers, shelters, and emergency services
- Tourism safety tips for visitors to Tamil Nadu

You are concise, caring, and focused on safety. You respond in the language the user writes in.
If asked in Tamil, respond in Tamil. If asked in English, respond in English.
Always prioritize safety information. If unsure, recommend calling emergency services (108 for medical, 1070 for disaster).
Keep responses brief (2-4 sentences) unless detailed guidance is specifically requested.`;

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content: "Hello! I'm your SafeRoute AI assistant. 🛡️ Ask me anything about disaster safety, weather conditions, safe travel routes, or emergency procedures in Tamil Nadu.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOutEnabled, setIsVoiceOutEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !isVoiceOutEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_~]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your message.');
      return;
    }
    try {
      if (isListening) {
        setIsListening(false);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const getGeminiKey = () => localStorage.getItem('saferoute_GEMINI_API_KEY') || '';

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const apiKey = getGeminiKey();

    if (!apiKey) {
      // Provide a helpful direct response without requiring settings
      const fallbackResponses: Record<string, string> = {
        flood: '🌊 Flood safety protocol: Move to higher ground immediately. Avoid low subways. Emergency dispatch 108 (Medical) & 1070 (Disaster).',
        cyclone: '🌀 Cyclone protocol: Stay indoors, away from windows. Stock drinkable water. Tamil Nadu SDMA hotline active on 1070.',
        shelter: '🏠 Relief shelters: Active cyclone relief camps and high-ground shelters are accessible on the Relief Centers tab.',
        emergency: '📞 Tamil Nadu Helplines: 108 (Ambulance), 112 (Police), 101 (Fire), 1070 (Disaster Helpline).',
        default: '🛡️ SafeRoute AI at your service. For medical aid dial 108, for disaster relief dial 1070, police dial 112. How can I assist your route or emergency safety?',
      };

      const lower = text.toLowerCase();
      let response = fallbackResponses.default;
      if (lower.includes('flood') || lower.includes('rain') || lower.includes('water')) {
        response = fallbackResponses.flood;
      } else if (lower.includes('cyclone') || lower.includes('storm') || lower.includes('wind')) {
        response = fallbackResponses.cyclone;
      } else if (lower.includes('shelter') || lower.includes('relief') || lower.includes('camp')) {
        response = fallbackResponses.shelter;
      } else if (lower.includes('emergency') || lower.includes('number') || lower.includes('helpline') || lower.includes('call')) {
        response = fallbackResponses.emergency;
      }

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'bot', content: response, timestamp: new Date() }]);
        setIsLoading(false);
        speakText(response);
      }, 500);
      return;
    }

    try {
      const historyContents = messages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              ...historyContents,
              { role: 'user', parts: [{ text: text.trim() }] },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 400,
              topP: 0.9,
            },
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      const botText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'I apologize, I could not generate a response. Please call 1070 for disaster assistance.';

      setMessages((prev) => [...prev, { role: 'bot', content: botText, timestamp: new Date() }]);
      speakText(botText);
    } catch (err) {
      console.error('Gemini API Error:', err);
      const errText = '⚠️ Emergency contact 108 (Medical) & 1070 (Disaster Helpline).';
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          content: errText,
          timestamp: new Date(),
        },
      ]);
      speakText(errText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl cursor-pointer transition-all hover:scale-110 hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
          }}
          title="SafeRoute AI Assistant"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white"
            style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
          />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] flex flex-col animate-slide-up"
          style={{
            height: 'min(560px, calc(100vh - 6rem))',
            borderRadius: '1.5rem',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 32px 80px rgba(14,165,233,0.2), 0 8px 24px rgba(0,0,0,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="shrink-0 px-5 py-4 flex items-center justify-between"
            style={{
              borderBottom: '1px solid rgba(14,165,233,0.1)',
              borderRadius: '1.5rem 1.5rem 0 0',
              background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(99,102,241,0.05))',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  SafeRoute AI
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVoiceOutEnabled(!isVoiceOutEnabled)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isVoiceOutEnabled ? 'text-sky-600 bg-sky-50' : 'text-slate-400 hover:bg-slate-100'
                }`}
                title={isVoiceOutEnabled ? 'Voice output ON' : 'Voice output OFF'}
              >
                {isVoiceOutEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                className="p-1.5 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer text-xs font-semibold text-sky-600"
                title="Switch language"
              >
                {language === 'en' ? 'EN' : 'தமிழ்'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}>
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="chat-msg-bot flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                  <span className="text-slate-500 text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICKPROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  className="text-[11px] px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-[1.03]"
                  style={{
                    background: 'rgba(14,165,233,0.06)',
                    border: '1px solid rgba(14,165,233,0.15)',
                    color: '#0284c7',
                    fontWeight: 600,
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            className="shrink-0 px-4 py-3"
            style={{ borderTop: '1px solid rgba(14,165,233,0.08)' }}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={isListening ? 'Listening... Speak now' : 'Click to Speak (Voice In)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening...' : language === 'en' ? 'Ask about safety, weather, routes...' : 'பாதுகாப்பு, வானிலை பற்றி கேளுங்கள்...'}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1.5px solid rgba(203,213,225,0.5)',
                }}
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all disabled:opacity-30"
                style={{
                  background: input.trim() ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'rgba(203,213,225,0.3)',
                  color: input.trim() ? 'white' : '#94a3b8',
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
