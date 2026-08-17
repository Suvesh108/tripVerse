import { Settings, Edit3, Globe, Bed, Plane, Utensils, ArrowRight, MapPin, Calendar, Star, ShieldCheck, Sparkles, Trash2, Plus, Key, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { useApp } from '../lib/context';
import ApiSettingsModal from '../components/ApiSettingsModal';
import { getStoredApiKeys } from '../lib/apiKeyStorage';

export default function Profile() {
  const { state, actions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [apiKeysStatus, setApiKeysStatus] = useState({
    hasGroq: false,
    hasTavily: false,
    hasExchange: false,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });

  const checkApiKeys = () => {
    const keys = getStoredApiKeys();
    setApiKeysStatus({
      hasGroq: Boolean(keys.groqApiKey),
      hasTavily: Boolean(keys.tavilyApiKey),
      hasExchange: Boolean(keys.exchangeRateApiKey),
    });
  };

  useEffect(() => {
    checkApiKeys();
    window.addEventListener('tripverse_keys_updated', checkApiKeys);
    return () => window.removeEventListener('tripverse_keys_updated', checkApiKeys);
  }, []);

  const user = state.user || {
    id: 'guest',
    email: 'new.explorer@tripverse.app',
    name: 'New Explorer',
    avatar: 'https://picsum.photos/seed/explorer/400/400',
  };

  const userTrips = state.trips;

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditForm({
      name: user.name,
      email: user.email,
    });
  };

  const handleSaveProfile = async () => {
    console.log('Saving profile:', editForm);
    setIsEditing(false);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      actions.deleteTrip(tripId);
    }
  };

  const handleCreateTrip = async () => {
    const newTrip = await actions.createTrip(
      'New Adventure',
      'Destination',
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      50000
    );
    console.log('Created new trip:', newTrip);
  };

  const travelStats = {
    trips: userTrips.length,
    miles: userTrips.reduce((sum, trip) => sum + (trip.budget * 0.1), 0),
    saves: state.currentTrip?.savedPlaces.length || 0,
  };

  return (
    <>
      <main className="pt-24 md:pt-28 pb-16 md:pb-20 px-6 md:px-8 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Profile Card */}
          <aside className="md:col-span-5 lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-50 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-br from-primary to-cyan-400"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white mx-auto mb-4 md:mb-6 overflow-hidden shadow-xl">
                  <img 
                    src={user.avatar || 'https://picsum.photos/seed/alex/400/400'} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {isEditing ? (
                  <div className="space-y-3 mb-6 md:mb-8">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="text-center font-headline text-xl md:text-2xl font-bold bg-transparent border-b-2 border-slate-300 focus:border-primary outline-none"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="text-center text-sm md:text-base bg-transparent border-b border-slate-300 focus:border-primary outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="font-headline text-2xl md:text-3xl font-bold mb-1 md:mb-2 text-on-surface">{user.name}</h1>
                    <p className="text-on-surface-variant text-sm md:text-base mb-6">{user.email}</p>
                  </>
                )}
                
                <div className="flex justify-center gap-2 md:gap-3 mb-8 md:mb-10">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 md:px-6 py-2 bg-slate-100 rounded-full text-[10px] md:text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    {isEditing ? <Trash2 className="w-3 h-3" /> : <Settings className="w-3 h-3" /> } 
                    {isEditing ? 'Cancel' : 'Edit Info'}
                  </button>
                  {isEditing ? (
                    <button 
                      onClick={handleSaveProfile}
                      className="px-4 md:px-6 py-2 bg-primary text-white rounded-full text-[10px] md:text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" />
                      Save
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsApiModalOpen(true)}
                      className="px-4 md:px-6 py-2 bg-primary text-white rounded-full text-[10px] md:text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                    >
                      <Key className="w-3 h-3" />
                      API Keys
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4 py-6 md:py-8 border-y border-slate-50">
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-primary">{travelStats.trips}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trips</p>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-primary">{Math.round(travelStats.miles).toLocaleString()}k</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Miles</p>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-primary">{travelStats.saves}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saves</p>
                  </div>
                </div>
              </div>
            </div>

            {/* API Status & Privacy Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-700/50">
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h3 className="font-headline text-lg md:text-xl font-bold flex items-center gap-2">
                  <Key className="text-primary w-5 h-5" />
                  BYOK API Keys
                </h3>
                <button
                  onClick={() => setIsApiModalOpen(true)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full font-bold transition-colors"
                >
                  Configure
                </button>
              </div>

              <div className="space-y-3.5 relative z-10">
                <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-primary w-4 h-4" />
                    <span className="text-xs font-medium">Groq AI Engine</span>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", apiKeysStatus.hasGroq ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400")}>
                    {apiKeysStatus.hasGroq ? 'Active' : 'Unset'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Globe className="text-blue-400 w-4 h-4" />
                    <span className="text-xs font-medium">Tavily Web Search</span>
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", apiKeysStatus.hasTavily ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400")}>
                    {apiKeysStatus.hasTavily ? 'Active' : 'Optional'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Lock className="text-emerald-400 w-4 h-4" />
                    <span className="text-xs font-medium">Storage Location</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    Local Only
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                Keys are stored 100% in your browser. No backend server has access to your credentials.
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <section className="md:col-span-7 lg:col-span-8 space-y-10 md:space-y-12">
            <div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6 md:mb-8">Travel DNA</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {[
                  { title: 'Luxury Stays', val: '85%', icon: Bed, color: 'bg-blue-50 text-blue-600' },
                  { title: 'Local Dining', val: '92%', icon: Utensils, color: 'bg-cyan-50 text-cyan-600' },
                  { title: 'Adventure', val: '64%', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
                ].map(dna => (
                  <div key={dna.title} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-50">
                    <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-4 md:mb-6", dna.color)}>
                      <dna.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{dna.title}</p>
                    <p className="text-2xl md:text-3xl font-bold">{dna.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-6 md:mb-8">
                <h2 className="font-headline text-2xl md:text-3xl font-bold">My Trips</h2>
                <div className="flex gap-3">
                  <button 
                    onClick={handleCreateTrip}
                    className="text-primary font-bold text-xs md:text-sm hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Create Trip
                  </button>
                </div>
              </div>
              
              {userTrips.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-600 mb-2">No trips yet</h3>
                  <p className="text-slate-500 mb-6">Start planning your first adventure with TripVerse AI</p>
                  <button 
                    onClick={handleCreateTrip}
                    className="btn-primary px-6 py-3"
                  >
                    Create Your First Trip
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                  {userTrips.map((trip) => (
                    <div key={trip.id} className="group relative h-72 md:h-80 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-lg">
                      <img 
                        src={`https://picsum.photos/seed/${trip.destination}/800/600`} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 md:p-10 flex flex-col justify-end">
                        <h4 className="text-white font-headline text-xl md:text-2xl font-bold mb-1 md:mb-2">{trip.name}</h4>
                        <p className="text-white/70 text-xs md:text-sm mb-4 md:mb-6">
                          {trip.destination} • {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                        </p>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="w-fit px-4 py-2 bg-red-500/80 backdrop-blur-md border border-red-500/30 rounded-full text-white text-[10px] font-bold hover:bg-red-600 transition-all"
                          >
                            Delete Trip
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

      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </>
  );
}
