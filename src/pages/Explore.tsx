import { Search, Filter, RefreshCw, Star, ArrowRight, MapPin, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useApp } from '../lib/context';
import { Place } from '../lib/services';

export default function Explore() {
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [localFilters, setLocalFilters] = useState({
    destinationType: [] as string[],
    budgetRange: 50000,
  });

  useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 768);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Use search results from global state
  const destinations: Place[] = state.searchResults;

  const handleSearch = async () => {
    if (searchLocation.trim()) {
      actions.searchDestinations(searchLocation, localFilters.destinationType);
      navigate(`/destinations/${encodeURIComponent(searchLocation.trim())}`);
    }
  };

  const handleFilterChange = (filterType: string, value: any) => {
    const newFilters = { ...localFilters, [filterType]: value };
    setLocalFilters(newFilters);
    
    // Update global filters
    actions.updateFilters({
      budget: newFilters.budgetRange,
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

  const applyFilters = () => {
    handleSearch();
  };

  // Filter destinations based on local filters
  const filteredDestinations = destinations.filter(dest => {
    if (localFilters.budgetRange && dest.price && dest.price > localFilters.budgetRange) {
      return false;
    }
    
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
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3 md:mb-4 text-on-surface">
          Explore the <span className="text-primary">Digital Horizon</span>
        </h1>
        <p className="text-on-surface-variant text-sm md:text-lg max-w-2xl">
          Discover curated experiences designed for the modern explorer. From neon-lit cityscapes to tranquil alpine retreats.
        </p>
        
        {/* Search Bar */}
        <div className="mt-6 relative max-w-2xl">
          <input
            type="text"
            placeholder="Search destinations..."
            className="w-full bg-white border border-slate-200 rounded-full px-6 py-3 pr-12 focus:ring-2 focus:ring-primary/20 focus:border-transparent"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            disabled={state.isLoading}
          >
            <Search className="w-4 h-4" />
          </button>
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
              className="md:col-span-4 lg:col-span-3 space-y-8 md:sticky md:top-28 overflow-hidden md:overflow-visible"
            >
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-headline text-xl font-bold mb-6 hidden md:flex items-center gap-2">
                  <Filter className="text-primary w-5 h-5" />
                  Filters
                </h3>
            
                <div className="mb-8">
                  <label className="block text-xs font-bold mb-4 uppercase tracking-wider text-slate-400">Destination Type</label>
                  <div className="space-y-3">
                    {['Famous Tourist Place', 'Hotel', 'Restaurant'].map((type) => (
                      <label key={type} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={localFilters.destinationType.includes(type)}
                          onChange={() => handleDestinationTypeToggle(type)}
                          className="rounded border-slate-300 text-primary focus:ring-primary" 
                        />
                        <span className="text-on-surface-variant group-hover:text-primary transition-colors text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Budget Range</label>
                    <span className="text-primary font-bold text-sm">₹{localFilters.budgetRange.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10000"
                    max="500000"
                    step="5000"
                    value={localFilters.budgetRange}
                    onChange={(e) => handleFilterChange('budgetRange', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                </div>

                <button 
                  onClick={applyFilters}
                  className="w-full py-4 bg-primary text-white rounded-full font-bold hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                  Update View
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-2xl aspect-video lg:aspect-square group shadow-xl hidden md:block">
                <img 
                  src="https://picsum.photos/seed/alpine/800/800" 
                  alt="Promo" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <span className="text-cyan-400 font-bold text-xs tracking-widest uppercase mb-2">Member Special</span>
                  <h4 className="text-white font-headline text-2xl font-bold leading-tight mb-4">Unlock 15% off Alpine tours this winter</h4>
                  <a href="#" className="text-white border-b border-white/30 pb-1 self-start hover:border-white transition-all text-sm font-medium">Claim Offer</a>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Destination Grid */}
        <section className="md:col-span-8 lg:col-span-9">
          {state.isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {state.error}
            </div>
          )}

          {!state.isLoading && !state.error && filteredDestinations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {filteredDestinations.map((dest) => (
                <motion.div 
                  key={dest.id}
                  whileHover={{ y: -5 }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-72 overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/${dest.name}/800/600`} 
                      alt={dest.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-on-surface">{dest.rating.toFixed(1)}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {dest.tags.map(tag => (
                        <span key={tag} className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-headline text-2xl font-bold mb-1">{dest.name}</h3>
                        <div className="flex items-center gap-1 text-on-surface-variant text-sm">
                          <MapPin className="w-3 h-3" />
                          {dest.location.address}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-on-surface-variant text-[10px] uppercase tracking-tighter">Starting at</span>
                        <span className="text-2xl font-bold text-primary">₹{dest.price?.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-on-surface-variant text-sm mb-8 line-clamp-2">
                      {dest.description || 'Experience the best of what this destination has to offer with curated activities and premium accommodations.'}
                    </p>
                    <Link 
                      to={`/destinations/${encodeURIComponent(dest.name)}`}
                      className="w-full py-4 border border-slate-200 rounded-full font-bold text-primary group-hover:bg-primary group-hover:text-white group-hover:border-transparent transition-all flex items-center justify-center gap-2"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!state.isLoading && !state.error && filteredDestinations.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 italic text-slate-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Search for a destination to start exploring.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
