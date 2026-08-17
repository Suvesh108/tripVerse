import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, MapPin, Sparkles, Star, 
  ArrowRight, Globe, ChevronRight, X, Calendar, Wand2, Filter, RefreshCw, Key
} from 'lucide-react';
import { useApp } from '../lib/context';
import { Place } from '../lib/services';
import { cn } from '../lib/utils';
import { getGroqApiKey } from '../lib/apiKeyStorage';
import ApiSettingsModal from '../components/ApiSettingsModal';

const CURATED_DESTINATIONS: Place[] = [
  {
    id: 'curated-jaipur',
    name: 'Jaipur, Rajasthan',
    category: 'Famous Tourist Place',
    location: { lat: 26.9124, lon: 75.7873, address: 'Rajasthan, India' },
    rating: 4.8,
    price: 15000,
    description: 'The historic Pink City renowned for royal palaces, Hawa Mahal, ancient forts, and vibrant bazaars.',
    tags: ['Heritage', 'Culture', 'Palaces'],
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'curated-kerala',
    name: 'Kerala Backwaters',
    category: 'Famous Tourist Place',
    location: { lat: 9.4981, lon: 76.3388, address: 'Alleppey, Kerala, India' },
    rating: 4.9,
    price: 18000,
    description: 'Serene palm-fringed lagoons, traditional houseboat cruises, and tranquil coastal waterways.',
    tags: ['Nature', 'Waterways', 'Relaxation'],
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'curated-ladakh',
    name: 'Ladakh Mountains',
    category: 'Famous Tourist Place',
    location: { lat: 34.1526, lon: 77.5771, address: 'Ladakh, India' },
    rating: 4.9,
    price: 25000,
    description: 'High-altitude mountain passes, crystal-clear Pangong Lake, and historic Tibetan monasteries.',
    tags: ['Adventure', 'Mountains', 'Trekking'],
    image: 'https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'curated-goa',
    name: 'Goa Beaches',
    category: 'Famous Tourist Place',
    location: { lat: 15.2993, lon: 74.1240, address: 'Goa, India' },
    rating: 4.7,
    price: 12000,
    description: 'Sun-drenched coastal beaches, Portuguese colonial architecture, and lively seaside cafes.',
    tags: ['Beaches', 'Coastal', 'Nightlife'],
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'curated-varanasi',
    name: 'Varanasi Ghats',
    category: 'Famous Tourist Place',
    location: { lat: 25.3176, lon: 82.9739, address: 'Uttar Pradesh, India' },
    rating: 4.8,
    price: 9000,
    description: 'The ancient spiritual heart of India along the sacred Ganges river with Ganga Aarti and historic temples.',
    tags: ['Spiritual', 'Heritage', 'Ganges'],
    image: 'https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'curated-agra',
    name: 'Taj Mahal, Agra',
    category: 'Famous Tourist Place',
    location: { lat: 27.1751, lon: 78.0421, address: 'Agra, Uttar Pradesh, India' },
    rating: 5.0,
    price: 8000,
    description: 'One of the Seven Wonders of the World, the white marble mausoleum built by Mughal Emperor Shah Jahan.',
    tags: ['Wonder of the World', 'Mughal', 'Monument'],
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&q=80&w=800'
  }
];

export default function Explore() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    destinationType: [] as string[],
  });

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 768);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Listen for query parameters in URL (e.g. /explore?q=Paris&days=5)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      setSearchLocation(q.trim());
      setHasSearched(true);
      actions.searchDestinations(q.trim());
    }
  }, [searchParams]);

  // Direct 1-click plan generation from card
  const handlePlanForDestination = async (dest: Place) => {
    const groqKey = getGroqApiKey();
    if (!groqKey) {
      setIsApiModalOpen(true);
      return;
    }

    const daysParam = searchParams.get('days');
    const daysCount = (daysParam && parseInt(daysParam) > 0) ? parseInt(daysParam) : 5;
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + daysCount * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await actions.createTrip(`${dest.name} Adventure`, dest.name, today, endDate, 0);
    navigate(`/planner?destination=${encodeURIComponent(dest.name)}&days=${daysCount}&autoplan=true`);
  };

  // Use search results if available, otherwise display curated starter destinations
  const destinations: Place[] = state.searchResults.length > 0 ? state.searchResults : (hasSearched ? [] : CURATED_DESTINATIONS);

  const handleSearch = async () => {
    if (searchLocation.trim()) {
      setHasSearched(true);
      actions.searchDestinations(searchLocation.trim(), localFilters.destinationType);
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    const newFilters = { ...localFilters, [filterType]: value };
    setLocalFilters(newFilters);
    
    // Update global filters
    actions.updateFilters({
      preferences: newFilters.destinationType,
    });
  };

  const handleDestinationTypeToggle = (type: string) => {
    const currentTypes = [...localFilters.destinationType];
    const index = currentTypes.indexOf(type);
    
    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }
    
    handleFilterChange('destinationType', currentTypes);
  };

  const handleQuickSearch = (placeName: string) => {
    setSearchLocation(placeName);
    setHasSearched(true);
    actions.searchDestinations(placeName);
  };

  const handleResetSearch = () => {
    setSearchLocation('');
    setHasSearched(false);
    actions.searchDestinations('');
  };

  // Filter destinations based on local filters
  const filteredDestinations = destinations.filter(dest => {
    if (localFilters.destinationType.length > 0) {
      const hasMatchingTag = localFilters.destinationType.some(type =>
        dest.tags.some(tag => tag.toLowerCase().includes(type.toLowerCase())) ||
        dest.category.toLowerCase().includes(type.toLowerCase())
      );
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });

  return (
    <main className="pt-24 md:pt-28 pb-16 px-6 md:px-8 max-w-screen-2xl mx-auto">
      <header className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
          <Globe className="w-4 h-4" />
          <span>Open Exploration Engine</span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4 text-on-surface">
          Explore Destinations
        </h1>
        <p className="text-on-surface-variant text-sm md:text-lg max-w-2xl">
          Discover places across the globe with live OpenStreetMap data, Wikipedia insights, and open weather forecasts.
        </p>
        
        {/* Search Bar */}
        <div className="mt-6 relative max-w-2xl">
          <input
            type="text"
            placeholder="Search any destination worldwide (e.g. Paris, Tokyo, Jaipur, Goa)..."
            className="w-full bg-white border border-slate-200 rounded-full px-6 py-3.5 pr-14 text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent outline-none shadow-sm"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-sm"
            disabled={state.isLoading}
            title="Search Places"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <span className="text-xs text-slate-400 font-semibold">Popular:</span>
          {['Jaipur', 'Goa', 'Ladakh', 'Kerala', 'Paris', 'Tokyo', 'Varanasi'].map((city) => (
            <button
              key={city}
              onClick={() => handleQuickSearch(city)}
              className="text-xs px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 transition-colors font-medium"
            >
              {city}
            </button>
          ))}
        </div>
      </header>

      <div className="md:hidden mb-6">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full py-3 px-6 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-between font-bold text-primary"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </div>
          {showFilters ? <X className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {(showFilters || isLargeScreen) && (
            <motion.aside 
              initial={!isLargeScreen ? { height: 0, opacity: 0 } : false}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:col-span-4 lg:col-span-3 space-y-6 md:sticky md:top-28 overflow-hidden md:overflow-visible"
            >
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-headline text-lg font-bold mb-6 hidden md:flex items-center gap-2">
                  <Filter className="text-primary w-4 h-4" />
                  Filter Results
                </h3>
            
                <div className="mb-6">
                  <label className="block text-[10px] font-bold mb-3 uppercase tracking-wider text-slate-400">Category</label>
                  <div className="space-y-2.5">
                    {['Famous Tourist Place', 'Hotel', 'Restaurant', 'Heritage', 'Nature'].map((type) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={localFilters.destinationType.includes(type)}
                          onChange={() => handleDestinationTypeToggle(type)}
                          className="rounded border-slate-300 text-primary focus:ring-primary" 
                        />
                        <span className="text-on-surface-variant group-hover:text-primary transition-colors text-xs font-medium">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleSearch}
                  className="w-full py-3 bg-primary text-white rounded-full text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Apply Filter
                </button>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg border border-slate-700/50 hidden md:block">
                <span className="text-secondary font-bold text-[10px] tracking-widest uppercase block mb-2">Open Discovery</span>
                <h4 className="font-headline text-lg font-bold leading-tight mb-2">Real-Time Open Data</h4>
                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                  Search any city across the world to pull live OpenStreetMap places, Wikipedia insights, and Open-Meteo forecasts.
                </p>
                <Link 
                  to="/assistant" 
                  className="text-xs text-secondary font-bold hover:underline flex items-center gap-1"
                >
                  Ask AI Travel Assistant <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Destination Grid */}
        <section className="md:col-span-8 lg:col-span-9">
          {state.isLoading && (
            <div className="flex flex-col justify-center items-center py-20 bg-white rounded-3xl border border-slate-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Querying OpenStreetMap & Overpass API...</p>
            </div>
          )}
          
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-xs">
              {state.error}
            </div>
          )}

          {!state.isLoading && !state.error && filteredDestinations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredDestinations.map((dest) => (
                <motion.div 
                  key={dest.id}
                  whileHover={{ y: -4 }}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-60 overflow-hidden">
                      <img 
                        src={dest.image || "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&q=80&w=800"} 
                        alt={dest.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-on-surface">{dest.rating ? dest.rating.toFixed(1) : '4.5'}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 flex gap-1.5 flex-wrap">
                        {dest.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-headline text-xl font-bold mb-1 text-on-surface group-hover:text-primary transition-colors">{dest.name}</h3>
                          <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {dest.location?.address || 'City / Region'}
                          </div>
                        </div>
                      </div>
                      <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed mb-4">
                        {dest.description || 'Discover historic landmarks, local attractions, and cultural experiences in this destination.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex gap-2 w-full">
                    <button 
                      onClick={() => handlePlanForDestination(dest)}
                      className="flex-1 py-3 px-3 rounded-full font-bold text-xs bg-primary text-white hover:bg-primary/90 shadow-md flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-secondary" />
                      <span>Plan with AI</span>
                    </button>
                    <Link 
                      to={`/destinations/${encodeURIComponent(dest.name)}`}
                      className="py-3 px-4 rounded-full font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="View Full Route on Map"
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>Route Map</span>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!state.isLoading && !state.error && filteredDestinations.length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">
                {searchLocation ? `No results found for "${searchLocation}"` : 'No destinations match your filters'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                Try searching for a global city or landmark (e.g. Paris, Tokyo, London, Goa, Dubai, Bali), or reset your filters.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={handleResetSearch}
                  className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
                >
                  View Featured Destinations
                </button>
                {['Paris', 'Tokyo', 'London', 'Goa', 'Jaipur'].map(city => (
                  <button
                    key={city}
                    onClick={() => handleQuickSearch(city)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </main>
  );
}
