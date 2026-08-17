import { MapPin, Calendar, Star, Sparkles, ShieldCheck, Settings, Edit3, Globe, Bed, Plane, Utensils, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../lib/context';
import { debounce } from '../lib/services';
import { cn } from '../lib/utils';

export default function Home() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDays, setSearchDays] = useState('0');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const indiaPlaces = [
    { name: 'Taj Mahal, Agra', url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=1600' },
    { name: 'Hawa Mahal, Jaipur', url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=1600' },
    { name: 'Kerala Backwaters', url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=1600' },
    { name: 'Varanasi Ghats', url: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&q=80&w=1600' },
    { name: 'Ladakh Mountains', url: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&q=80&w=1600' },
    { name: 'Goa Beaches', url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=1600' }
  ];

  // Preload all hero background images on initial load
  useEffect(() => {
    indiaPlaces.forEach((place, index) => {
      const img = new Image();
      img.src = place.url;
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [index]: true }));
      };
    });

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % indiaPlaces.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim()) {
        actions.searchDestinations(query.trim());
      }
    }, 400),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearchLocation(value);
    debouncedSearch(value);
  };

  const handleSearchAndExplore = () => {
    const q = searchLocation.trim();
    const parsedDays = parseInt(searchDays);
    const d = parsedDays > 0 ? parsedDays.toString() : '5';

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (d) params.set('days', d);

    const queryString = params.toString();
    navigate(queryString ? `/explore?${queryString}` : '/explore');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden pt-20 bg-slate-950">
        {/* Seamless Stacked Background Crossfade */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-900">
          {indiaPlaces.map((place, idx) => {
            const isActive = idx === currentImageIndex;
            return (
              <div
                key={place.name}
                className={cn(
                  "absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-transform",
                  isActive ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
              >
                <img
                  src={place.url}
                  alt={place.name}
                  loading={idx < 2 ? "eager" : "lazy"}
                  decoding="async"
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-[7000ms] ease-out",
                    isActive ? "scale-105" : "scale-100"
                  )}
                  referrerPolicy="no-referrer"
                />
              </div>
            );
          })}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-black/40 to-black/30 z-20 pointer-events-none"></div>

          {/* Place Label & Slide Indicators */}
          <div className="absolute bottom-8 right-8 z-30 flex flex-col items-end gap-3 hidden md:flex">
            <div className="text-white/80 text-xs font-semibold tracking-widest uppercase bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
              📍 {indiaPlaces[currentImageIndex].name}
            </div>
            <div className="flex items-center gap-1.5">
              {indiaPlaces.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  onClick={() => setCurrentImageIndex(dotIdx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    dotIdx === currentImageIndex ? "w-6 bg-secondary" : "w-1.5 bg-white/40 hover:bg-white/70"
                  )}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
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
            real-time web insights, and seamless route optimization.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/95 backdrop-blur-2xl p-3 rounded-[2.5rem] w-full shadow-2xl flex flex-col md:flex-row gap-2 items-center border border-white/30 max-w-3xl"
          >
            <div className="flex flex-1 w-full items-center px-8 gap-4 py-4 md:py-0">
              <MapPin className="text-primary w-6 h-6 shrink-0" />
              <div className="flex flex-col items-start w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Destination</label>
                <input 
                  type="text" 
                  placeholder="Where to next? (e.g. Paris, Tokyo, Goa)" 
                  className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface w-full placeholder:text-slate-300 font-bold text-lg"
                  value={searchLocation}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchAndExplore();
                    }
                  }}
                />
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
                    placeholder="0" 
                    className="bg-transparent border-none focus:ring-0 focus:outline-none outline-none text-on-surface w-full placeholder:text-slate-300 font-bold text-lg"
                    value={searchDays}
                    onChange={(e) => setSearchDays(e.target.value)}
                    onFocus={() => {
                      if (searchDays === '0') setSearchDays('');
                    }}
                    onBlur={() => {
                      if (!searchDays || parseInt(searchDays) < 0) setSearchDays('0');
                    }}
                    min="0"
                    max="30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchAndExplore();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button 
                className="w-full md:w-auto px-10 py-4 rounded-full btn-primary shadow-xl font-black text-xs uppercase tracking-wider whitespace-nowrap"
                onClick={handleSearchAndExplore}
                disabled={state.isLoading}
                type="button"
              >
                {state.isLoading ? 'Searching...' : 'Explore & Plan'}
              </button>
            </div>
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
                <div 
                  key={place.id} 
                  onClick={() => navigate(`/destinations/${encodeURIComponent(place.name)}`)}
                  className="bg-white/95 backdrop-blur-md p-4 rounded-2xl text-slate-800 text-left cursor-pointer hover:shadow-xl transition-all group"
                >
                  <h3 className="font-bold text-base mb-1 text-primary group-hover:text-secondary transition-colors line-clamp-1">{place.name}</h3>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{place.description || place.location.address}</p>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span className="text-primary font-bold">{place.category || 'Popular Spot'}</span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{place.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Curated Destinations Section */}
      <section className="py-20 px-6 md:px-12 max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-2">Open Data Discovery</span>
            <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight text-on-surface">Trending Destinations</h2>
            <p className="text-on-surface-variant max-w-xl text-sm md:text-base mt-2">Explore iconic destinations with live weather, maps, and instant AI travel itineraries.</p>
          </div>
          <button 
            onClick={() => navigate('/explore')}
            className="text-primary font-bold text-sm hover:underline flex items-center gap-1.5"
          >
            Explore All Destinations <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              name: 'Jaipur, Rajasthan',
              tag: 'Heritage & Palaces',
              img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800',
              desc: 'The historic Pink City known for Hawa Mahal, Amer Fort, and royal heritage architecture.',
            },
            {
              name: 'Kerala Backwaters',
              tag: 'Nature & Serenity',
              img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800',
              desc: 'Tranquil palm-fringed canals, traditional houseboats, and lush coastal beauty in God’s Own Country.',
            },
            {
              name: 'Ladakh',
              tag: 'Himalayan Adventure',
              img: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&q=80&w=800',
              desc: 'Majestic mountain passes, crystal-clear high altitude lakes, and ancient Buddhist monasteries.',
            }
          ].map((item) => (
            <div 
              key={item.name}
              onClick={() => navigate(`/destinations/${encodeURIComponent(item.name)}`)}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer flex flex-col"
            >
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={item.img} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.tag}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-headline text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-primary">
                  <span>View Details & Map</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Open Source Highlights Section */}
      <section className="py-24 bg-white px-6 md:px-12 border-t border-slate-100">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-3">
              <span className="text-primary font-bold uppercase tracking-[0.25em] text-xs">Pure Open Source Architecture</span>
              <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight text-on-surface leading-tight">
                Built for Explorers, <br/><span className="text-primary">Not for Profit.</span>
              </h2>
              <p className="text-on-surface-variant text-base leading-relaxed">
                TripVerse is completely free and open source. No paid subscriptions, no paywalls, and no corporate advertising. Powered by open APIs and your own API keys.
              </p>
            </div>
            
            <div className="grid gap-6">
              {[
                { 
                  title: '100% Free & Open Source', 
                  desc: 'Licensed under Apache 2.0. Transparent codebase, zero commercial lock-in, and freedom to self-host.', 
                  icon: ShieldCheck, 
                  color: 'bg-emerald-50 text-emerald-600' 
                },
                { 
                  title: 'Bring-Your-Own-Key (BYOK)', 
                  desc: 'Store your free Groq AI and Tavily keys locally in your browser. Generate unlimited personalized itineraries at zero platform cost.', 
                  icon: Sparkles, 
                  color: 'bg-blue-50 text-primary' 
                },
                { 
                  title: 'OpenStreetMap & Open-Meteo', 
                  desc: 'Direct client-side geocoding, live weather forecasts, and interactive Leaflet map overlays with zero trackers.', 
                  icon: MapPin, 
                  color: 'bg-purple-50 text-purple-600' 
                },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", feature.color)}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold mb-1 text-on-surface">{feature.title}</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-slate-700/60">
              <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
              
              <span className="text-xs uppercase tracking-widest text-primary font-bold block mb-3">Open Source Stack</span>
              <h3 className="font-headline text-2xl md:text-3xl font-bold mb-4">Community-Driven Travel Intelligence</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                TripVerse connects modern web technologies directly with open APIs for ultra-fast, local-first performance.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block mb-1">AI Inference</span>
                  <span className="font-bold text-white text-sm">Groq Cloud (Llama 3.3)</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block mb-1">Mapping Engine</span>
                  <span className="font-bold text-white text-sm">Leaflet & OSM</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block mb-1">Live Weather</span>
                  <span className="font-bold text-white text-sm">Open-Meteo API</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 block mb-1">Currency Rates</span>
                  <span className="font-bold text-white text-sm">ExchangeRate API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
