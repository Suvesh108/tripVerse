import { MapPin, Calendar, Star, Sparkles, ShieldCheck, Settings, Edit3, Globe, Bed, Plane, Utensils, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/context';
import { debounce } from '../lib/services';
import { cn } from '../lib/utils';

export default function Home() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchBudget, setSearchBudget] = useState('50000');
  const [searchDays, setSearchDays] = useState('0');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const indiaPlaces = [
    { name: 'Taj Mahal, Agra', url: 'https://images.unsplash.com/photo-1564507592333-c60657451dd7?auto=format&fit=crop&q=60&w=1920' },
    { name: 'Hawa Mahal, Jaipur', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=60&w=1920' },
    { name: 'Kerala Backwaters', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=60&w=1920' },
    { name: 'Varanasi Ghats', url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=60&w=1920' },
    { name: 'Ladakh Mountains', url: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&q=60&w=1920' },
    { name: 'Goa Beaches', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=60&w=1920' }
  ];

  useEffect(() => {
    // Preload the first few images
    indiaPlaces.slice(0, 3).forEach(place => {
      const img = new Image();
      img.src = place.url;
    });

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % indiaPlaces.length);
    }, 8000); // Increased interval for better UX
    return () => clearInterval(timer);
  }, []);

  const handleSearch = debounce(async () => {
    if (searchLocation.trim()) {
      await actions.searchDestinations(searchLocation);
    }
  }, 500);

  const handlePlanTrip = async () => {
    if (!searchLocation.trim()) {
      navigate('/explore');
      return;
    }
    // Search destinations first
    await actions.searchDestinations(searchLocation);
    // Create a trip and navigate to planner
    const daysCount = parseInt(searchDays) || 7;
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + daysCount * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const budget = parseInt(searchBudget) || 50000;
    await actions.createTrip(
      `${searchLocation} Adventure`,
      searchLocation,
      today,
      endDate,
      budget
    );
    navigate(`/planner?destination=${encodeURIComponent(searchLocation)}&budget=${budget}&days=${daysCount}&autoplan=true`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={indiaPlaces[currentImageIndex].url}
              alt={indiaPlaces[currentImageIndex].name}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-10 right-10 text-white/60 text-xs font-medium tracking-widest uppercase hidden md:block">
            {indiaPlaces[currentImageIndex].name}
          </div>
        </div>
        
        <div className="relative z-10 w-full max-w-5xl px-4 md:px-6 flex flex-col items-center text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-headline text-5xl md:text-8xl font-bold text-white mb-8 tracking-tighter leading-[0.9] drop-shadow-2xl"
          >
            Every Horizon <br/><span className="text-secondary">Told Better.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-white/80 mb-12 max-w-3xl font-medium drop-shadow-md px-4 leading-relaxed"
          >
            Experience the world through a new lens with AI-powered itineraries, 
            real-time web insights, and seamless budget optimization.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/95 backdrop-blur-2xl p-3 rounded-[2.5rem] w-full shadow-2xl flex flex-col md:flex-row gap-2 items-center border border-white/30 max-w-4xl"
          >
            <div className="flex flex-1 w-full items-center px-8 gap-4 py-4 md:py-0">
              <MapPin className="text-primary w-6 h-6 shrink-0" />
              <div className="flex flex-col items-start w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Destination</label>
                <input 
                  type="text" 
                  placeholder="Where to next?" 
                  className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface w-full placeholder:text-slate-300 font-bold text-lg"
                  value={searchLocation}
                  onChange={(e) => {
                    setSearchLocation(e.target.value);
                    handleSearch();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchLocation.trim()) {
                      e.preventDefault();
                      navigate(`/destinations/${encodeURIComponent(searchLocation.trim())}`);
                    }
                  }}
                />
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-100"></div>
            <div className="flex flex-1 w-full items-center px-8 gap-4 py-4 md:py-0">
              <Globe className="text-primary w-6 h-6 shrink-0" />
              <div className="flex flex-col items-start w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Budget</label>
                <div className="flex items-center w-full">
                  <span className="text-on-surface font-bold text-lg mr-1">₹</span>
                  <input 
                    type="number"
                    placeholder="Plan limit"
                    className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface w-full placeholder:text-slate-300 font-bold text-lg"
                    value={searchBudget}
                    onChange={(e) => setSearchBudget(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-100"></div>
            <div className="flex flex-1 w-full items-center px-8 gap-4 py-4 md:py-0">
              <Calendar className="text-primary w-6 h-6 shrink-0" />
              <div className="flex flex-col items-start w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Days</label>
                <div className="flex items-center w-full">
                  <input 
                    type="number"
                    placeholder="Days"
                    className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface w-full placeholder:text-slate-300 font-bold text-lg"
                    value={searchDays}
                    onChange={(e) => setSearchDays(e.target.value)}
                    min="1"
                    max="30"
                  />
                </div>
              </div>
            </div>
            <button 
              className="w-full md:w-auto px-12 py-5 rounded-[2rem] btn-primary shadow-2xl shadow-primary/20 font-black text-sm uppercase tracking-widest"
              onClick={handlePlanTrip}
              disabled={state.isLoading}
            >
              {state.isLoading ? 'Searching...' : 'Plan Journey'}
            </button>
          </motion.div>

          {/* Error display */}
          {state.error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-500/20 backdrop-blur-md rounded-xl text-white text-sm max-w-2xl"
            >
              {state.error}
            </motion.div>
          )}

          {/* Search results preview */}
          {state.searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full"
            >
              {state.searchResults.slice(0, 3).map((place) => (
                <div key={place.id} className="bg-white/90 backdrop-blur-md p-4 rounded-xl text-slate-800">
                  <h3 className="font-bold text-lg mb-2">{place.name}</h3>
                  <p className="text-sm text-slate-600 mb-2">{place.location.address}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-bold">₹{place.price?.toLocaleString()}/day</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">{place.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Trending Destinations */}
      {false && (
        <section className="py-16 md:py-24 px-6 md:px-8 max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 gap-4">
            <div>
              <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">Trending Destinations</h2>
              <p className="text-on-surface-variant max-w-xl text-sm md:text-base">Join thousands of travelers exploring these seasonal hotspots curated by our global network.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Dynamic content will go here */}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-32 bg-white px-8">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <div className="lg:w-1/2 space-y-12">
            <div className="space-y-4">
              <h4 className="text-secondary font-black uppercase tracking-[0.3em] text-sm">Engineered for Excellence</h4>
              <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter leading-[0.95]">
                Beyond Booking: <br/><span className="text-gradient">Intelligent Travel.</span>
              </h2>
              <p className="text-on-surface-variant text-lg max-w-xl">
                We've combined massive language models with real-time geospatial data to create the most accurate travel planner on the market.
              </p>
            </div>
            
            <div className="grid gap-8">
              {[
                { title: 'AI Orchestration', desc: 'Real-time adjustments to your itinerary based on weather, local events, and your energy levels.', icon: Sparkles, color: 'bg-blue-50 text-blue-600' },
                { title: 'Deterministic Pricing', desc: 'Our algorithms find the best value-for-money routes and stays without compromising quality.', icon: ShieldCheck, color: 'bg-green-50 text-green-600' },
                { title: 'Interactive Logistics', desc: 'Drag-and-drop itinerary builder with integrated Leaflet maps and local travel requirements.', icon: MapPin, color: 'bg-purple-50 text-purple-600' },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-6 group">
                  <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-500 shadow-sm", feature.color)}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h4>
                    <p className="text-on-surface-variant leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="relative card-premium p-4 overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1200"
                alt="App Experience"
                className="rounded-[1.5rem] w-full transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            {/* Stats Card Overlay */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="absolute -bottom-10 -left-10 glass-panel p-8 rounded-[2rem] shadow-2xl hidden md:block"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">100k+</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Happy Travelers</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-4 border-white" />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
