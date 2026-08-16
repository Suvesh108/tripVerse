import { MapPin, Calendar, Thermometer, Wine, Camera, Mountain, ArrowRight, Star, ChevronRight, Wand2, Save, Navigation, DollarSign, RefreshCw, Info } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../lib/context';
import { getWeather, getWikiInfo, getPlaces, getDetailedInsights, calculateOptimalPath, Place, LEAFLET_TILE_URL, LEAFLET_ATTRIBUTION } from '../lib/services';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons (use CDN URLs to avoid TS module resolution issues)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function Destinations() {
  const { id } = useParams<{ id: string }>();
  const { state, actions } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const [destination, setDestination] = useState({
    name: '',
    location: { lat: 0, lon: 0 },
    description: '',
    bestTime: '',
    avgCost: 0,
    avgTemp: 0,
    weather: { temperature: 0, condition: '', humidity: 0, windSpeed: 0, icon: '' },
    nearbyPlaces: [] as Place[],
    highlights: [] as { title: string; desc: string; icon: string }[],
    areaInfo: '',
  });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Currency converter state
  const [currencyAmount, setCurrencyAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('INR');
  const [convertedResult, setConvertedResult] = useState<{ amount: number; rate: number } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'KRW'];

  const loadDestinationDetails = async () => {
    const targetDestination = id;
    
    setIsLoadingDetails(true);
    try {
      if (targetDestination) {
        // Fetch all categories in parallel for the map
        const [attractions, hotels, restaurants, weatherData, aiInsights] = await Promise.all([
          getPlaces(targetDestination, 'attraction'),
          getPlaces(targetDestination, 'Hotel'),
          getPlaces(targetDestination, 'Restaurant'),
          geocode(targetDestination).then(c => c ? getWeather(c.lat, c.lon) : null),
          getDetailedInsights(targetDestination)
        ]);
        
        const allPlaces = [...attractions.slice(0, 5), ...hotels.slice(0, 3), ...restaurants.slice(0, 3)];
        const sortedPlaces = calculateOptimalPath(allPlaces);
        
        if (sortedPlaces.length > 0) {
          const firstPlace = sortedPlaces[0];
          
          setDestination({
            name: targetDestination,
            location: { lat: firstPlace.location.lat, lon: firstPlace.location.lon },
            weather: weatherData || { temperature: 25, condition: 'Sunny', humidity: 45, windSpeed: 10, icon: '01d' },
            nearbyPlaces: sortedPlaces,
            description: aiInsights.history,
            areaInfo: aiInsights.areaInfo,
            highlights: aiInsights.highlights,
            bestTime: 'Consult local guides',
            avgCost: 20000,
            avgTemp: weatherData?.temperature || 22,
          });
        }
      } else {
        // Default to India if no search
        setDestination({
          name: '',
          location: { lat: 20.5937, lon: 78.9629 },
          description: 'Search for your dream destination to see detailed insights, weather, and top-rated attractions. From the peaks of the Himalayas to the beaches of Goa, your next story starts here.',
          areaInfo: 'Discover the diverse landscapes and cultures across the subcontinent.',
          highlights: [
            { title: 'Global Gateway', desc: 'Connect to any corner of the world', icon: 'Globe' },
            { title: 'AI Curated', desc: 'Personalized recommendations for every traveler', icon: 'Sparkles' },
            { title: 'Smart Budgeting', desc: 'Optimize your spending without missing out', icon: 'DollarSign' }
          ],
          bestTime: 'Year-round',
          avgCost: 0,
          avgTemp: 25,
          weather: { temperature: 25, condition: 'Sunny', humidity: 45, windSpeed: 10, icon: '01d' },
          nearbyPlaces: [],
        });
      }
    } catch (error) {
      console.error('Error loading destination details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadDestinationDetails();
  }, [id]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || !destination.location.lat || leafletMapRef.current) return;

    const map = L.map(mapRef.current).setView(
      [destination.location.lat, destination.location.lon],
      id ? 12 : 5
    );

    L.tileLayer(LEAFLET_TILE_URL, {
      attribution: LEAFLET_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Add markers for nearby places
    destination.nearbyPlaces.forEach((place, idx) => {
      if (place.location.lat && place.location.lon) {
        const isHotel = place.category.toLowerCase().includes('hotel') || place.category.toLowerCase().includes('hostel');
        const isRestaurant = place.category.toLowerCase().includes('restaurant') || place.category.toLowerCase().includes('cafe');
        
        const markerColor = isHotel ? '#10b981' : isRestaurant ? '#f59e0b' : '#005f9b';
        const markerIcon = isHotel ? '🏨' : isRestaurant ? '🍽️' : '📍';

        const customIcon = L.divIcon({
          className: 'custom-place-marker',
          html: `<div style="width: 24px; height: 24px; background: ${markerColor}; border-radius: 50%; border: 2px solid white; display: flex; items-center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${markerIcon}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([place.location.lat, place.location.lon], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: Inter, sans-serif; min-width: 150px;">
              <div style="font-size: 10px; font-weight: bold; color: ${markerColor}; text-transform: uppercase; margin-bottom: 2px;">Step ${idx + 1}: ${place.category}</div>
              <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${place.name}</strong>
              <div style="color: #005f9b; font-weight: bold; font-size: 12px; margin-top: 4px;">⭐ ${place.rating.toFixed(1)}</div>
            </div>
          `);
      }
    });

    // Main destination marker
    const mainIcon = L.divIcon({
      className: 'custom-main-marker',
      html: `<div style="width: 20px; height: 20px; background: #005f9b; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([destination.location.lat, destination.location.lon], { icon: mainIcon })
      .addTo(map)
      .bindPopup(`<strong>${destination.name || 'Explore India'}</strong>`)
      .openPopup();

    leafletMapRef.current = map;

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [destination.location.lat, destination.location.lon, destination.nearbyPlaces]);

  const handleConvertCurrency = async () => {
    const amount = parseFloat(currencyAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsConverting(true);
    try {
      const result = await actions.convertCurrency(amount, fromCurrency, toCurrency);
      setConvertedResult({ amount: result.convertedAmount, rate: result.rate });
    } catch (error) {
      console.error('Error converting currency:', error);
    } finally {
      setIsConverting(false);
    }
  };

  const handleAddToPlanner = () => {
    if (!destination.name) return;
    actions.createTrip(
      `${destination.name} Adventure`,
      destination.name,
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      2000
    );
  };

  const premiumStays: any[] = [];

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[85vh] w-full overflow-hidden flex flex-col justify-end">
        <img
          src={id ? `https://picsum.photos/seed/${destination.name}/1920/1080` : "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=1920"}
          alt={destination.name || 'Travel'}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        
        <div className="relative z-10 px-6 md:px-12 pb-16 md:pb-24 pt-32 max-w-screen-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-white text-xs md:text-sm mb-4 md:mb-6 w-fit border border-white/20">
              <Info className="w-3 h-3 md:w-4 h-4" />
              <span className="font-medium tracking-wide uppercase">Destination Insights</span>
            </div>
            <h1 className="font-headline text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter text-on-surface mb-4 leading-none drop-shadow-sm">
              {id ? destination.name : "Discover Your Next Adventure"}
            </h1>
            <p className="text-on-surface-variant max-w-2xl text-base md:text-xl leading-relaxed line-clamp-3 md:line-clamp-none font-medium text-shadow-sm">
              {destination.description}
            </p>
            {isLoadingDetails && (
              <div className="mt-6 flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                <span className="text-sm font-medium">Curating details...</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-6 md:px-12 max-w-screen-2xl mx-auto -mt-8 md:-mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Overview Card */}
            <div className="md:col-span-2 bg-white rounded-3xl p-6 md:p-10 shadow-sm">
              <h2 className="font-headline text-2xl md:text-3xl font-bold mb-6">Historical Context</h2>
              <div className="space-y-4 text-on-surface-variant leading-relaxed text-sm md:text-base">
                <p>{destination.description}</p>
                <h3 className="font-headline text-xl font-bold mt-8">About the Area</h3>
                <p>{destination.areaInfo}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 md:mt-10">
                {[
                  { label: 'Best Time', val: destination.bestTime, icon: Calendar },
                  { label: 'Est. Cost', val: `₹${destination.avgCost.toLocaleString()} / Day`, icon: Save },
                  { label: 'Avg Temp', val: `${destination.avgTemp}°C / ${Math.round(destination.avgTemp * 1.8 + 32)}°F`, icon: Thermometer },
                ].map(stat => (
                  <div key={stat.label} className="p-4 md:p-6 bg-slate-50 rounded-2xl text-center flex sm:flex-col items-center sm:justify-center gap-4 sm:gap-2">
                    <stat.icon className="text-primary w-5 h-5 shrink-0" />
                    <div className="text-left sm:text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="font-headline font-bold text-base md:text-lg">{stat.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="md:col-span-2 bg-white rounded-3xl overflow-hidden shadow-sm h-[300px] md:h-[500px] relative">
              <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg">
                <h3 className="font-headline font-bold text-xl">Island Map</h3>
                <p className="text-sm text-on-surface-variant">Explore the Caldera rim</p>
                <div className="flex items-center gap-2 mt-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-xs text-slate-500">Interactive • Scroll to zoom</span>
                </div>
              </div>
              
              {/* Weather Overlay */}
              <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{destination.weather.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{destination.weather.temperature}°C</p>
                    <p className="text-xs text-slate-500">{destination.weather.condition}</p>
                  </div>
                </div>
              </div>

              {/* Leaflet Map Container */}
              <div ref={mapRef} className="w-full h-full z-0" />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-8">
              <div className="bg-gradient-to-br from-primary to-tertiary rounded-3xl p-8 text-white shadow-xl">
                <h3 className="font-headline text-2xl font-bold mb-2">Ready to Wander?</h3>
                <p className="text-blue-100/80 mb-8 leading-relaxed">Let our AI help you craft the perfect itinerary through the white-washed streets of Oia and beyond.</p>
                <button 
                  onClick={handleAddToPlanner}
                  className="w-full bg-white text-primary font-bold py-4 rounded-full flex items-center justify-center gap-3 hover:bg-blue-50 transition-all group"
                >
                  <Wand2 className="w-5 h-5" />
                  Add to Planner
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Currency Converter */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                <h4 className="font-headline font-bold text-lg mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Currency Converter
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Amount</label>
                    <input
                      type="number"
                      value={currencyAmount}
                      onChange={(e) => setCurrencyAmount(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-transparent"
                      placeholder="100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">From</label>
                      <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                      >
                        {popularCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">To</label>
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                      >
                        {popularCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleConvertCurrency}
                    disabled={isConverting}
                    className="w-full py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConverting ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Converting...</>
                    ) : (
                      <>Convert <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                  {convertedResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                    >
                      <p className="text-xs text-slate-500 mb-1">Result</p>
                      <p className="text-2xl font-bold text-primary">
                        {convertedResult.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toCurrency}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Rate: 1 {fromCurrency} = {convertedResult.rate.toFixed(4)} {toCurrency}
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <h4 className="font-headline font-bold text-lg mb-6">Experience Highlights</h4>
                <div className="space-y-6">
                  {destination.highlights.map(item => {
                    const icons: Record<string, any> = { MapPin, Camera, Wine, Mountain, Globe, Sparkles, DollarSign, Utensils };
                    const IconComponent = icons[item.icon] || Info;
                    return (
                      <div key={item.title} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">{item.title}</p>
                          <p className="text-xs text-on-surface-variant">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Premium Stays */}
      <section className="mt-32 pb-32 px-12 max-w-screen-2xl mx-auto">
        <div className="bg-slate-50 rounded-[3rem] p-16">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-[0.3em] uppercase text-xs block mb-4">The Collection</span>
            <h2 className="font-headline text-5xl font-bold tracking-tight">Premium Stays</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {premiumStays.map(hotel => (
              <div key={hotel.name} className="bg-white rounded-3xl overflow-hidden shadow-sm group">
                <div className="h-64 overflow-hidden relative">
                  <img src={`https://picsum.photos/seed/${hotel.img}/800/600`} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold shadow-md">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {hotel.rating}
                  </div>
                  <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur px-2 py-1 rounded-full text-white text-[8px] font-bold uppercase">
                    {hotel.type}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="font-headline text-2xl font-bold mb-2">{hotel.name}</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Exquisite infinity pools carved into the cliffside with panoramic caldera views.</p>
                  <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">From</p>
                      <p className="text-xl font-bold">₹{hotel.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ night</span></p>
                    </div>
                    <button className="text-primary font-bold hover:translate-x-1 transition-transform flex items-center gap-1">
                      Book <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
