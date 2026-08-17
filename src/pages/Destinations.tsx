import { 
  MapPin, Navigation, Share2, ExternalLink, Copy, Check, 
  Search, ArrowRight, Sparkles, Wand2, Compass, Layers, 
  Car, Footprints, RefreshCw, ChevronLeft, ChevronRight, Eye, Info,
  Globe2, ZoomIn, ZoomOut, ArrowUpRight
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef, useMemo, type FormEvent } from 'react';
import { useApp } from '../lib/context';
import { 
  geocode, getPlaces, calculateOptimalPath, Place, 
  LEAFLET_TILE_URL, LEAFLET_ATTRIBUTION, getWikiThumbnail, getWikiInfo 
} from '../lib/services';
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

// Global World Destinations with authentic coordinates
const WORLD_DESTINATIONS = [
  { name: 'Paris, France', lat: 48.8566, lon: 2.3522, tag: 'Culture & Romance', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600' },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, tag: 'Futuristic & Tradition', img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=600' },
  { name: 'Rome, Italy', lat: 41.9028, lon: 12.4964, tag: 'Ancient History', img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=600' },
  { name: 'Jaipur, Rajasthan', lat: 26.9124, lon: 75.7873, tag: 'Royal Palaces', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=600' },
  { name: 'London, UK', lat: 51.5074, lon: -0.1278, tag: 'Heritage & Landmarks', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600' },
  { name: 'New York, USA', lat: 40.7128, lon: -74.0060, tag: 'Skyline & Urban', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=600' },
  { name: 'Dubai, UAE', lat: 25.2048, lon: 55.2708, tag: 'Luxury & Architecture', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600' },
  { name: 'Bali, Indonesia', lat: -8.4095, lon: 115.1889, tag: 'Tropical Paradise', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=600' },
  { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, tag: 'Pyramids & Nile', img: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, tag: 'Harbor & Coast', img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&q=80&w=600' },
  { name: 'Goa, India', lat: 15.2993, lon: 74.1240, tag: 'Beaches & Heritage', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=600' },
  { name: 'Kyoto, Japan', lat: 35.0116, lon: 135.7681, tag: 'Shrines & Zen Gardens', img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Varanasi, India', lat: 25.3176, lon: 82.9739, tag: 'Spiritual Ghats', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=600' }
];

export default function Destinations() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, actions } = useApp();

  const [searchQuery, setSearchQuery] = useState(id || '');
  const [currentDestinationName, setCurrentDestinationName] = useState(id || '');
  const [routePlaces, setRoutePlaces] = useState<Place[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // View state: 'world' overview or 'route' zoomed in
  const [isWorldView, setIsWorldView] = useState(!id && !state.currentTrip?.plan);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Start with global world view
    const map = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 2,
      maxZoom: 18,
    }).setView([25, 10], 2.5);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer(LEAFLET_TILE_URL, { attribution: LEAFLET_ATTRIBUTION }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Show World Pins when in World View (including user planned trips)
  const renderWorldPins = () => {
    if (!leafletMapRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Render user's active planned trips first with glowing badges
    state.trips.forEach((trip) => {
      if (trip.plan?.itinerary && trip.plan.itinerary.length > 0) {
        const firstAct = trip.plan.itinerary[0]?.activities[0];
        if (firstAct && firstAct.lat && firstAct.lon) {
          const tripIcon = L.divIcon({
            className: 'world-marker-planned',
            html: `
              <div style="
                background: linear-gradient(135deg, #005f9b, #009387);
                color: white;
                padding: 5px 10px;
                border-radius: 9999px;
                font-size: 11px;
                font-weight: 900;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 5px;
                border: 2.5px solid #ffcc00;
                box-shadow: 0 4px 16px rgba(0,95,155,0.6);
                cursor: pointer;
                transform: scale(1.05);
              ">
                <span>⭐</span>
                <span>${trip.name || trip.destination}</span>
                <span style="background: rgba(255,255,255,0.25); padding: 1px 5px; border-radius: 9999px; font-size: 9px;">${trip.plan.itinerary.length}d</span>
              </div>
            `,
            iconSize: [140, 32],
            iconAnchor: [70, 16],
          });

          const marker = L.marker([firstAct.lat, firstAct.lon], { icon: tripIcon }).addTo(layer);
          marker.on('click', () => {
            handleSelectDestination(trip.destination);
          });
        }
      }
    });

    // Standard global destinations
    WORLD_DESTINATIONS.forEach((dest) => {
      const customIcon = L.divIcon({
        className: 'world-marker',
        html: `
          <div style="
            background: #005f9b;
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            border: 2px solid white;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            <span style="font-size: 12px;">📍</span>
            <span>${dest.name.split(',')[0]}</span>
          </div>
        `,
        iconSize: [100, 30],
        iconAnchor: [50, 15],
      });

      const marker = L.marker([dest.lat, dest.lon], { icon: customIcon }).addTo(layer);
      
      marker.on('click', () => {
        handleSelectDestination(dest.name);
      });
    });
  };

  // Fetch Destination Route Data & Zoom In (Directly loads planned itinerary if available)
  const loadRouteForDestination = async (destName: string) => {
    const clean = destName.trim();
    if (!clean) return;

    setIsLoading(true);
    setCurrentDestinationName(clean);
    setIsWorldView(false);
    setSelectedDayFilter('all');

    try {
      // 1. Resolve center
      const coords = await geocode(clean);
      if (!coords) {
        setIsLoading(false);
        return;
      }

      // Fly camera into target city smoothly
      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([coords.lat, coords.lon], 13, { duration: 1.5 });
      }

      // 2. CHECK IF THIS DESTINATION HAS AN ACTIVE PLANNED ITINERARY
      const matchingTrip = (
        state.currentTrip &&
        (
          state.currentTrip.destination.toLowerCase() === clean.toLowerCase() ||
          clean.toLowerCase().includes(state.currentTrip.destination.toLowerCase()) ||
          state.currentTrip.destination.toLowerCase().includes(clean.toLowerCase())
        ) &&
        state.currentTrip.plan?.itinerary
      ) 
        ? state.currentTrip 
        : state.trips.find(t => 
            t.plan?.itinerary &&
            (
              t.destination.toLowerCase() === clean.toLowerCase() ||
              clean.toLowerCase().includes(t.destination.toLowerCase()) ||
              t.destination.toLowerCase().includes(clean.toLowerCase())
            )
          );

      if (matchingTrip && matchingTrip.plan?.itinerary && matchingTrip.plan.itinerary.length > 0) {
        const plannedPlaces: Place[] = [];
        matchingTrip.plan.itinerary.forEach((dayPlan) => {
          dayPlan.activities.forEach((act, aIdx) => {
            plannedPlaces.push({
              id: `planned-d${dayPlan.day}-a${aIdx}`,
              name: act.name,
              category: act.type || 'sightseeing',
              rating: 4.9,
              description: act.description || `Day ${dayPlan.day} Stop in ${matchingTrip.destination}`,
              location: {
                lat: act.lat || coords.lat,
                lon: act.lon || coords.lon,
                address: `${act.name}, ${clean}`,
              },
              tags: [`Day ${dayPlan.day}`, act.type || 'sightseeing'],
            });
          });
        });

        if (plannedPlaces.length > 0) {
          setRoutePlaces(plannedPlaces);
          setSelectedPlaceId(plannedPlaces[0]?.id || null);
          setIsLoading(false);
          return;
        }
      }

      // 3. Fallback: Query live places if not yet planned
      const [attractions, hotels, restaurants, wikiImg, wikiDesc] = await Promise.all([
        getPlaces(clean, 'Famous Tourist Place'),
        getPlaces(clean, 'Hotel'),
        getPlaces(clean, 'Restaurant'),
        getWikiThumbnail(clean),
        getWikiInfo(clean)
      ]);

      const baseCenterPlace: Place = {
        id: `center-${clean.toLowerCase()}`,
        name: `${clean} Hub`,
        location: { lat: coords.lat, lon: coords.lon, address: clean },
        category: 'Famous Tourist Place',
        rating: 4.9,
        description: wikiDesc,
        image: wikiImg,
        tags: ['Destination', 'Center'],
      };

      const candidateList = [
        baseCenterPlace,
        ...attractions.slice(0, 5),
        ...restaurants.slice(0, 2),
        ...hotels.slice(0, 1)
      ];

      const seen = new Set<string>();
      const unique = candidateList.filter(p => {
        const key = `${p.location.lat.toFixed(3)}_${p.location.lon.toFixed(3)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const sequencedRoute = calculateOptimalPath(unique);
      setRoutePlaces(sequencedRoute);
      setSelectedPlaceId(sequencedRoute[0]?.id || null);
    } catch (err) {
      console.error('Failed to load destination route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDestination = (destName: string) => {
    setSearchQuery(destName);
    navigate(`/destinations/${encodeURIComponent(destName)}`);
    loadRouteForDestination(destName);
  };

  const handleResetToWorldMap = () => {
    setIsWorldView(true);
    setCurrentDestinationName('');
    setRoutePlaces([]);
    navigate('/destinations');
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([25, 10], 2.5, { duration: 1.2 });
    }
    renderWorldPins();
  };

  // Initial load: If id is present, load it. If not, auto-load current planned trip if one exists!
  useEffect(() => {
    if (id) {
      setSearchQuery(id);
      loadRouteForDestination(id);
    } else if (state.currentTrip?.plan?.itinerary && state.currentTrip.plan.itinerary.length > 0) {
      // Directly load planned trip onto the map
      setSearchQuery(state.currentTrip.destination);
      loadRouteForDestination(state.currentTrip.destination);
    } else {
      setIsWorldView(true);
      renderWorldPins();
    }
  }, [id, state.currentTrip?.id, state.currentTrip?.plan]);

  // Available planned days in this destination
  const availableDays = useMemo(() => {
    const daySet = new Set<string>();
    routePlaces.forEach(p => {
      p.tags?.forEach(tag => {
        if (tag.startsWith('Day ')) {
          daySet.add(tag.replace('Day ', ''));
        }
      });
    });
    return Array.from(daySet).sort((a, b) => parseInt(a) - parseInt(b));
  }, [routePlaces]);

  // Displayed places (filtered by day if selected)
  const displayedRoutePlaces = useMemo(() => {
    if (selectedDayFilter === 'all') return routePlaces;
    return routePlaces.filter(p => p.tags?.includes(`Day ${selectedDayFilter}`));
  }, [routePlaces, selectedDayFilter]);

  // Update Leaflet Route & Markers when displayedRoutePlaces changes
  useEffect(() => {
    if (isWorldView || !leafletMapRef.current || !markersLayerRef.current) return;

    const map = leafletMapRef.current;
    const layer = markersLayerRef.current;

    layer.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (displayedRoutePlaces.length === 0) return;

    const latLngs: L.LatLngExpression[] = [];
    const bounds = L.latLngBounds([]);

    displayedRoutePlaces.forEach((place, index) => {
      const { lat, lon } = place.location;
      latLngs.push([lat, lon]);
      bounds.extend([lat, lon]);

      const isFirst = index === 0;
      const isLast = index === displayedRoutePlaces.length - 1;
      const isSelected = place.id === selectedPlaceId;

      const bgColor = isFirst ? '#10b981' : isLast ? '#ef4444' : isSelected ? '#f59e0b' : '#005f9b';

      const customIcon = L.divIcon({
        className: 'route-marker',
        html: `
          <div style="
            background: ${bgColor};
            color: white;
            width: ${isSelected ? '36px' : '30px'};
            height: ${isSelected ? '36px' : '30px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: ${isSelected ? '14px' : '12px'};
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(layer);
      
      const dayTag = place.tags?.find(t => t.startsWith('Day '));
      const popupHtml = `
        <div style="font-family: inherit; padding: 4px; min-width: 180px;">
          <span style="font-size: 10px; font-weight: 700; color: #005f9b; text-transform: uppercase;">${dayTag ? `${dayTag} • ` : ''}Stop ${index + 1} of ${displayedRoutePlaces.length}</span>
          <h4 style="margin: 2px 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${place.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.3;">${place.location.address || ''}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; color: #0f172a;">
            <span>⭐ ${place.rating ? place.rating.toFixed(1) : '4.8'}</span>
            <span style="color: #10b981;">${place.category}</span>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedPlaceId(place.id);
      });
    });

    // Draw route polyline connecting all stops
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#005f9b',
        weight: 4,
        opacity: 0.85,
        dashArray: travelMode === 'walking' ? '8, 8' : undefined,
        lineJoin: 'round',
      }).addTo(map);

      polylineRef.current = polyline;
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [displayedRoutePlaces, travelMode, selectedPlaceId, isWorldView]);

  // Route statistics
  const totalStats = useMemo(() => {
    let totalDist = 0;
    for (let i = 0; i < displayedRoutePlaces.length - 1; i++) {
      totalDist += getDistanceKm(
        displayedRoutePlaces[i].location.lat,
        displayedRoutePlaces[i].location.lon,
        displayedRoutePlaces[i + 1].location.lat,
        displayedRoutePlaces[i + 1].location.lon
      );
    }
    const speed = travelMode === 'driving' ? 35 : 4.5; // km/h
    const hours = totalDist / speed;
    const estTime = hours < 1 
      ? `${Math.round(hours * 60)} mins` 
      : `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;

    return {
      totalKm: Number(totalDist.toFixed(1)),
      estTime,
      stopCount: displayedRoutePlaces.length
    };
  }, [displayedRoutePlaces, travelMode]);

  // Generate Direct External Map Links
  const googleMapsUrl = useMemo(() => {
    if (displayedRoutePlaces.length === 0) return '';
    const origin = `${displayedRoutePlaces[0].location.lat},${displayedRoutePlaces[0].location.lon}`;
    const destination = `${displayedRoutePlaces[displayedRoutePlaces.length - 1].location.lat},${displayedRoutePlaces[displayedRoutePlaces.length - 1].location.lon}`;
    const waypoints = displayedRoutePlaces
      .slice(1, -1)
      .map(p => `${p.location.lat},${p.location.lon}`)
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}&travelmode=${travelMode}`;
  }, [displayedRoutePlaces, travelMode]);

  const appleMapsUrl = useMemo(() => {
    if (displayedRoutePlaces.length === 0) return '';
    const origin = `${displayedRoutePlaces[0].location.lat},${displayedRoutePlaces[0].location.lon}`;
    const destination = `${displayedRoutePlaces[displayedRoutePlaces.length - 1].location.lat},${displayedRoutePlaces[displayedRoutePlaces.length - 1].location.lon}`;
    return `https://maps.apple.com/?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}`;
  }, [displayedRoutePlaces]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSelectDestination(searchQuery.trim());
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFlyToPlace = (place: Place) => {
    setSelectedPlaceId(place.id);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([place.location.lat, place.location.lon], 15, {
        duration: 1.2
      });
    }
  };

  const handlePlanItinerary = async () => {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await actions.createTrip(`${currentDestinationName} Route`, currentDestinationName, today, endDate, 0);
    navigate(`/planner?destination=${encodeURIComponent(currentDestinationName)}&days=5&autoplan=true`);
  };

  return (
    <main className="pt-20 h-screen w-full flex flex-col bg-slate-950 overflow-hidden relative font-sans">
      
      {/* Top Floating Command Bar */}
      <header className="absolute top-24 left-4 right-4 md:left-8 md:right-8 z-30 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        
        {/* Destination Search & Chips */}
        <div className="w-full md:w-auto flex flex-col gap-2 pointer-events-auto">
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 pl-4 rounded-full shadow-2xl border border-white/40 max-w-md w-full"
          >
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <input
              type="text"
              placeholder="Search any destination on Earth (e.g. Paris, Tokyo, Goa)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-800 w-full placeholder:text-slate-400 placeholder:font-normal"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
              title="Search Route"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {WORLD_DESTINATIONS.slice(0, 6).map(dest => (
              <button
                key={dest.name}
                onClick={() => handleSelectDestination(dest.name)}
                className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white/90 hover:text-white hover:bg-slate-900 rounded-full text-[10px] font-bold border border-white/10 transition-all shrink-0"
              >
                {dest.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Route Stats & Action Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
          
          {/* World vs Route Switcher */}
          <button
            onClick={isWorldView ? () => handleSelectDestination(WORLD_DESTINATIONS[0].name) : handleResetToWorldMap}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/90 backdrop-blur-md hover:bg-white text-slate-800 rounded-full text-xs font-bold shadow-xl border border-white/40 transition-all"
          >
            <Globe2 className="w-3.5 h-3.5 text-primary" />
            <span>{isWorldView ? 'World Overview' : 'Zoom Out to World'}</span>
          </button>

          {/* Mode Switcher (visible when route is active) */}
          {!isWorldView && (
            <div className="bg-white/90 backdrop-blur-md p-1 rounded-full border border-white/40 shadow-xl flex items-center gap-1">
              <button
                onClick={() => setTravelMode('driving')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                  travelMode === 'driving' ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Drive</span>
              </button>
              <button
                onClick={() => setTravelMode('walking')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                  travelMode === 'walking' ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Walk</span>
              </button>
            </div>
          )}

          {/* Share Route Dropdown/Modal Trigger */}
          {!isWorldView && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-slate-950 rounded-full font-black text-xs shadow-2xl hover:bg-secondary/90 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Route</span>
            </button>
          )}

          {/* Plan AI Trip for this route */}
          {!isWorldView && (
            <button
              onClick={handlePlanItinerary}
              className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-xs shadow-2xl hover:bg-primary/90 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Plan Itinerary</span>
            </button>
          )}
        </div>
      </header>

      {/* Full-Screen Interactive Leaflet Map */}
      <div className="flex-1 w-full h-full relative z-0">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* World Map Explorer Carousel (when in World View) */}
      {isWorldView && (
        <div className="absolute bottom-6 left-4 right-4 md:left-8 md:right-8 z-30 pointer-events-none">
          <div className="bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-2xl pointer-events-auto max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-secondary" />
                <h3 className="text-white text-xs font-bold uppercase tracking-wider">Explore Global Horizons & Planned Trips</h3>
              </div>
              <span className="text-[11px] text-slate-400">Click any destination to see its interactive route</span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {/* User Planned Trips First */}
              {state.trips.filter(t => t.plan?.itinerary && t.plan.itinerary.length > 0).map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => handleSelectDestination(trip.destination)}
                  className="flex-shrink-0 w-48 bg-gradient-to-br from-primary/90 to-slate-900 hover:from-primary rounded-2xl overflow-hidden border-2 border-secondary shadow-xl transition-all cursor-pointer group p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-secondary text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ✨ Active Plan
                      </span>
                      <span className="text-[10px] text-white/80 font-bold">
                        {trip.plan?.itinerary?.length} Days
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white group-hover:text-secondary transition-colors line-clamp-1">
                      {trip.name || trip.destination}
                    </h4>
                    <p className="text-[10px] text-white/70 mt-1 line-clamp-2">
                      {trip.plan?.itinerary?.reduce((sum, d) => sum + d.activities.length, 0)} stops with &lt; 5km routes
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                    <span className="text-[10px] text-secondary font-bold">View Route Map</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </div>
              ))}

              {WORLD_DESTINATIONS.map((dest) => (
                <div
                  key={dest.name}
                  onClick={() => handleSelectDestination(dest.name)}
                  className="flex-shrink-0 w-44 bg-slate-900/90 hover:bg-slate-800 rounded-2xl overflow-hidden border border-white/10 hover:border-secondary/50 transition-all cursor-pointer group"
                >
                  <div className="h-24 overflow-hidden relative">
                    <img 
                      src={dest.img} 
                      alt={dest.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white px-2 py-0.5 rounded-full">
                      {dest.tag}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-secondary transition-colors truncate">
                      {dest.name}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Route Stops Sidebar / Drawer (when in Route View) */}
      {!isWorldView && (
        <div className={cn(
          "absolute bottom-4 left-4 z-30 transition-all duration-300",
          isSidebarCollapsed ? "w-auto" : "w-[92vw] sm:w-[380px] max-h-[50vh] sm:max-h-[60vh]"
        )}>
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col">
            
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white leading-none">{currentDestinationName}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {totalStats.stopCount} Waypoints • {totalStats.totalKm} km • ~{totalStats.estTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                title={isSidebarCollapsed ? "Expand route stops" : "Collapse"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Day Filter Tabs (if multiple planned days) */}
            {!isSidebarCollapsed && availableDays.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-3 py-2 bg-slate-50 border-b border-slate-100">
                <button
                  onClick={() => setSelectedDayFilter('all')}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0",
                    selectedDayFilter === 'all' 
                      ? "bg-primary text-white shadow-xs" 
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  )}
                >
                  All Days ({routePlaces.length})
                </button>
                {availableDays.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDayFilter(d)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0",
                      selectedDayFilter === d 
                        ? "bg-primary text-white shadow-xs" 
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    Day {d}
                  </button>
                ))}
              </div>
            )}

            {/* Stops List */}
            {!isSidebarCollapsed && (
              <div className="p-3 overflow-y-auto space-y-2 max-h-[36vh] no-scrollbar">
                {displayedRoutePlaces.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {isLoading ? 'Calculating optimal route...' : 'No route waypoints found for this selection.'}
                  </div>
                ) : (
                  displayedRoutePlaces.map((place, idx) => {
                    const isSelected = place.id === selectedPlaceId;
                    const isFirst = idx === 0;
                    const isLast = idx === displayedRoutePlaces.length - 1;
                    const distFromPrev = idx > 0 
                      ? getDistanceKm(
                          displayedRoutePlaces[idx - 1].location.lat,
                          displayedRoutePlaces[idx - 1].location.lon,
                          place.location.lat,
                          place.location.lon
                        )
                      : 0;
                    const dayTag = place.tags?.find(t => t.startsWith('Day '));

                    return (
                      <div
                        key={place.id}
                        onClick={() => handleFlyToPlace(place)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group",
                          isSelected 
                            ? "bg-primary/5 border-primary shadow-xs" 
                            : "bg-slate-50 hover:bg-white border-slate-100 hover:border-slate-200"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={cn(
                            "w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-xs",
                            isFirst ? "bg-emerald-500 text-white" : isLast ? "bg-rose-500 text-white" : isSelected ? "bg-amber-500 text-white" : "bg-primary text-white"
                          )}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              {dayTag && (
                                <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                  {dayTag}
                                </span>
                              )}
                              <h4 className="font-bold text-xs text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                                {place.name}
                              </h4>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1">
                              {place.location.address || place.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {idx > 0 && (
                            <span className="text-[10px] font-bold text-slate-500 block">
                              +{distFromPrev} km
                            </span>
                          )}
                          <span className="text-[9px] text-emerald-600 font-semibold uppercase">
                            {isFirst ? 'Start' : isLast ? 'End' : 'Stop'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share & Open in Maps Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline text-lg font-bold text-slate-900">Export & Share Route</h3>
                    <p className="text-xs text-slate-400">{currentDestinationName} • {totalStats.stopCount} Stops</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Direct Maps Launch Buttons */}
              <div className="space-y-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg shadow-blue-500/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">🗺️</span>
                    <span>Open Full Route in Google Maps</span>
                  </div>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg shadow-black/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">🍏</span>
                    <span>Open in Apple Maps</span>
                  </div>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                    <span>{copiedLink ? 'TripVerse Link Copied!' : 'Copy Shareable Link'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">{copiedLink ? 'Copied' : 'Share'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-700">Want custom day-by-day scheduling?</p>
                  <p className="text-[10px] text-slate-400">Generate an AI itinerary with hotels & costs.</p>
                </div>
                <button
                  onClick={() => {
                    setIsShareModalOpen(false);
                    handlePlanItinerary();
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shrink-0"
                >
                  Plan Trip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
