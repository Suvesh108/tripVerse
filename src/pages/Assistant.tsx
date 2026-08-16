import { PlusCircle, Clock, Sparkles, User, Bot, Share2, MoreVertical, MapPin, Paperclip, Mic, Send, Globe, ExternalLink, Wand2, Search, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/context';
import { TavilySearchResult } from '../lib/services';
import { cn } from '../lib/utils';

export default function Assistant() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [webResults, setWebResults] = useState<TavilySearchResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const budgetMatch = userMessage.match(/(₹|Rs\.?|INR)\s*([\d,]+)/i);
    const budget = budgetMatch ? parseInt(budgetMatch[2].replace(/,/g, '')) : 50000;
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await actions.createTrip(`${dest} Adventure`, dest, today, endDate, budget);
    navigate(`/planner?destination=${encodeURIComponent(dest)}&budget=${budget}&autoplan=true`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.chatMessages]);

  const handleSendMessage = async () => {
    if (message.trim() && !state.isLoading) {
      const userMessage = message.trim();
      setMessage('');
      setIsTyping(true);

      // Fetch web results in parallel
      actions.searchWeb(userMessage).then(results => {
        setWebResults(results);
      }).catch(() => {});
      
      await actions.sendChatMessage(userMessage);
      setIsTyping(false);
    }
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
    { title: "Japan Explorer", text: "Create a 7-day itinerary for Japan with a budget of ₹2,50,000" },
    { title: "Family Fun", text: "Show me family-friendly destinations in Europe for summer" }
  ];

  return (
    <main className="pt-24 h-[calc(100vh-1rem)] flex px-4 md:px-12 pb-4 md:pb-8 gap-8 max-w-screen-2xl mx-auto overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-80 flex flex-col gap-6 h-full overflow-hidden hidden lg:flex shrink-0">
        <button 
          onClick={() => setMessage('')}
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
        <div className="px-8 py-5 border-b border-outline flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl leading-none mb-1">TripVerse AI</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isTyping ? 'Thinking...' : 'Ready to Plan'}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><Share2 className="w-5 h-5" /></button>
            <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

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
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none border border-outline">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-8 bg-white">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-center bg-slate-100 rounded-[2rem] px-8 py-4 border-2 border-transparent focus-within:border-primary/10 transition-all shadow-inner">
              <Search className="text-slate-400 w-5 h-5 mr-4 shrink-0" />
              <input 
                type="text" 
                placeholder="Ask me to plan your next escape..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 font-medium"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={state.isLoading}
              />
              <div className="flex items-center gap-4 ml-4">
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><Paperclip className="w-5 h-5" /></button>
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || state.isLoading}
                  className="bg-primary text-white p-3 rounded-2xl shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-[0.2em]">Powered by Groq Llama 3 & Tavily Search</p>
          </div>
        </div>
      </section>
    </main>
  );
}

