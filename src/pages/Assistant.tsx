import { PlusCircle, Clock, Sparkles, User, Bot, Share2, MoreVertical, MapPin, Paperclip, Mic, Send, Globe, ExternalLink, Wand2, Search, Info, Zap, Key, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/context';
import { TavilySearchResult } from '../lib/services';
import { cn } from '../lib/utils';
import ApiSettingsModal from '../components/ApiSettingsModal';
import { getGroqApiKey } from '../lib/apiKeyStorage';

export default function Assistant() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [webResults, setWebResults] = useState<TavilySearchResult[]>([]);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [hasGroqKey, setHasGroqKey] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkKey = () => {
    setHasGroqKey(Boolean(getGroqApiKey()));
  };

  useEffect(() => {
    checkKey();
    window.addEventListener('tripverse_keys_updated', checkKey);
    return () => window.removeEventListener('tripverse_keys_updated', checkKey);
  }, []);

  // Extract destination from a message string
  const extractDestination = (text: string): string | null => {
    const patterns = [
      /(?:plan|trip|travel|visit|go to|itinerary for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
      /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:trip|travel|itinerary|vacation|holiday)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handlePlanFromChat = async (userMessage: string) => {
    const dest = extractDestination(userMessage);
    if (!dest) return;
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await actions.createTrip(`${dest} Adventure`, dest, today, endDate, 0);
    navigate(`/planner?destination=${encodeURIComponent(dest)}&autoplan=true`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages]);

  const handleSendMessage = async () => {
    const userMessage = message.trim();
    if (!userMessage || userMessage.length < 2 || isTyping || state.isLoading) {
      return;
    }

    if (!hasGroqKey) {
      setIsApiModalOpen(true);
      return;
    }

    setMessage('');
    setIsTyping(true);

    // Only fetch live web context for informational travel queries (avoids unnecessary search API calls)
    const isInformationalQuery = userMessage.length > 8 && !/^(hi|hello|hey|help|thanks|thank you)\b/i.test(userMessage);
    if (isInformationalQuery) {
      actions.searchWeb(userMessage).then(results => {
        setWebResults(results);
      }).catch(() => {});
    }
    
    await actions.sendChatMessage(userMessage);
    setIsTyping(false);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const promptIdeas = [
    { title: "Romantic Getaway", text: "Plan a romantic 3-day getaway in Paris with a focus on art galleries." },
    { title: "Hidden Gems", text: "What are the best hidden gems for surfing in Portugal?" },
    { title: "Japan Explorer", text: "Create a 7-day itinerary for Japan with scenic shrines and local cuisine" },
    { title: "Family Fun", text: "Show me family-friendly destinations in Europe for summer" }
  ];

  return (
    <>
      <main className="pt-24 h-[calc(100vh-1rem)] flex px-4 md:px-12 pb-4 md:pb-8 gap-8 max-w-screen-2xl mx-auto overflow-hidden bg-slate-50">
        {/* Sidebar */}
        <aside className="w-80 flex flex-col gap-6 h-full overflow-hidden hidden lg:flex shrink-0">
          <button 
            onClick={() => {
              setMessage('');
              actions.clearChat();
            }}
            className="w-full flex items-center justify-center gap-3 bg-white p-5 rounded-[2rem] shadow-premium border border-outline hover:border-primary/20 transition-all group"
          >
            <PlusCircle className="text-primary w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            <span className="font-bold text-primary">New Journey</span>
          </button>

          <div className="flex-1 bg-white rounded-[2.5rem] p-6 overflow-hidden border border-outline flex flex-col">
            <h3 className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Recent Explorations
            </h3>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {state.chatMessages.filter(msg => msg.role === 'user').slice(-5).map((msg) => (
                <div key={msg.id} className="p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all border border-transparent hover:border-outline group">
                  <p className="text-sm font-bold text-primary truncate group-hover:text-secondary transition-colors">{msg.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Web Insights Panel */}
          <AnimatePresence>
            {webResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary text-white rounded-[2.5rem] p-6 shadow-2xl"
              >
                <h3 className="font-headline text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-6 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Live Web Context
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar">
                  {webResults.slice(0, 3).map((result, index) => (
                    <a
                      key={index}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 group"
                    >
                      <p className="text-xs font-bold line-clamp-1 mb-1 group-hover:text-secondary transition-colors">{result.title}</p>
                      <p className="text-[10px] text-blue-100/70 line-clamp-2">{result.content}</p>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col bg-white rounded-[3rem] shadow-premium overflow-hidden border border-outline relative">
          {/* Header */}
          <div className="px-8 py-5 border-b border-outline flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-lg">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-xl leading-none mb-1">TripVerse AI</h2>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", hasGroqKey ? "bg-emerald-500 animate-pulse" : "bg-amber-500")}></span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {isTyping ? 'Thinking...' : hasGroqKey ? 'Ready to Plan' : 'Key Needed'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsApiModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Configure Groq and Tavily API Keys"
              >
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>API Settings</span>
              </button>
            </div>
          </div>

          {/* Missing Groq Key Banner */}
          {!hasGroqKey && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between flex-wrap gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Enter your free <strong>Groq API Key</strong> to unlock unlimited AI travel planning.</span>
              </div>
              <button
                onClick={() => setIsApiModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors"
              >
                Add Free Key
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
            {state.chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8">
                <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-primary">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-headline font-bold">How can I help you <br/><span className="text-gradient">explore today?</span></h3>
                <div className="grid grid-cols-2 gap-4 w-full">
                  {promptIdeas.map((idea, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setMessage(idea.text)}
                      className="p-5 bg-slate-50 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white transition-all text-left group"
                    >
                      <p className="text-xs font-black text-slate-400 uppercase mb-2 group-hover:text-primary transition-colors">{idea.title}</p>
                      <p className="text-sm font-bold text-slate-600 line-clamp-2">"{idea.text}"</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.chatMessages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start gap-4 max-w-4xl",
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                <div className={cn(
                  "w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center shadow-md",
                  msg.role === 'user' ? 'bg-primary' : 'bg-slate-100'
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-primary" />}
                </div>
                <div className={cn(
                  "p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-700 rounded-tl-none border border-outline'
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.role === 'assistant' && (() => {
                    const dest = extractDestination(msg.content);
                    if (!dest) return null;
                    return (
                      <button
                        onClick={() => handlePlanFromChat(msg.content)}
                        className="mt-6 flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-full text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all border border-outline"
                      >
                        <Zap className="w-4 h-4 text-secondary fill-secondary" />
                        Plan {dest} Journey
                      </button>
                    );
                  })()}
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-primary shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-6 rounded-[2rem] bg-slate-50 rounded-tl-none border border-outline flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-6 md:p-8 bg-white/80 backdrop-blur-md border-t border-outline">
            <div className="relative flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask anything or describe your dream destination..."
                className="w-full bg-slate-50 border-none rounded-full px-8 py-5 pr-28 text-sm md:text-base focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
              />
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || state.isLoading}
                  className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-lg hover:shadow-primary/30"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 px-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Direct Client AI • Keys kept strictly in your local browser storage
              </span>
              <button 
                onClick={() => setIsApiModalOpen(true)}
                className="text-primary font-bold hover:underline"
              >
                Manage Keys
              </button>
            </div>
          </div>
        </section>
      </main>

      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </>
  );
}
