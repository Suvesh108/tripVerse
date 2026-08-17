import { 
  ChevronRight, Wand2, Save, Plus, MapPin, Sparkles, Send, 
  Trash2, Map as MapIcon, LayoutList, Navigation, MessageSquare, 
  Bot, User, X, CheckCircle2, RefreshCw, ArrowRight, CornerDownLeft, Clock,
  Compass, Hotel, Utensils, ShieldCheck, Sparkle, Globe2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/context';
import { Activity, LEAFLET_TILE_URL, LEAFLET_ATTRIBUTION, getPlaces } from '../lib/services';
import { cn } from '../lib/utils';
import ApiSettingsModal from '../components/ApiSettingsModal';
import { getGroqApiKey } from '../lib/apiKeyStorage';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Haversine distance calculator
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

interface PlannerChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  updatedPlan?: boolean;
}

export default function Planner() {
  const { state, actions } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedDay, setSelectedDay] = useState('all');
  const [placesPerDay, setPlacesPerDay] = useState<number>(3);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({});
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [autoPlanStatus, setAutoPlanStatus] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [targetDayIndex, setTargetDayIndex] = useState(0);
  
  // AI Assistant Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [chatMessages, setChatMessages] = useState<PlannerChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hi! I'm your Live AI Trip Assistant. If you missed a spot today, had unexpected weather, or want to reschedule unvisited places to tomorrow (or add nearby sights under 5km), just let me know!",
      timestamp: new Date(),
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Current trip from state
  const currentTrip = state.currentTrip;

  // --- Map Logic ---
  useEffect(() => {
    if (!mapRef.current || !currentTrip || leafletMapRef.current) return;

    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer(LEAFLET_TILE_URL, { attribution: LEAFLET_ATTRIBUTION }).addTo(map);
    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [currentTrip?.id, viewMode]);

  useEffect(() => {
    if (!leafletMapRef.current || !currentTrip?.plan) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const activitiesToShow = selectedDay === 'all' 
      ? currentTrip.plan.itinerary.flatMap(d => d.activities)
      : currentTrip.plan.itinerary.find(d => d.day.toString() === selectedDay)?.activities || [];

    const bounds = L.latLngBounds([]);

    activitiesToShow.forEach((activity) => {
      const lat = activity.lat || 20.5937;
      const lon = activity.lon || 78.9629;

      const isHotel = activity.type.toLowerCase().includes('hotel') || activity.type.toLowerCase().includes('stay');
      const isDining = activity.type.toLowerCase().includes('dining') || activity.type.toLowerCase().includes('restaurant');
      
      const markerColor = isHotel ? '#10b981' : isDining ? '#f59e0b' : '#005f9b';
      const markerIcon = isHotel ? '🏨' : isDining ? '🍽️' : '📍';

      const customIcon = L.divIcon({
        className: 'planner-marker',
        html: `<div style="width: 28px; height: 28px; background: ${markerColor}; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${markerIcon}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lon], { icon: customIcon })
        .addTo(leafletMapRef.current!)
        .bindPopup(`<b>${activity.name}</b><br/>${activity.type}`);
      
      markersRef.current.push(marker);
      bounds.extend([lat, lon]);
    });

    if (markersRef.current.length > 0) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedDay, currentTrip?.plan?.itinerary, viewMode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const [generationProgress, setGenerationProgress] = useState(0);

  // --- Auto-plan logic ---
  useEffect(() => {
    const autoplan = searchParams.get('autoplan');
    const destParam = searchParams.get('destination');
    const daysParam = searchParams.get('days');

    if (autoplan === 'true' && destParam && currentTrip && !currentTrip.plan) {
      const parsedDays = parseInt(daysParam || '5') || 5;
      triggerAIPlan(destParam, parsedDays, placesPerDay);
    }
  }, [currentTrip?.id]);

  const triggerAIPlan = async (destination: string, days: number = 5, targetPlaces: number = placesPerDay) => {
    const groqKey = getGroqApiKey();
    if (!groqKey) {
      setAutoPlanStatus('⚠️ Please configure your free Groq API key to generate AI itineraries.');
      setIsApiModalOpen(true);
      return;
    }

    setIsAutoPlanning(true);
    setGenerationProgress(8);
    setAutoPlanStatus(`Generating ${targetPlaces}-stop itinerary for ${destination}...`);

    // Smooth circular progress simulation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 92) return prev;
        const inc = Math.floor(Math.random() * 8) + 4;
        return Math.min(92, prev + inc);
      });
    }, 280);

    try {
      const [attractions, hotels, restaurants] = await Promise.all([
        getPlaces(destination, 'attraction'),
        getPlaces(destination, 'Hotel'),
        getPlaces(destination, 'Restaurant')
      ]);

      await actions.generateAIPlan(destination, days, 0, ['Hotel', 'Restaurant', 'Tourist Place'], {
        placesPerDay: targetPlaces,
        context: `Ensure ${targetPlaces} places per day clustered with consecutive hops under 5 km distance. 
        - Hotels: ${hotels.slice(0, 3).map(h => h.name).join(', ')}
        - Restaurants: ${restaurants.slice(0, 3).map(r => r.name).join(', ')}
        - Sights: ${attractions.slice(0, 5).map(a => a.name).join(', ')}`
      });
      setGenerationProgress(100);
      setAutoPlanStatus('✅ Itinerary generated successfully!');
      setTimeout(() => {
        setAutoPlanStatus('');
        setIsAutoPlanning(false);
        setGenerationProgress(0);
      }, 700);
    } catch (e) {
      setAutoPlanStatus('❌ Could not generate plan.');
      setIsAutoPlanning(false);
      setGenerationProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleAddActivity = () => {
    if (newActivity.name && newActivity.type && currentTrip && currentTrip.plan) {
      const targetDay = currentTrip.plan.itinerary[targetDayIndex] || currentTrip.plan.itinerary[0];
      const baseLat = targetDay?.activities?.[0]?.lat || 20.5937;
      const baseLon = targetDay?.activities?.[0]?.lon || 78.9629;

      const activity: Activity = {
        name: newActivity.name || '',
        type: newActivity.type || 'sightseeing',
        duration: newActivity.duration || '2 Hours',
        cost: 0,
        description: newActivity.description || '',
        location: newActivity.location || currentTrip.destination,
        lat: Number((baseLat + 0.003).toFixed(4)),
        lon: Number((baseLon + 0.003).toFixed(4)),
      };

      const updatedItinerary = [...currentTrip.plan.itinerary];
      if (targetDay) {
        targetDay.activities = [...targetDay.activities, activity];
        actions.updateTrip(currentTrip.id, {
          plan: {
            ...currentTrip.plan,
            itinerary: updatedItinerary,
          }
        });
      }
      setNewActivity({});
      setShowAddActivity(false);
    }
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    if (currentTrip?.plan && currentTrip.plan.itinerary[dayIndex]) {
      const updatedItinerary = [...currentTrip.plan.itinerary];
      const targetDay = { ...updatedItinerary[dayIndex] };
      const activity = targetDay.activities[activityIndex];
      if (activity) {
        targetDay.estimatedCost -= activity.cost;
        targetDay.activities = targetDay.activities.filter((_, idx) => idx !== activityIndex);
        updatedItinerary[dayIndex] = targetDay;
        const totalCost = updatedItinerary.reduce((sum, d) => sum + d.estimatedCost, 0);
        actions.updateTrip(currentTrip.id, {
          plan: {
            ...currentTrip.plan,
            itinerary: updatedItinerary,
            totalCost,
          }
        });
      }
    }
  };

  // --- Dynamic AI Itinerary Chat Handler ---
  const handleSendPlannerChat = async (presetText?: string) => {
    const textToSend = presetText || chatInput.trim();
    if (!textToSend || isAdjusting) return;

    const userMsg: PlannerChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!presetText) setChatInput('');
    setIsAdjusting(true);

    try {
      const responseMessage = await actions.adjustTripPlan(textToSend);
      const botMsg: PlannerChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseMessage,
        timestamp: new Date(),
        updatedPlan: true,
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: '⚠️ An error occurred while adjusting your plan. Please verify your Groq API key.',
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleChatKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPlannerChat();
    }
  };

  const quickPromptIdeas = [
    { label: "Set 2 places for Day 1", query: "I only want 2 places for Day 1 since the destination exceeds 5 km or to keep a relaxed pace, please reschedule the others." },
    { label: "Limit all days to 2 places", query: "Set exactly 2 places per day for the entire trip so we have plenty of resting time." },
    { label: "Cluster all stops under 5km", query: "Re-order and optimize all daily stops so every consecutive place is under 5 km distance." },
    { label: "Move unvisited spot to tomorrow", query: "I only visited 1 place today, please reschedule remaining places to tomorrow without dropping them." },
  ];

  return (
    <main className="pt-24 min-h-screen flex flex-col bg-slate-50 relative">
      <header className="px-6 md:px-12 py-6 max-w-screen-2xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
            <Link to="/profile" className="hover:text-primary transition-colors">My Trips</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary font-semibold">{currentTrip?.name || 'New Trip'}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-headline font-bold tracking-tight text-on-surface">{currentTrip?.name || 'Trip Planner'}</h1>
          <p className="text-on-surface-variant text-sm md:text-base font-medium">
            {currentTrip ? (
              `${new Date(currentTrip.startDate).toLocaleDateString()} - ${new Date(currentTrip.endDate).toLocaleDateString()}`
            ) : (
              'Create or select a trip to start planning your perfect adventure.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
          {/* Places per day density toggle */}
          <div className="bg-white px-3 py-1.5 rounded-full border border-outline flex items-center gap-1.5 text-xs font-bold text-slate-700 shadow-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Stops/Day:</span>
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => {
                  setPlacesPerDay(num);
                  if (currentTrip) {
                    const daysParam = searchParams.get('days');
                    triggerAIPlan(currentTrip.destination, parseInt(daysParam || '7'), num);
                  }
                }}
                className={cn(
                  "w-6 h-6 rounded-full text-xs font-bold transition-all flex items-center justify-center",
                  placesPerDay === num ? "bg-primary text-white shadow-xs" : "text-slate-500 hover:bg-slate-100"
                )}
                title={`Set ${num} places per day`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="bg-white p-1 rounded-full border border-outline flex">
            {[
              { id: 'split', icon: LayoutList },
              { id: 'map', icon: MapIcon },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={cn(
                  "p-2 rounded-full transition-all",
                  viewMode === mode.id ? "bg-primary text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
                title={`Switch to ${mode.id} view`}
              >
                <mode.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm",
              isChatOpen 
                ? "bg-secondary text-slate-900 ring-2 ring-secondary/30" 
                : "bg-white border border-secondary/40 text-slate-800 hover:bg-secondary/10"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span>AI Live Assistant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button 
            onClick={() => {
              if (currentTrip) {
                const daysParam = searchParams.get('days');
                const diffDays = Math.max(1, Math.round((new Date(currentTrip.endDate).getTime() - new Date(currentTrip.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                const durationDays = diffDays || parseInt(daysParam || '5') || 5;
                triggerAIPlan(currentTrip.destination, durationDays, placesPerDay);
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline bg-white text-primary font-bold hover:bg-slate-50 transition-all text-xs"
            disabled={isAutoPlanning || !currentTrip}
          >
            <Wand2 className={cn("w-3.5 h-3.5", isAutoPlanning && "animate-spin text-secondary")} />
            {isAutoPlanning ? 'Synthesizing Plan...' : 'Re-Generate'}
          </button>
          
          <button 
            onClick={() => actions.updateTrip(currentTrip?.id!, currentTrip!)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full btn-primary font-bold shadow-md text-xs"
            disabled={!currentTrip}
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </header>

      {/* --- CLEAN CIRCULAR PERCENTAGE PROGRESS OVERLAY --- */}
      <AnimatePresence>
        {isAutoPlanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative"
            >
              {/* Circular SVG Percentage Meter */}
              <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Track Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="text-slate-100"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    className="text-primary transition-all duration-300 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={(2 * Math.PI * 42) * (1 - generationProgress / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Inner Centered Percentage */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-headline text-3xl font-black text-slate-800 tracking-tight">
                    {generationProgress}%
                  </span>
                </div>
              </div>

              {/* Status */}
              <h3 className="font-headline text-lg font-bold text-slate-800 mt-4 mb-3">
                Generating Itinerary
              </h3>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-secondary" />
                <span>AI Route Synthesis</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentTrip ? (
        <section className="flex-grow flex items-center justify-center px-6 pb-12">
          <div className="text-center card-premium p-12 md:p-20 max-w-2xl">
            <Sparkles className="w-16 h-16 text-primary/20 mx-auto mb-6" />
            <h2 className="text-3xl font-headline font-bold mb-4">No Trip Selected</h2>
            <p className="text-slate-500 mb-8 text-lg">
              Unlock the power of AI-powered travel planning. Start by searching for a destination.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/explore" className="btn-primary">Explore Destinations</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className={cn(
          "flex-grow flex flex-col md:flex-row px-6 md:px-12 pb-12 max-w-screen-2xl mx-auto w-full gap-8 overflow-hidden",
          viewMode === 'map' ? 'flex-col-reverse' : ''
        )}>
          {/* Timeline View */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={cn(
              "flex flex-col gap-6 overflow-y-auto md:pr-4 no-scrollbar",
              viewMode === 'split' ? "w-full md:w-1/2 lg:w-3/5" : "w-full"
            )}>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <button 
                  onClick={() => setSelectedDay('all')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                    selectedDay === 'all' ? "bg-primary text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-50 border border-outline"
                  )}
                >
                  Full Journey ({currentTrip.plan?.itinerary.length || 0} Days)
                </button>
                {currentTrip.plan?.itinerary.map((day) => (
                  <button 
                    key={day.day}
                    onClick={() => setSelectedDay(day.day.toString())}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                      selectedDay === day.day.toString() ? "bg-primary text-white shadow-lg" : "bg-white text-slate-500 hover:bg-slate-50 border border-outline"
                    )}
                  >
                    Day {day.day}
                  </button>
                ))}
              </div>

              {/* Shimmer Placeholder when generating without existing plan */}
              {!currentTrip.plan && isAutoPlanning && (
                <div className="space-y-6 animate-pulse">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
                      <div className="h-6 w-32 bg-slate-200 rounded-md" />
                      <div className="space-y-3">
                        <div className="h-16 bg-slate-100 rounded-2xl" />
                        <div className="h-16 bg-slate-100 rounded-2xl" />
                        <div className="h-16 bg-slate-100 rounded-2xl" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative space-y-8">
                {currentTrip.plan?.itinerary
                  .filter(day => selectedDay === 'all' || selectedDay === day.day.toString())
                  .map((day) => (
                    <motion.div 
                      key={day.day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between sticky top-0 bg-slate-50/90 backdrop-blur-md py-2 z-10">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md">
                            {day.day}
                          </span>
                          <div>
                            <h3 className="font-headline text-lg font-bold text-on-surface">Day {day.day}</h3>
                            <p className="text-slate-400 text-[11px] font-semibold">
                              {day.activities.length} stops • Clustered under 5km route
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {day.activities.map((activity, aIdx) => {
                          const prevAct = aIdx > 0 ? day.activities[aIdx - 1] : null;
                          const hopDist = prevAct && activity.lat && prevAct.lat 
                            ? getDistanceKm(prevAct.lat, prevAct.lon, activity.lat, activity.lon)
                            : 0;

                          return (
                            <div key={aIdx} className="space-y-2">
                              {aIdx > 0 && (
                                <div className="flex items-center gap-2 pl-4 py-0.5">
                                  <div className="w-0.5 h-3 bg-slate-300 rounded-full" />
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs",
                                    hopDist <= 5 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  )}>
                                    📍 {hopDist} km from Stop {aIdx} {hopDist <= 5 ? '(Within 5km radius ✓)' : '(> 5km)'}
                                  </span>
                                </div>
                              )}
                              <div 
                                className="bg-white p-4 rounded-2xl border border-outline hover:shadow-md transition-all flex items-start justify-between gap-4 group"
                              >
                                <div className="flex items-start gap-3.5">
                                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                    {aIdx + 1}
                                  </span>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-sm text-slate-800">{activity.name}</h4>
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {activity.type}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {activity.duration}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                      {activity.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleRemoveActivity(day.day - 1, aIdx)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                                    title="Remove activity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <button
                          onClick={() => {
                            setTargetDayIndex(day.day - 1);
                            setShowAddActivity(true);
                          }}
                          className="w-full py-3 border-2 border-dashed border-outline rounded-2xl text-slate-400 hover:text-primary hover:border-primary hover:bg-white transition-all flex items-center justify-center gap-2 font-bold text-xs"
                        >
                          <Plus className="w-4 h-4" /> Add custom spot to Day {day.day}
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Map View */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={cn(
              "relative bg-white rounded-[2.5rem] overflow-hidden border border-outline shadow-premium",
              viewMode === 'split' ? "w-full md:w-1/2 lg:w-2/5 h-[450px] md:h-full" : "w-full h-[600px]"
            )}>
              <div ref={mapRef} className="w-full h-full z-0" />
              <div className="absolute top-6 right-6 z-[1000] space-y-2">
                <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Destination Hub</p>
                      <p className="text-sm font-bold text-primary leading-none">{currentTrip.destination}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Floating AI Live Assistant Trigger Pill (when drawer is closed) */}
      {!isChatOpen && currentTrip?.plan && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-slate-900 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 hover:bg-black transition-all"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-secondary" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="font-bold text-xs tracking-wide">Live AI Itinerary Assistant</span>
        </motion.button>
      )}

      {/* AI Assistant Chat Box / Side Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary border border-secondary/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm leading-none">Planner AI Concierge</h3>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full uppercase">Live</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Smart rescheduling & <span className="text-secondary">&lt;5km</span> route adjustments</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Preset Prompt Chips */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickPromptIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPlannerChat(idea.query)}
                  disabled={isAdjusting}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold whitespace-nowrap shadow-xs hover:border-slate-300 transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-2.5 h-2.5 text-secondary" />
                  {idea.label}
                </button>
              ))}
            </div>

            {/* Message History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col gap-1 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs",
                    msg.role === 'user'
                      ? "bg-primary text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs"
                  )}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    {msg.updatedPlan && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Itinerary & map updated in real-time
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isAdjusting && (
                <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 w-fit">
                  <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>AI is rescheduling & optimizing distances...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="e.g. Missed spot 1 today, move it to Day 2..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                disabled={isAdjusting}
              />
              <button
                onClick={() => handleSendPlannerChat()}
                disabled={!chatInput.trim() || isAdjusting}
                className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-40 transition-colors shadow-sm"
                title="Send instruction to AI Itinerary Assistant"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {showAddActivity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-2xl font-headline font-bold mb-6">Add New Activity</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Activity Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner at Marina"
                    className="w-full p-4 bg-slate-50 border border-outline rounded-2xl focus:ring-2 focus:ring-secondary/20 transition-all outline-none text-xs"
                    value={newActivity.name || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Type</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-outline rounded-2xl outline-none text-xs"
                    value={newActivity.type || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="dining">Dining</option>
                    <option value="cultural">Cultural</option>
                    <option value="activity">Activity</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description</label>
                  <textarea
                    placeholder="What's the plan?"
                    className="w-full p-4 bg-slate-50 border border-outline rounded-2xl h-24 outline-none text-xs"
                    value={newActivity.description || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddActivity(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-full transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddActivity}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-xs"
                >
                  Add Activity
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </main>
  );
}
