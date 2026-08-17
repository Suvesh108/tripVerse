import { 
  Settings, Edit3, Globe, Utensils, ArrowRight, MapPin, Calendar, 
  Star, ShieldCheck, Sparkles, Trash2, Plus, Key, Lock, Camera, 
  Upload, Check, Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, Trip } from '../lib/context';
import ApiSettingsModal from '../components/ApiSettingsModal';
import { 
  getStoredApiKeys, saveStoredApiKeys, clearStoredApiKeys, 
  testGroqKey, testTavilyKey, testExchangeRateKey, UserApiKeys 
} from '../lib/apiKeyStorage';

const AVATAR_PRESETS = [
  { id: '1', name: 'Explorer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Adventurer', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Nomad', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Wanderer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Voyager', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=400' },
  { id: '6', name: 'Hiker', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' }
];

export default function Profile() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  
  const user = state.user || {
    id: 'guest',
    name: 'Travel Explorer',
    avatar: AVATAR_PRESETS[0].url,
  };

  const [editName, setEditName] = useState(user.name);
  const [currentAvatar, setCurrentAvatar] = useState(user.avatar || AVATAR_PRESETS[0].url);

  // API Key Management State
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<UserApiKeys>({
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

  const refreshApiKeys = () => {
    const stored = getStoredApiKeys();
    setApiKeys(stored);
  };

  useEffect(() => {
    refreshApiKeys();
    setEditName(user.name);
    setCurrentAvatar(user.avatar || AVATAR_PRESETS[0].url);
    window.addEventListener('tripverse_keys_updated', refreshApiKeys);
    return () => window.removeEventListener('tripverse_keys_updated', refreshApiKeys);
  }, [state.user]);

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCurrentAvatar(reader.result);
          actions.updateUser({ avatar: reader.result });
          setIsAvatarPickerOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    setCurrentAvatar(url);
    actions.updateUser({ avatar: url });
    setIsAvatarPickerOpen(false);
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarUrl.trim()) {
      setCurrentAvatar(customAvatarUrl.trim());
      actions.updateUser({ avatar: customAvatarUrl.trim() });
      setCustomAvatarUrl('');
      setIsAvatarPickerOpen(false);
    }
  };

  const handleSaveProfile = () => {
    if (editName.trim()) {
      actions.updateUser({
        name: editName.trim(),
        avatar: currentAvatar,
      });
    }
    setIsEditingProfile(false);
  };

  // API Key Actions
  const handleSaveApiKeys = () => {
    saveStoredApiKeys(apiKeys);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearApiKeys = () => {
    if (confirm('Are you sure you want to remove all saved API keys from this browser?')) {
      clearStoredApiKeys();
      setApiKeys({
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
    const result = await testGroqKey(apiKeys.groqApiKey);
    setGroqStatus(result);
    setTestingGroq(false);
  };

  const handleTestTavily = async () => {
    setTestingTavily(true);
    setTavilyStatus(null);
    const result = await testTavilyKey(apiKeys.tavilyApiKey);
    setTavilyStatus(result);
    setTestingTavily(false);
  };

  const handleTestExchange = async () => {
    setTestingExchange(true);
    setExchangeStatus(null);
    const result = await testExchangeRateKey(apiKeys.exchangeRateApiKey);
    setExchangeStatus(result);
    setTestingExchange(false);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      actions.deleteTrip(tripId);
    }
  };

  const handleCreateTrip = async () => {
    await actions.createTrip(
      'New Adventure',
      'Goa',
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      0
    );
    navigate('/planner');
  };

  const handleOpenTrip = (trip: Trip) => {
    actions.updateTrip(trip.id, trip);
    navigate('/planner');
  };

  const userTrips = state.trips;
  const travelStats = {
    trips: userTrips.length,
    days: userTrips.reduce((sum, trip) => {
      const start = new Date(trip.startDate).getTime();
      const end = new Date(trip.endDate).getTime();
      const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return sum + diff;
    }, 0),
    saves: state.currentTrip?.savedPlaces.length || 0,
  };

  return (
    <>
      <main className="pt-24 md:pt-28 pb-16 md:pb-20 px-4 md:px-8 max-w-7xl mx-auto font-sans">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Profile Card & Quick Stats */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary via-cyan-600 to-primary"></div>
              
              <div className="relative z-10">
                {/* Avatar with Edit Badge */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4 group">
                  <div className="w-full h-full rounded-full border-4 border-white overflow-hidden shadow-xl bg-slate-100">
                    <img 
                      src={currentAvatar} 
                      alt={user.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  {/* Photo Change Trigger */}
                  <button
                    onClick={() => setIsAvatarPickerOpen(true)}
                    className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all border-2 border-white cursor-pointer"
                    title="Change profile image"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Name & Title */}
                {isEditingProfile ? (
                  <div className="space-y-3 mb-6">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-left">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 text-center font-bold text-lg text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:border-primary focus:bg-white outline-none transition-all"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        onClick={() => {
                          setEditName(user.name);
                          setIsEditingProfile(false);
                        }}
                        className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-5 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <h1 className="font-headline text-2xl font-bold text-slate-900">{user.name}</h1>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="p-1.5 text-slate-400 hover:text-primary rounded-full hover:bg-slate-100 transition-colors"
                        title="Edit name"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      <Sparkles className="w-3 h-3" />
                      TripVerse Explorer
                    </span>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex justify-center gap-2 mb-6">
                  <button 
                    onClick={() => setIsAvatarPickerOpen(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    Change Photo
                  </button>
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    Edit Name
                  </button>
                </div>

                {/* Travel Stats */}
                <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-100">
                  <div className="p-2">
                    <p className="text-xl font-black text-primary">{travelStats.trips}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Trips</p>
                  </div>
                  <div className="p-2 border-x border-slate-100">
                    <p className="text-xl font-black text-primary">{travelStats.days}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Days</p>
                  </div>
                  <div className="p-2">
                    <p className="text-xl font-black text-primary">{travelStats.saves}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Saves</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy & Storage Guarantee Card */}
            <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-200">100% Client-Side Privacy</h4>
                  <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                    Your profile data and API keys are stored exclusively in your browser's local storage. Zero servers track your data.
                  </p>
                </div>
              </div>
            </div>

          </aside>

          {/* Right Column: Redesigned API Box & Trip History */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* Redesigned API Settings Box */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 text-primary rounded-2xl border border-primary/30">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-headline text-xl font-bold text-white">AI & Intelligence Engine Keys</h2>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black uppercase rounded-full tracking-wider border border-primary/30">
                        BYOK
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your free API keys for unlimited AI itineraries and live web discovery.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={handleClearApiKeys}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                    title="Clear all stored keys"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* API Key Inputs */}
              <div className="space-y-5 pt-6 relative z-10">
                
                {/* 1. Groq AI Key */}
                <div className="p-4 sm:p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Groq AI API Key</span>
                      <span className="text-[10px] font-black text-rose-400 bg-rose-950/50 px-2 py-0.2 rounded-full border border-rose-800/40">
                        Required for AI
                      </span>
                    </div>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1"
                    >
                      Get Free Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showGroq ? 'text' : 'password'}
                      placeholder="gsk_..."
                      value={apiKeys.groqApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, groqApiKey: e.target.value })}
                      className="w-full bg-slate-900 text-white text-xs font-mono px-4 py-3 pr-20 rounded-xl border border-slate-700/60 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-slate-600"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowGroq(!showGroq)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title={showGroq ? 'Hide key' : 'Show key'}
                      >
                        {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestGroq}
                        disabled={testingGroq || !apiKeys.groqApiKey}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                      >
                        {testingGroq ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                      </button>
                    </div>
                  </div>

                  {/* Test Feedback Status */}
                  {groqStatus && (
                    <div className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium",
                      groqStatus.success ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50" : "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                    )}>
                      {groqStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{groqStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* 2. Tavily Web Search Key */}
                <div className="p-4 sm:p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Tavily Web Search Key</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.2 rounded-full">
                        Optional
                      </span>
                    </div>
                    <a
                      href="https://tavily.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1"
                    >
                      Get Free Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showTavily ? 'text' : 'password'}
                      placeholder="tvly-..."
                      value={apiKeys.tavilyApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, tavilyApiKey: e.target.value })}
                      className="w-full bg-slate-900 text-white text-xs font-mono px-4 py-3 pr-20 rounded-xl border border-slate-700/60 focus:border-sky-400 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-600"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowTavily(!showTavily)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        {showTavily ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestTavily}
                        disabled={testingTavily || !apiKeys.tavilyApiKey}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                      >
                        {testingTavily ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                      </button>
                    </div>
                  </div>

                  {tavilyStatus && (
                    <div className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium",
                      tavilyStatus.success ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50" : "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                    )}>
                      {tavilyStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{tavilyStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* 3. ExchangeRate API Key */}
                <div className="p-4 sm:p-5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">ExchangeRate API Key</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.2 rounded-full">
                        Optional
                      </span>
                    </div>
                    <a
                      href="https://www.exchangerate-api.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      Get Free Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      type={showExchange ? 'text' : 'password'}
                      placeholder="Enter ExchangeRate API Key..."
                      value={apiKeys.exchangeRateApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, exchangeRateApiKey: e.target.value })}
                      className="w-full bg-slate-900 text-white text-xs font-mono px-4 py-3 pr-20 rounded-xl border border-slate-700/60 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all placeholder:text-slate-600"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowExchange(!showExchange)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        {showExchange ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestExchange}
                        disabled={testingExchange || !apiKeys.exchangeRateApiKey}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                      >
                        {testingExchange ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                      </button>
                    </div>
                  </div>

                  {exchangeStatus && (
                    <div className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium",
                      exchangeStatus.success ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50" : "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                    )}>
                      {exchangeStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{exchangeStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Save Action */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Stored locally in your browser
                  </span>

                  <button
                    onClick={handleSaveApiKeys}
                    className="px-6 py-2.5 bg-secondary text-slate-950 hover:bg-secondary/90 rounded-full font-black text-xs uppercase tracking-wider shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {savedSuccess ? <Check className="w-4 h-4 text-slate-950" /> : <Key className="w-4 h-4 text-slate-950" />}
                    {savedSuccess ? 'Saved to Browser!' : 'Save Keys'}
                  </button>
                </div>
              </div>
            </div>

            {/* My Saved Trips Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-headline text-2xl font-bold text-slate-900">My Planned Journeys</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your saved multi-day itineraries and routes</p>
                </div>
                <button 
                  onClick={handleCreateTrip}
                  className="px-4 py-2 bg-primary text-white rounded-full font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Trip
                </button>
              </div>
              
              {userTrips.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 text-primary">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">No trips yet</h3>
                  <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">Plan your next journey with tight &lt; 5km routes and interactive maps.</p>
                  <button 
                    onClick={handleCreateTrip}
                    className="btn-primary px-6 py-2.5 text-xs uppercase tracking-wider font-bold"
                  >
                    Plan Your First Trip
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {userTrips.map((trip) => (
                    <div key={trip.id} className="group relative h-64 rounded-3xl overflow-hidden shadow-lg border border-slate-100">
                      <img 
                        src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800" 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-6 flex flex-col justify-end">
                        <span className="bg-secondary text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit mb-1.5">
                          {trip.destination}
                        </span>
                        <h4 className="text-white font-headline text-lg font-bold line-clamp-1">{trip.name}</h4>
                        <p className="text-white/70 text-xs mb-4">
                          {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenTrip(trip)}
                            className="px-4 py-2 bg-primary text-white rounded-full text-[11px] font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md"
                          >
                            <Sparkles className="w-3 h-3 text-secondary" />
                            Open Planner
                          </button>
                          <button 
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="px-3 py-2 bg-white/10 hover:bg-rose-500 text-white rounded-full text-[11px] font-bold transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>
        </div>
      </main>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {isAvatarPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarPickerOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 border border-slate-100"
            >
              <h3 className="font-headline text-lg font-bold text-slate-900 mb-1">Update Profile Picture</h3>
              <p className="text-xs text-slate-500 mb-5">Upload from your device, choose an explorer avatar, or paste an image link.</p>

              {/* Upload file button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors mb-5 border border-dashed border-slate-300"
              >
                <Upload className="w-4 h-4 text-primary" />
                Upload Photo from Device
              </button>

              {/* Avatar Presets Grid */}
              <div className="mb-5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Preset Avatars</label>
                <div className="grid grid-cols-3 gap-3">
                  {AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      className={cn(
                        "p-1 rounded-2xl border-2 transition-all group overflow-hidden flex flex-col items-center",
                        currentAvatar === preset.url ? "border-primary bg-primary/5 shadow-xs" : "border-slate-100 hover:border-slate-300"
                      )}
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.name} 
                        className="w-14 h-14 rounded-xl object-cover" 
                      />
                      <span className="text-[10px] font-bold text-slate-600 mt-1">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Or Paste Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleApplyCustomUrl}
                    disabled={!customAvatarUrl.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-40 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsAvatarPickerOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </>
  );
}
