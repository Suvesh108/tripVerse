import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, 
  ExternalLink, Trash2, RefreshCw, X, Sparkles, Globe, Coins, Lock, Check 
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
  const [mounted, setMounted] = useState(false);
  const [keys, setKeys] = useState<UserApiKeys>({
    groqApiKey: '',
    tavilyApiKey: '',
    exchangeRateApiKey: '',
  });

  const [activeTab, setActiveTab] = useState<'groq' | 'all'>('groq');
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
    setMounted(true);
  }, []);

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
    }, 1000);
  };

  const handleClear = () => {
    if (confirm('Remove saved API keys from this browser?')) {
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Centered Compact Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden z-10 my-auto"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/20 text-primary rounded-2xl border border-primary/30 shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-white leading-tight">Configure API Keys</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect your free Groq AI key for unlimited AI trip itineraries.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Tab Switcher */}
            <div className="flex items-center px-6 pt-4 gap-2 border-b border-slate-800/80 bg-slate-950/40">
              <button
                onClick={() => setActiveTab('groq')}
                className={cn(
                  "pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5",
                  activeTab === 'groq'
                    ? "text-secondary border-secondary"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Groq AI (Required)
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  "pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5",
                  activeTab === 'all'
                    ? "text-sky-400 border-sky-400"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                More Keys (Optional)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              
              {/* Primary: Groq AI Key */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Groq AI API Key</span>
                    <span className="text-[9px] font-black text-rose-400 bg-rose-950/60 px-2 py-0.2 rounded-full border border-rose-800/40">
                      Required
                    </span>
                  </div>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1"
                  >
                    Get Free Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showGroq ? 'text' : 'password'}
                    value={keys.groqApiKey}
                    onChange={(e) => {
                      setKeys({ ...keys, groqApiKey: e.target.value });
                      setGroqStatus(null);
                    }}
                    placeholder="gsk_..."
                    className="w-full bg-slate-900 text-white text-xs font-mono px-4 py-2.5 pr-20 rounded-xl border border-slate-700 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-slate-600"
                    autoFocus={activeTab === 'groq'}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestGroq}
                      disabled={testingGroq || !keys.groqApiKey?.trim()}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                    >
                      {testingGroq ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                    </button>
                  </div>
                </div>

                {groqStatus && (
                  <div className={cn(
                    "text-xs p-2.5 rounded-xl flex items-center gap-2 font-medium",
                    groqStatus.success ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60" : "bg-rose-950/70 text-rose-300 border border-rose-800/60"
                  )}>
                    {groqStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span className="line-clamp-2">{groqStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Optional Keys (Shown on 'all' tab) */}
              {activeTab === 'all' && (
                <>
                  {/* Tavily Web Search Key */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Tavily Web Search Key</span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.2 rounded-full">
                          Optional
                        </span>
                      </div>
                      <a
                        href="https://tavily.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1"
                      >
                        Get Free Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative">
                      <input
                        type={showTavily ? 'text' : 'password'}
                        value={keys.tavilyApiKey}
                        onChange={(e) => {
                          setKeys({ ...keys, tavilyApiKey: e.target.value });
                          setTavilyStatus(null);
                        }}
                        placeholder="tvly-..."
                        className="w-full bg-slate-900 text-white text-xs font-mono px-4 py-2.5 pr-20 rounded-xl border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-600"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowTavily(!showTavily)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          {showTavily ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleTestTavily}
                          disabled={testingTavily || !keys.tavilyApiKey?.trim()}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          {testingTavily ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                        </button>
                      </div>
                    </div>

                    {tavilyStatus && (
                      <div className={cn(
                        "text-xs p-2.5 rounded-xl flex items-center gap-2 font-medium",
                        tavilyStatus.success ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60" : "bg-rose-950/70 text-rose-300 border border-rose-800/60"
                      )}>
                        {tavilyStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        <span>{tavilyStatus.message}</span>
                      </div>
                    )}
                  </div>

                  {/* ExchangeRate Key */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">ExchangeRate Key</span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.2 rounded-full">
                          Optional
                        </span>
                      </div>
                      <a
                        href="https://www.exchangerate-api.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Get Free Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="relative">
                      <input
                        type={showExchange ? 'text' : 'password'}
                        value={keys.exchangeRateApiKey}
                        onChange={(e) => {
                          setKeys({ ...keys, exchangeRateApiKey: e.target.value });
                          setExchangeStatus(null);
                        }}
                        placeholder="ExchangeRate API Key..."
                        className="w-full bg-slate-900 text-white text-xs font-mono px-4 py-2.5 pr-20 rounded-xl border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-600"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowExchange(!showExchange)}
                          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          {showExchange ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={handleTestExchange}
                          disabled={testingExchange || !keys.exchangeRateApiKey?.trim()}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          {testingExchange ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                        </button>
                      </div>
                    </div>

                    {exchangeStatus && (
                      <div className={cn(
                        "text-xs p-2.5 rounded-xl flex items-center gap-2 font-medium",
                        exchangeStatus.success ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/60" : "bg-rose-950/70 text-rose-300 border border-rose-800/60"
                      )}>
                        {exchangeStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        <span>{exchangeStatus.message}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Privacy Notice */}
              <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Client-Side: Saved only in your browser storage. Never sent to any server.</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Clear saved keys"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-secondary text-slate-950 hover:bg-secondary/90 rounded-full font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {savedSuccess ? 'Saved!' : 'Save Keys'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
