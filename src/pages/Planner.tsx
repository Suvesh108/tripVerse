import { ChevronRight, Wand2, Save, Plus, GripVertical, Train, MapPin, Filter, ListFilter, Bookmark, Sparkles, Send, Star, Trash2, Edit3, Map as MapIcon, LayoutList, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/context';
import { Place, Activity, LEAFLET_TILE_URL, LEAFLET_ATTRIBUTION, geocode } from '../lib/services';
import { cn } from '../lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Planner() {
  const { state, actions } = useApp();
  const [searchParams] = useSearchParams();
  const [selectedDay, setSelectedDay] = useState('all');
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({});
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Activity | null>(null);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [autoPlanStatus, setAutoPlanStatus] = useState('');
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  
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

    // Geocode activities (simulated for now, real geocode would be too many API calls)
    // In a real app, activities would already have lat/lon from the AI or search
    activitiesToShow.forEach((activity, idx) => {
      const lat = activity.lat || 28.6139;
      const lon = activity.lon || 77.2090;

      const isHotel = activity.type.toLowerCase().includes('hotel') || activity.type.toLowerCase().includes('stay');
      const isDining = activity.type.toLowerCase().includes('dining') || activity.type.toLowerCase().includes('restaurant');
      
      const markerColor = isHotel ? '#10b981' : isDining ? '#f59e0b' : '#005f9b';
      const markerIcon = isHotel ? '🏨' : isDining ? '🍽️' : '📍';

      const customIcon = L.divIcon({
        className: 'planner-marker',
        html: `<div style="width: 28px; height: 28px; background: ${markerColor}; border-radius: 50%; border: 2px solid white; display: flex; items-center; justify-content: center; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${markerIcon}</div>`,
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

  // --- Auto-plan logic ---
  useEffect(() => {
    const autoplan = searchParams.get('autoplan');
    const destParam = searchParams.get('destination');
    const budgetParam = searchParams.get('budget');
    const daysParam = searchParams.get('days');

    if (autoplan === 'true' && destParam && currentTrip && !currentTrip.plan) {
      triggerAIPlan(destParam, parseInt(budgetParam || '50000'), parseInt(daysParam || '7'));
    }
  }, [currentTrip?.id]);

  const triggerAIPlan = async (destination: string, budget: number, days: number = 7) => {
    setIsAutoPlanning(true);
    setAutoPlanStatus(`🤖 AI is searching for Hotels, Restaurants, and Sights in ${destination}...`);
    try {
      // Specifically fetch categorized data to enrich the plan
      const [attractions, hotels, restaurants] = await Promise.all([
        getPlaces(destination, 'attraction'),
        getPlaces(destination, 'Hotel'),
        getPlaces(destination, 'Restaurant')
      ]);

      await actions.generateAIPlan(destination, days, budget, ['Hotel', 'Restaurant', 'Tourist Place'], {
        context: `Ensure the itinerary includes: 
        - Hotels: ${hotels.slice(0, 3).map(h => h.name).join(', ')}
        - Restaurants: ${restaurants.slice(0, 3).map(r => r.name).join(', ')}
        - Tourist Places: ${attractions.slice(0, 5).map(a => a.name).join(', ')}`
      });
      setAutoPlanStatus('✅ Your optimized itinerary is ready!');
      setTimeout(() => setAutoPlanStatus(''), 3000);
    } catch (e) {
      setAutoPlanStatus('❌ Could not generate plan.');
    } finally {
      setIsAutoPlanning(false);
    }
  };

  const handleAddActivity = () => {
    if (newActivity.name && newActivity.type && currentTrip) {
      const activity: Activity = {
        name: newActivity.name || '',
        type: newActivity.type || 'activity',
        duration: newActivity.duration || '2 Hours',
        cost: newActivity.cost || 0,
        description: newActivity.description || '',
        location: newActivity.location || currentTrip.destination,
      };

      if (currentTrip.plan && currentTrip.plan.itinerary[0]) {
        currentTrip.plan.itinerary[0].activities.push(activity);
        currentTrip.plan.itinerary[0].estimatedCost += activity.cost;
      }
      setNewActivity({});
      setShowAddActivity(false);
    }
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    if (currentTrip?.plan && currentTrip.plan.itinerary[dayIndex]) {
      const activity = currentTrip.plan.itinerary[dayIndex].activities[activityIndex];
      currentTrip.plan.itinerary[dayIndex].estimatedCost -= activity.cost;
      currentTrip.plan.itinerary[dayIndex].activities.splice(activityIndex, 1);
    }
  };

  return (
    <main className="pt-24 min-h-screen flex flex-col bg-slate-50">
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
              `${new Date(currentTrip.startDate).toLocaleDateString()} - ${new Date(currentTrip.endDate).toLocaleDateString()} • ₹${currentTrip.budget.toLocaleString()} Budget`
            ) : (
              'Create or select a trip to start planning your perfect adventure.'
            )}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
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
              >
                <mode.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button 
            onClick={() => {
              if (currentTrip) {
                const daysParam = searchParams.get('days');
                triggerAIPlan(currentTrip.destination, currentTrip.budget, parseInt(daysParam || '7'));
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full border border-outline bg-white text-primary font-bold hover:bg-slate-50 transition-all text-sm"
            disabled={state.isLoading || !currentTrip}
          >
            <Wand2 className="w-4 h-4" />
            {state.isLoading ? 'Thinking...' : 'AI Optimize'}
          </button>
          <button 
            onClick={() => actions.updateTrip(currentTrip?.id!, currentTrip!)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2 rounded-full btn-primary font-bold shadow-xl text-sm"
            disabled={!currentTrip}
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </header>

      {/* AI Status Banner */}
      {(isAutoPlanning || autoPlanStatus) && (
        <div className="px-6 md:px-12 max-w-screen-2xl mx-auto w-full mb-4">
          <div className={cn(
            "p-4 rounded-2xl text-sm font-bold flex items-center gap-3 border shadow-sm",
            isAutoPlanning ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-green-50 border-green-100 text-green-700"
          )}>
            {isAutoPlanning && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
            <span>{autoPlanStatus}</span>
          </div>
        </div>
      )}

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
                  Full Journey
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

              <div className="relative space-y-8">
                {currentTrip.plan?.itinerary
                  .filter(day => selectedDay === 'all' || selectedDay === day.day.toString())
                  .map((day) => (
                    <motion.div 
                      key={day.day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative pl-12 md:pl-16"
                    >
                      <div className="absolute left-0 top-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border border-outline flex items-center justify-center text-primary font-headline font-bold text-base md:text-xl shadow-sm">
                        {day.day}
                      </div>
                      <div className="mb-6">
                        <h3 className="text-xl md:text-2xl font-bold">Day {day.day}</h3>
                        <p className="text-on-surface-variant text-sm">{day.activities.length} Activities • ₹{day.estimatedCost.toLocaleString()}</p>
                      </div>

                      <div className="space-y-4">
                        {day.activities.map((activity, idx) => (
                          <motion.div 
                            key={idx}
                            layout
                            className="group card-premium p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 items-start relative overflow-hidden"
                          >
                            <div className="hidden lg:group-hover:flex absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-slate-300">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="w-full sm:w-24 shrink-0">
                              <p className="text-secondary font-bold text-sm">
                                {idx === 0 ? '09:30' : idx === 1 ? '13:00' : '17:30'}
                              </p>
                              <div className={cn(
                                "text-[10px] uppercase font-black tracking-widest mt-1 px-2 py-0.5 rounded inline-block",
                                activity.type === 'dining' ? "bg-orange-50 text-orange-600" :
                                activity.type === 'sightseeing' ? "bg-blue-50 text-blue-600" :
                                "bg-purple-50 text-purple-600"
                              )}>
                                {activity.type}
                              </div>
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold text-lg leading-tight mb-1">{activity.name}</h4>
                              <p className="text-on-surface-variant text-sm line-clamp-2">{activity.description}</p>
                              <div className="flex items-center gap-4 mt-4">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <Navigation className="w-3 h-3" /> {activity.duration}
                                </span>
                                {activity.cost > 0 && (
                                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                    ₹{activity.cost.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveActivity(day.day - 1, idx)}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-300 hover:text-accent"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                        <button 
                          onClick={() => setShowAddActivity(true)}
                          className="w-full py-4 border-2 border-dashed border-outline rounded-[2rem] text-slate-400 hover:text-primary hover:border-primary hover:bg-white transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                          <Plus className="w-4 h-4" /> Add to Day {day.day}
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
              viewMode === 'split' ? "w-full md:w-1/2 lg:w-2/5 h-[400px] md:h-full" : "w-full h-[600px]"
            )}>
              <div ref={mapRef} className="w-full h-full z-0" />
              <div className="absolute top-6 right-6 z-[1000] space-y-2">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Destination</p>
                      <p className="text-sm font-bold text-primary leading-none">{currentTrip.destination}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

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
                    className="w-full p-4 bg-slate-50 border border-outline rounded-2xl focus:ring-2 focus:ring-secondary/20 transition-all outline-none"
                    value={newActivity.name || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Type</label>
                    <select
                      className="w-full p-4 bg-slate-50 border border-outline rounded-2xl outline-none"
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
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Cost (₹)</label>
                    <input
                      type="number"
                      className="w-full p-4 bg-slate-50 border border-outline rounded-2xl outline-none"
                      value={newActivity.cost || ''}
                      onChange={(e) => setNewActivity({ ...newActivity, cost: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Description</label>
                  <textarea
                    placeholder="What's the plan?"
                    className="w-full p-4 bg-slate-50 border border-outline rounded-2xl h-24 outline-none"
                    value={newActivity.description || ''}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAddActivity(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddActivity}
                  className="flex-1 py-4 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Add Activity
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

