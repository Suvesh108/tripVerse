import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, 
  ExternalLink, Trash2, RefreshCw, X, Sparkles, Globe, Coins, Lock 
} from 'lucide-react';
import { 
  getStoredApiKeys, saveStoredApiKeys, clearStoredApiKeys, 
  testGroqKey, testTavilyKey, testExchangeRateKey, UserApiKeys 
} from '../lib/apiKeyStorage';
import { cn } from '../lib/utils';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [keys, setKeys] = useState<UserApiKeys>({
    groqApiKey: '',
    tavilyApiKey: '',
    exchangeRateApiKey: '',
  });

  const [showGroq, setShowGroq] = useState(false);
  const [showTavily, setShowTavily] = useState(false);
  const [showExchange, setShowExchange] = useState(false);

  const [testingGroq, setTestingGroq] = useState(false);
  const [testingTavily, setTestingTavily] = useState(false);
  const [testingExchange, setTestingExchange] = useState(false);

  const [groqStatus, setGroqStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [tavilyStatus, setTavilyStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [exchangeStatus, setExchangeStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKeys();
      setKeys(stored);
      setGroqStatus(null);
      setTavilyStatus(null);
      setExchangeStatus(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    saveStoredApiKeys(keys);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to remove all saved API keys from your browser?')) {
      clearStoredApiKeys();
      setKeys({
        groqApiKey: '',
        tavilyApiKey: '',
        exchangeRateApiKey: '',
      });
      setGroqStatus(null);
      setTavilyStatus(null);
      setExchangeStatus(null);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
    setGroqStatus(null);
    const result = await testGroqKey(keys.groqApiKey);
    setGroqStatus(result);
    setTestingGroq(false);
  };

  const handleTestTavily = async () => {
    setTestingTavily(true);
    setTavilyStatus(null);
    const result = await testTavilyKey(keys.tavilyApiKey);
    setTavilyStatus(result);
    setTestingTavily(false);
  };

  const handleTestExchange = async () => {
    setTestingExchange(true);
    setExchangeStatus(null);
    const result = await testExchangeRateKey(keys.exchangeRateApiKey);
    setExchangeStatus(result);
    setTestingExchange(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8"
          >
            {/* Modal Header */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 bg-primary/20 rounded-xl text-primary border border-primary/30">
                    <Key className="w-5 h-5" />
                  </span>
                  <span className="text-xs uppercase tracking-widest text-primary font-bold">Client-Side BYOK Settings</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-headline font-bold">API Key Manager</h2>
                <p className="text-slate-300 text-sm mt-1">
                  Connect your personal API keys for unlimited AI itineraries, real-time web search, and currency rates.
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Privacy & Key Requirement Shield Notice */}
            <div className="bg-emerald-50/90 border-b border-emerald-100 px-6 py-3.5 flex items-start gap-3 text-emerald-900 text-xs md:text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  <strong>Only 3 API Keys Needed:</strong> TripVerse requires just <strong>3 API keys</strong> (Groq AI, Tavily Search, and ExchangeRate) to power all features. All other services (Maps, Weather, Wikipedia) are 100% free and public out-of-the-box.
                </p>
                <p className="text-[11px] text-emerald-700">
                  🔐 <strong>100% Client-Side Privacy:</strong> All keys are saved strictly in your browser's <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-emerald-800">localStorage</code> and never sent to any backend proxy or third party.
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-6 max-h-[62vh] overflow-y-auto">
              {/* 1. Groq AI Key */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 font-bold text-slate-800 text-sm md:text-base">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Groq Cloud API Key
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase">
                      Recommended
                    </span>
                  </label>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Free Groq Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  Powers the ultra-fast AI Travel Assistant, day-by-day itineraries, and destination history insights.
                </p>

                <div className="relative">
                  <input
                    type={showGroq ? 'text' : 'password'}
                    value={keys.groqApiKey}
                    onChange={(e) => {
                      setKeys({ ...keys, groqApiKey: e.target.value });
                      setGroqStatus(null);
                    }}
                    placeholder="gsk_..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-20 text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                      title={showGroq ? 'Hide Key' : 'Show Key'}
                    >
                      {showGroq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestGroq}
                      disabled={testingGroq || !keys.groqApiKey.trim()}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 transition-colors flex items-center gap-1"
                    >
                      {testingGroq ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                    </button>
                  </div>
                </div>

                {groqStatus && (
                  <div className={cn(
                    "text-xs px-3 py-2 rounded-lg flex items-center gap-2",
                    groqStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  )}>
                    {groqStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{groqStatus.message}</span>
                  </div>
                )}
              </div>

              {/* 2. Tavily Search Key */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 font-bold text-slate-800 text-sm md:text-base">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Tavily Web Search API Key
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
                      Optional
                    </span>
                  </label>
                  <a
                    href="https://tavily.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Free Tavily Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  Enriches AI travel responses with real-time web search facts and local recommendations.
                </p>

                <div className="relative">
                  <input
                    type={showTavily ? 'text' : 'password'}
                    value={keys.tavilyApiKey}
                    onChange={(e) => {
                      setKeys({ ...keys, tavilyApiKey: e.target.value });
                      setTavilyStatus(null);
                    }}
                    placeholder="tvly-..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-20 text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowTavily(!showTavily)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      {showTavily ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestTavily}
                      disabled={testingTavily || !keys.tavilyApiKey.trim()}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 transition-colors flex items-center gap-1"
                    >
                      {testingTavily ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                    </button>
                  </div>
                </div>

                {tavilyStatus && (
                  <div className={cn(
                    "text-xs px-3 py-2 rounded-lg flex items-center gap-2",
                    tavilyStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  )}>
                    {tavilyStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{tavilyStatus.message}</span>
                  </div>
                )}
              </div>

              {/* 3. ExchangeRate API Key */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 font-bold text-slate-800 text-sm md:text-base">
                    <Coins className="w-4 h-4 text-amber-500" />
                    ExchangeRate-API Key
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
                      Optional
                    </span>
                  </label>
                  <a
                    href="https://www.exchangerate-api.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Free Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time foreign currency conversions. (TripVerse automatically uses public rate fallbacks if empty).
                </p>

                <div className="relative">
                  <input
                    type={showExchange ? 'text' : 'password'}
                    value={keys.exchangeRateApiKey}
                    onChange={(e) => {
                      setKeys({ ...keys, exchangeRateApiKey: e.target.value });
                      setExchangeStatus(null);
                    }}
                    placeholder="ExchangeRate API Key..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-20 text-sm font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowExchange(!showExchange)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      {showExchange ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestExchange}
                      disabled={testingExchange || !keys.exchangeRateApiKey.trim()}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 transition-colors flex items-center gap-1"
                    >
                      {testingExchange ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                    </button>
                  </div>
                </div>

                {exchangeStatus && (
                  <div className={cn(
                    "text-xs px-3 py-2 rounded-lg flex items-center gap-2",
                    exchangeStatus.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  )}>
                    {exchangeStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span>{exchangeStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Built-in Public Services (Zero Configuration) */}
              <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Built-in Public APIs (Ready Out-of-the-Box, No Keys Needed):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="font-semibold text-slate-700 block">🗺️ OpenStreetMap</span>
                    <span className="text-emerald-600 font-medium">Free Map & POIs</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="font-semibold text-slate-700 block">🌤️ Open-Meteo</span>
                    <span className="text-emerald-600 font-medium">Free Live Weather</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="font-semibold text-slate-700 block">📖 Wikipedia API</span>
                    <span className="text-emerald-600 font-medium">Free City Summaries</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-4">
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Keys
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Saved Locally!
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Save Keys to Browser
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
