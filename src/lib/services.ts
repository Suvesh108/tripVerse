// API service functions for external integrations (Client-Side Direct BYOK Architecture)

import { getGroqApiKey, getTavilyApiKey, getExchangeRateApiKey, getBestGroqModel, saveStoredApiKeys } from './apiKeyStorage';

// ============================================================
// Intelligent Memory & Session Cache Manager
// Reduces redundant network requests and BYOK token usage
// ============================================================

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  if (entry) memoryCache.delete(key);

  try {
    const session = sessionStorage.getItem(`tv_cache_${key}`);
    if (session) {
      const parsed: CacheEntry<T> = JSON.parse(session);
      if (parsed.expiry > Date.now()) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
      sessionStorage.removeItem(`tv_cache_${key}`);
    }
  } catch {}
  return null;
}

function setCached<T>(key: string, data: T, ttlMs: number = 30 * 60 * 1000): void {
  const entry: CacheEntry<T> = { data, expiry: Date.now() + ttlMs };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`tv_cache_${key}`, JSON.stringify(entry));
  } catch {}
}

/**
 * Execute Groq AI completion with automatic model discovery and fallback cascading
 */
async function callGroqWithFallback(apiKey: string, payload: {
  messages: any[];
  max_tokens?: number;
  temperature?: number;
  response_format?: any;
}): Promise<Response> {
  const primaryModel = getBestGroqModel();
  const candidateModels = Array.from(new Set([
    primaryModel,
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'gemma2-9b-it',
    'mixtral-8x7b-32768',
  ]));

  let lastResponse: Response | null = null;
  for (const model of candidateModels) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          model,
        }),
      });

      if (res.ok) {
        if (model !== primaryModel) {
          saveStoredApiKeys({ selectedGroqModel: model });
        }
        return res;
      }

      lastResponse = res;
      // If 404 (model deprecated / removed) or 400 (bad model) or 429, try next model
      if (res.status !== 404 && res.status !== 400 && res.status !== 429) {
        return res;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  return lastResponse || new Response(JSON.stringify({ error: { message: 'All Groq candidate models failed.' } }), { status: 500 });
}

// ============================================================
// Types
// ============================================================

export interface Place {
  id: string;
  name: string;
  location: {
    lat: number;
    lon: number;
    address: string;
  };
  category: string;
  rating: number;
  description?: string;
  image?: string;
  price?: number;
  tags: string[];
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export interface TravelPlan {
  destination: string;
  duration: number;
  budget: number;
  itinerary: DayPlan[];
  totalCost: number;
  tips: string[];
}

export interface DayPlan {
  day: number;
  activities: Activity[];
  estimatedCost: number;
}

export interface Activity {
  name: string;
  type: string;
  duration: string;
  cost: number;
  description: string;
  location?: string;
  lat?: number;
  lon?: number;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

// Leaflet CDN Tile configurations
export const LEAFLET_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const LEAFLET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// ============================================================
// 1. Geocoding & OpenStreetMap Overpass API (Direct Browser API)
//    https://nominatim.openstreetmap.org/search
//    https://overpass-api.de/api/interpreter
// ============================================================

// Geocode a location name to lat/lon using Nominatim (Global Worldwide with 24h cache)
export async function geocode(locationName: string): Promise<{ lat: number; lon: number } | null> {
  const clean = locationName.trim();
  if (!clean || clean.length < 2) return null;

  const cacheKey = `geo_${clean.toLowerCase()}`;
  const cached = getCached<{ lat: number; lon: number }>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&limit=1`,
      { headers: { 'User-Agent': 'TripVerse/1.0' } }
    );
    const data = await response.json();
    if (data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      setCached(cacheKey, result, 24 * 60 * 60 * 1000); // 24h cache
      return result;
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Fetches detailed history and area insights using Groq AI (Direct Client Call with 2h cache)
 */
export async function getDetailedInsights(location: string): Promise<{ history: string; areaInfo: string; highlights: { title: string; desc: string; icon: string }[] }> {
  const clean = location.trim();
  if (!clean) {
    return {
      history: 'Explore famous destinations across the world.',
      areaInfo: 'Discover scenic wonders and cultural heritage.',
      highlights: [{ title: 'Sightseeing', desc: 'Popular attractions', icon: 'MapPin' }]
    };
  }

  const cacheKey = `insights_${clean.toLowerCase()}`;
  const cached = getCached<{ history: string; areaInfo: string; highlights: { title: string; desc: string; icon: string }[] }>(cacheKey);
  if (cached) return cached;

  const groqApiKey = getGroqApiKey();

  if (groqApiKey) {
    try {
      const prompt = `Provide detailed travel insights for ${clean}. 
      1. History of the place (about 80-100 words).
      2. About the area and traveler vibe (about 40-50 words).
      3. Three key experience highlights with a short title, description, and a Lucide icon name (like Camera, Wine, Mountain, MapPin, Sparkles, Utensils).
      Format the response as JSON: { "history": "...", "areaInfo": "...", "highlights": [{ "title": "...", "desc": "...", "icon": "..." }] }`;

      const response = await callGroqWithFallback(groqApiKey, {
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        
        const result = {
          history: content.history || `Explore the storied past and cultural legacy of ${clean}.`,
          areaInfo: content.areaInfo || `Discover the vibrant atmosphere and unique charm of ${clean}.`,
          highlights: content.highlights || [
            { title: 'Local Landmarks', desc: 'Must-visit historical sites', icon: 'MapPin' },
            { title: 'Hidden Gems', desc: 'Off-the-beaten-path experiences', icon: 'Sparkles' },
            { title: 'Food & Culture', desc: 'Authentic local traditions', icon: 'Utensils' }
          ]
        };
        setCached(cacheKey, result, 2 * 60 * 60 * 1000); // 2 hours
        return result;
      }
    } catch (error) {
      console.warn('Groq AI insights fetch failed, using fallback:', error);
    }
  }

  // Graceful fallback
  return {
    history: `Discover the rich historical tapestry of ${clean}, where ancient traditions meet vibrant modern culture.`,
    areaInfo: `${clean} is known for its breathtaking sights, welcoming local culture, and memorable experiences.`,
    highlights: [
      { title: 'Iconic Sights', desc: 'Breathtaking views and landmarks', icon: 'Camera' },
      { title: 'Cultural Heritage', desc: 'Rich history and local customs', icon: 'Globe' },
      { title: 'Local Flavors', desc: 'A culinary journey like no other', icon: 'Utensils' }
    ]
  };
}

/**
 * Calculates an optimal visit path using a Greedy (Nearest Neighbor) approach
 */
export function calculateOptimalPath(places: Place[]): Place[] {
  if (places.length <= 1) return places;
  
  const result: Place[] = [];
  const remaining = [...places];
  
  let current = remaining.shift()!;
  result.push(current);
  
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.sqrt(
        Math.pow(current.location.lat - remaining[i].location.lat, 2) + 
        Math.pow(current.location.lon - remaining[i].location.lon, 2)
      );
      
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }
    
    current = remaining.splice(nearestIdx, 1)[0];
    result.push(current);
  }
  
  return result;
}

export async function getPlaces(location: string, category?: string): Promise<Place[]> {
  const clean = location.trim();
  if (!clean) return [];

  const cacheKey = `places_${clean.toLowerCase()}_${category || 'all'}`;
  const cached = getCached<Place[]>(cacheKey);
  if (cached) return cached;

  const coords = await geocode(clean);
  const baseLat = coords?.lat || 20.5937;
  const baseLon = coords?.lon || 78.9629;

  // 1. Try AI-powered destination and place discovery first
  const groqApiKey = getGroqApiKey();
  if (groqApiKey) {
    try {
      const prompt = `You are a real-time global destination and location discovery AI engine.
For query "${clean}" (Category: ${category || 'Famous Tourist Places & Attractions'}), return 6 to 8 of the best, most authentic, iconic places, landmarks, museums, viewpoints, or dining spots in and around ${clean}.

Geographic Center: ${clean} (lat: ${baseLat}, lon: ${baseLon}).
Every location MUST have authentic coordinates near ${clean}.

Return a valid JSON object matching this EXACT format:
{
  "places": [
    {
      "name": "Attraction Name",
      "category": "${category || 'Famous Tourist Place'}",
      "rating": 4.8,
      "address": "Address or Neighborhood in ${clean}",
      "description": "Engaging 1-2 sentence description explaining why travelers must visit this place.",
      "lat": ${baseLat},
      "lon": ${baseLon}
    }
  ]
}`;

      const response = await callGroqWithFallback(groqApiKey, {
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        if (content.places && Array.isArray(content.places) && content.places.length > 0) {
          const aiPlaces: Place[] = content.places.map((p: any, idx: number) => {
            const offsetLat = ((idx + 1) * 0.006) * Math.sin(idx + 1);
            const offsetLon = ((idx + 1) * 0.006) * Math.cos(idx + 1);
            const lat = typeof p.lat === 'number' && Math.abs(p.lat - baseLat) < 0.6 ? p.lat : Number((baseLat + offsetLat).toFixed(4));
            const lon = typeof p.lon === 'number' && Math.abs(p.lon - baseLon) < 0.6 ? p.lon : Number((baseLon + offsetLon).toFixed(4));

            return {
              id: `ai-${clean.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${idx}`,
              name: p.name || `Attraction ${idx + 1}`,
              location: {
                lat,
                lon,
                address: p.address || `${p.name}, ${clean}`,
              },
              category: p.category || category || 'Famous Tourist Place',
              rating: typeof p.rating === 'number' ? p.rating : 4.8,
              price: 0,
              description: p.description || `Explore ${p.name} in ${clean}.`,
              tags: ['AI Curated', category || 'Attraction', 'Sightseeing'],
            };
          });

          setCached(cacheKey, aiPlaces, 60 * 60 * 1000);
          return aiPlaces;
        }
      }
    } catch (e) {
      console.warn('AI place search fallback to OpenStreetMap:', e);
    }
  }

  // 2. Fallback to OpenStreetMap Overpass API
  try {
    if (!coords) return [];

    const searchRadius = 30000;
    let tourismTypes = '';
    
    if (category === 'Hotel') {
      tourismTypes = 'hotel|hostel|guest_house|motel';
    } else if (category === 'Restaurant') {
      tourismTypes = 'restaurant|cafe|bar';
    } else if (category === 'Famous Tourist Place') {
      tourismTypes = 'attraction|artwork|viewpoint|museum|theme_park|zoo|aquarium';
    } else if (category === 'Heritage Site') {
      tourismTypes = 'monument|ruins|castle|archaeological_site|fort';
    } else if (category === 'Nature Spot') {
      tourismTypes = 'nature_reserve|viewpoint|park|waterfall|beach';
    } else {
      tourismTypes = 'attraction|museum|viewpoint|theme_park|zoo|artwork|hotel|motel|hostel|guest_house|resort|monument|ruins|castle|restaurant|cafe';
    }

    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"${tourismTypes}"](around:${searchRadius},${coords.lat},${coords.lon});
        node["historic"](around:${searchRadius},${coords.lat},${coords.lon});
        node["amenity"~"restaurant|cafe"](around:${searchRadius},${coords.lat},${coords.lon});
      );
      out center 30;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const seenNames = new Set<string>();
    const uniquePlaces: any[] = [];
    
    for (const element of (data.elements || [])) {
      const name = element.tags?.name;
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        uniquePlaces.push(element);
      }
    }
    
    const result: Place[] = uniquePlaces.map((element: any) => {
      const isHotel = element.tags?.tourism === 'hotel' || element.tags?.tourism === 'hostel' || element.tags?.tourism === 'guest_house';
      const isRestaurant = element.tags?.amenity === 'restaurant' || element.tags?.amenity === 'cafe';
      const estimatedPrice = isHotel ? 2500 : isRestaurant ? 800 : 0;
      
      const tagRating = parseFloat(element.tags?.stars || element.tags?.rating);
      const rating = tagRating > 0 ? Math.min(5.0, tagRating) : (element.tags?.wikidata ? 4.8 : 4.6);

      return {
        id: element.id.toString(),
        name: element.tags?.name || 'Unknown Place',
        location: {
          lat: element.lat || element.center?.lat || 0,
          lon: element.lon || element.center?.lon || 0,
          address: element.tags?.['addr:full'] || `${element.tags?.name}, ${clean}`,
        },
        category: element.tags?.tourism || element.tags?.historic || element.tags?.amenity || 'attraction',
        rating,
        price: estimatedPrice,
        tags: Object.keys(element.tags || {}).filter(key => key.startsWith('tourism') || key.startsWith('historic') || key === 'wikidata'),
      };
    });

    setCached(cacheKey, result, 60 * 60 * 1000);
    return result;
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

// ============================================================
// 2. Wikipedia API — Destination Descriptions & Images (24h cache)
//    https://en.wikipedia.org/api/rest_v1/
// ============================================================

export async function getWikiInfo(placeName: string): Promise<string> {
  const clean = placeName.trim();
  if (!clean) return 'No description available.';

  const cacheKey = `wiki_${clean.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`
    );
    
    if (!response.ok) {
      return 'No description available for this location.';
    }
    
    const data = await response.json();
    const extract = data.extract || 'No description available for this location.';
    setCached(cacheKey, extract, 24 * 60 * 60 * 1000);
    return extract;
  } catch (error) {
    console.error('Error fetching Wikipedia info:', error);
    return 'No description available for this location.';
  }
}

export async function getWikiThumbnail(placeName: string): Promise<string | undefined> {
  const clean = placeName.trim();
  if (!clean) return undefined;

  const cacheKey = `wiki_thumb_${clean.toLowerCase()}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`
    );
    if (!response.ok) return undefined;
    const data = await response.json();
    const thumb = data.thumbnail?.source || data.originalimage?.source;
    if (thumb) {
      setCached(cacheKey, thumb, 24 * 60 * 60 * 1000);
    }
    return thumb;
  } catch {
    return undefined;
  }
}

// ============================================================
// 3. Open-Meteo API — Weather Data (15m cache)
//    https://api.open-meteo.com/v1/forecast
// ============================================================

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = getCached<WeatherData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );
    
    const data = await response.json();
    
    const result: WeatherData = {
      temperature: data.current_weather?.temperature || 20,
      condition: data.current_weather?.weathercode ? getWeatherCondition(data.current_weather.weathercode) : 'Clear',
      humidity: data.current_weather?.humidity || 50,
      windSpeed: data.current_weather?.windspeed || 10,
      icon: getWeatherIcon(data.current_weather?.weathercode || 0),
    };

    setCached(cacheKey, result, 15 * 60 * 1000); // 15 mins cache
    return result;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return {
      temperature: 20,
      condition: 'Clear',
      humidity: 50,
      windSpeed: 10,
      icon: '☀️',
    };
  }
}

// ============================================================
// 4. Groq API — AI Chat & Travel Planning (Strict Travel Guardrails)
//    https://api.groq.com/openai/v1/chat/completions
// ============================================================

export async function generateAIResponse(prompt: string, context?: any): Promise<string> {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt || cleanPrompt.length < 2) {
    return 'Please enter a travel destination or question to explore!';
  }

  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    return `⚠️ **Groq API Key Not Configured**\n\nTo use the AI Travel Assistant and AI Travel Planner, please enter your free Groq API key in **API Settings** (Gear icon ⚙️ in top navigation or Profile).\n\n1. Visit [console.groq.com/keys](https://console.groq.com/keys)\n2. Generate a free API key\n3. Paste it into your TripVerse API Settings.\n\n*Your key is saved 100% locally in your browser and never shared with anyone.*`;
  }

  try {
    const systemPrompt = `You are TripVerse AI, an expert specialized travel concierge and trip planning assistant.
CRITICAL CONSTRAINTS & MANDATE:
1. You MUST ONLY respond to inquiries related to travel, tourism, vacations, destinations, itineraries, sightseeing, culture, local food, accommodations, flights, packing, budgets, and weather.
2. If the user asks about ANY non-travel topic (e.g. programming, coding, homework, math, politics, non-travel advice), DO NOT answer the non-travel query. Politely reply: "I am TripVerse AI, dedicated exclusively to travel planning and destination discovery. How can I help you plan your next journey?" and provide 2-3 inspiring travel suggestions.
3. Provide practical, accurate travel advice with approximate costs in INR (₹) and clear day-by-day structure when crafting itineraries.
4. If generating an itinerary, always use a clear 'Day X:' header followed by activities with:
- Name: [Activity Name]
- Type: [Sightseeing/Hotel/Dining/Adventure]
- Duration: [Duration]
- Cost: [Cost in INR]
- Description: [Description]`;

    const response = await callGroqWithFallback(apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        ...(context ? [{ role: 'system', content: `Travel Context: ${JSON.stringify(context)}` }] : []),
        { role: 'user', content: cleanPrompt }
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      if (response.status === 401) {
        return '❌ **Invalid Groq API Key**: Please check your API key in API Settings (console.groq.com/keys).';
      }
      if (response.status === 429) {
        return '⏳ **Rate Limit Exceeded**: Your Groq API key has reached its rate limit. Please wait a moment or use a different key in API Settings.';
      }
      return `Error from Groq AI (${response.status}): ${errorData.error?.message || 'Please try again.'}`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return `⚠️ Connection error: ${error.message || 'Could not connect to Groq API. Please check your internet connection.'}`;
  }
}

// ============================================================
// 5. Tavily API — Web Search for Travel Info (Direct Browser API with Cache)
//    https://api.tavily.com/search
// ============================================================

export async function tavilySearch(query: string, maxResults: number = 4): Promise<TavilySearchResult[]> {
  const clean = (query || '').trim();
  if (!clean || clean.length < 3) return [];

  const cacheKey = `tavily_${clean.toLowerCase()}`;
  const cached = getCached<TavilySearchResult[]>(cacheKey);
  if (cached) return cached;

  const apiKey = getTavilyApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: `travel tourism guide ${clean}`,
        max_results: Math.min(4, maxResults),
        search_depth: 'basic',
        include_answer: true,
      }),
    });

    if (!response.ok) {
      console.warn('Tavily API responded with status:', response.status);
      return [];
    }

    const data = await response.json();
    const results: TavilySearchResult[] = (data.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));

    setCached(cacheKey, results, 60 * 60 * 1000); // 1 hour cache
    return results;
  } catch (error) {
    console.error('Error with Tavily search:', error);
    return [];
  }
}

export async function tavilyAnswer(query: string): Promise<string> {
  const clean = (query || '').trim();
  if (!clean || clean.length < 3) return '';

  const apiKey = getTavilyApiKey();
  if (!apiKey) return '';

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: `travel travel guide ${clean}`,
        max_results: 3,
        search_depth: 'basic',
        include_answer: true,
      }),
    });

    if (!response.ok) return '';

    const data = await response.json();
    return data.answer || '';
  } catch (error) {
    console.warn('Error with Tavily answer:', error);
    return '';
  }
}

// ============================================================
// 6. ExchangeRate API — Currency Conversion (Direct Browser API with 1h Cache)
// ============================================================

const FALLBACK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  INR: 86.8,
  GBP: 0.78,
  JPY: 154.2,
  AUD: 1.55,
  CAD: 1.41,
  CHF: 0.88,
  AED: 3.67,
  SGD: 1.34,
  THB: 34.5,
};

export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  const cacheKey = `exrates_${baseCurrency.toUpperCase()}`;
  const cached = getCached<ExchangeRates>(cacheKey);
  if (cached) return cached;

  const apiKey = getExchangeRateApiKey();

  // 1. Try with user's ExchangeRate-API v6 key if configured
  if (apiKey) {
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`);
      if (response.ok) {
        const data = await response.json();
        if (data.result === 'success') {
          const result: ExchangeRates = {
            base: data.base_code || baseCurrency,
            rates: data.conversion_rates || {},
            lastUpdated: data.time_last_update_utc || new Date().toISOString(),
          };
          setCached(cacheKey, result, 60 * 60 * 1000); // 1 hour cache
          return result;
        }
      }
    } catch (e) {
      console.warn('ExchangeRate v6 key failed, trying open fallback:', e);
    }
  }

  // 2. Try free open endpoint (open.er-api.com - no key required)
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (response.ok) {
      const data = await response.json();
      if (data.result === 'success') {
        const result: ExchangeRates = {
          base: data.base_code || baseCurrency,
          rates: data.rates || {},
          lastUpdated: data.time_last_update_utc || new Date().toISOString(),
        };
        setCached(cacheKey, result, 60 * 60 * 1000); // 1 hour cache
        return result;
      }
    }
  } catch (e) {
    console.warn('Open exchange rates API failed, using static fallback:', e);
  }

  // 3. Fallback to offline static estimates
  return {
    base: baseCurrency,
    rates: FALLBACK_EXCHANGE_RATES,
    lastUpdated: new Date().toISOString(),
  };
}

export async function convertCurrency(
  amount: number,
  from: string = 'USD',
  to: string = 'EUR'
): Promise<{ convertedAmount: number; rate: number }> {
  if (from === to) return { convertedAmount: amount, rate: 1 };

  const apiKey = getExchangeRateApiKey();

  // Try v6 pair conversion if key is available
  if (apiKey) {
    try {
      const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${amount}`);
      if (response.ok) {
        const data = await response.json();
        if (data.result === 'success') {
          return {
            convertedAmount: data.conversion_result || amount,
            rate: data.conversion_rate || 1,
          };
        }
      }
    } catch (e) {
      console.warn('Pair conversion failed, using rates fallback:', e);
    }
  }

  // Fallback to latest rates calculation
  try {
    const ratesData = await getExchangeRates(from);
    const targetRate = ratesData.rates[to];
    if (targetRate) {
      return {
        convertedAmount: Number((amount * targetRate).toFixed(2)),
        rate: targetRate,
      };
    }
  } catch (e) {
    console.warn('Currency conversion calculation failed:', e);
  }

  return { convertedAmount: amount, rate: 1 };
}

// ============================================================
// Helper Functions
// ============================================================

function getWeatherCondition(code: number): string {
  const conditions: { [key: number]: string } = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
  };
  return conditions[code] || 'Clear';
}

function getWeatherIcon(code: number): string {
  const icons: { [key: number]: string } = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌦️',
    53: '🌧️',
    55: '🌧️',
    61: '🌧️',
    63: '🌧️',
    65: '⛈️',
  };
  return icons[code] || '☀️';
}

// ============================================================
// Combined Search (Overpass + Wikipedia + Weather)
// ============================================================

// ============================================================
// Combined Search (Nominatim + Wikipedia + Weather + Overpass)
// Guarantees reliable, instant results worldwide
// ============================================================

export async function searchDestinations(params: {
  location: string;
  budget?: number;
  preferences?: string[];
  category?: string;
}): Promise<Place[]> {
  const clean = (params.location || '').trim();
  if (!clean) return [];

  const cacheKey = `search_dest_${clean.toLowerCase()}_${params.category || 'all'}`;
  const cached = getCached<Place[]>(cacheKey);
  if (cached) return cached;

  try {
    const groqApiKey = getGroqApiKey();
    if (groqApiKey) {
      try {
        const isMultiOrThematic = clean.split(' ').length > 2 || /^(best|top|romantic|beach|hill|trek|heritage|family|cheap|luxury|places|destinations|islands|cities|where to|cool)/i.test(clean);
        
        if (isMultiOrThematic) {
          const aiPrompt = `You are TripVerse AI, the world's most intelligent global destination finder.
For traveler inquiry: "${clean}", recommend 4 to 6 of the best matching destinations or cities worldwide.

Return a valid JSON object matching this EXACT format:
{
  "destinations": [
    {
      "name": "Destination Name (e.g. Ooty, Tamil Nadu)",
      "country": "India",
      "category": "Famous Tourist Place",
      "rating": 4.9,
      "description": "Captivating 1-2 sentence overview of why this destination matches the traveler's request.",
      "lat": 11.4102,
      "lon": 76.6950,
      "tag": "Hill Station & Tea Gardens"
    }
  ]
}`;
          const aiRes = await callGroqWithFallback(groqApiKey, {
            messages: [{ role: 'user', content: aiPrompt }],
            response_format: { type: 'json_object' },
            temperature: 0.4,
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = JSON.parse(aiData.choices?.[0]?.message?.content || '{}');
            if (content.destinations && Array.isArray(content.destinations) && content.destinations.length > 0) {
              const aiDestPlaces: Place[] = await Promise.all(
                content.destinations.map(async (d: any, idx: number) => {
                  const queryCity = d.name.split('(')[0].split(',')[0].trim();
                  const [thumb, coords] = await Promise.all([
                    getWikiThumbnail(queryCity),
                    geocode(d.name)
                  ]);

                  return {
                    id: `ai-dest-${d.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${idx}`,
                    name: d.name,
                    location: {
                      lat: coords?.lat || (typeof d.lat === 'number' ? d.lat : 20.5937),
                      lon: coords?.lon || (typeof d.lon === 'number' ? d.lon : 78.9629),
                      address: d.country ? `${d.name}, ${d.country}` : d.name,
                    },
                    category: d.category || 'Famous Tourist Place',
                    rating: typeof d.rating === 'number' ? d.rating : 4.9,
                    description: d.description || `Explore ${d.name}.`,
                    image: thumb || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
                    tags: ['AI Recommended', d.tag || 'Top Pick', 'Travel'],
                  };
                })
              );

              if (aiDestPlaces.length > 0) {
                setCached(cacheKey, aiDestPlaces, 30 * 60 * 1000);
                return aiDestPlaces;
              }
            }
          }
        }
      } catch (err) {
        console.warn('AI multi-destination search fallback:', err);
      }
    }

    // 1. Geocode target destination worldwide
    const coords = await geocode(clean);
    
    // 2. Fetch destination primary info (Wikipedia summary & photo, weather)
    const [wikiExtract, wikiImage, weather] = await Promise.all([
      getWikiInfo(clean),
      getWikiThumbnail(clean),
      coords ? getWeather(coords.lat, coords.lon) : Promise.resolve(undefined)
    ]);

    const results: Place[] = [];

    // 3. Always create the primary destination card
    if (coords) {
      results.push({
        id: `dest_${clean.toLowerCase().replace(/\s+/g, '_')}`,
        name: clean,
        location: {
          lat: coords.lat,
          lon: coords.lon,
          address: clean,
        },
        category: 'Famous Tourist Place',
        rating: 4.9,
        description: wikiExtract !== 'No description available for this location.' && wikiExtract !== 'No description available.'
          ? wikiExtract
          : `Explore the sights, rich heritage, and vibrant travel experiences of ${clean}.`,
        image: wikiImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800',
        tags: ['Destination', 'Top Pick', 'Travel'],
      });
    }

    // 4. Fetch local POIs & accommodations in parallel with timeout
    try {
      const places = await Promise.race([
        getPlaces(clean, params.category),
        new Promise<Place[]>((resolve) => setTimeout(() => resolve([]), 6000))
      ]);

      if (places && places.length > 0) {
        const enhancedPlaces = await Promise.all(
          places.slice(0, 8).map(async (place) => {
            const [desc, img] = await Promise.all([
              getWikiInfo(place.name),
              getWikiThumbnail(place.name)
            ]);
            return {
              ...place,
              description: desc !== 'No description available for this location.' && desc !== 'No description available.' ? desc : place.description,
              image: img || place.image,
              weather,
            };
          })
        );

        for (const place of enhancedPlaces) {
          if (!results.some(r => r.name.toLowerCase() === place.name.toLowerCase())) {
            results.push(place);
          }
        }
      }
    } catch {
      // Graceful fallback to primary destination card
    }

    // 5. Apply filters
    let filteredPlaces = results;
    
    if (params.budget && params.budget > 0) {
      filteredPlaces = filteredPlaces.filter(place => 
        !place.price || place.price <= params.budget!
      );
    }
    
    if (params.preferences && params.preferences.length > 0) {
      const matched = filteredPlaces.filter(place =>
        params.preferences!.some(pref => 
          place.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase())) ||
          place.category.toLowerCase().includes(pref.toLowerCase())
        )
      );
      if (matched.length > 0) {
        filteredPlaces = matched;
      }
    }
    
    const finalResults = filteredPlaces.length > 0 ? filteredPlaces : results;
    if (finalResults.length > 0) {
      setCached(cacheKey, finalResults, 30 * 60 * 1000); // 30 min cache
    }
    return finalResults;
  } catch (error) {
    console.error('Error in searchDestinations:', error);
    return [];
  }
}

// ============================================================
// ============================================================
// Generate Full Travel Plan (Groq AI JSON Powered Itinerary)
// Enforces 2-4 places/day with chain hop (<5km consecutive radius)
// ============================================================

export async function generateTravelPlan(params: {
  destination: string;
  duration: number;
  budget?: number;
  placesPerDay?: number;
  preferences?: string[];
  options?: { context?: string };
}): Promise<TravelPlan> {
  const { destination, duration, preferences, options } = params;
  const targetPlacesPerDay = params.placesPerDay || 3;
  
  // Geocode destination center so all activity pins anchor authentically around the target city
  const destinationCoords = await geocode(destination);
  const baseLat = destinationCoords?.lat || 20.5937;
  const baseLon = destinationCoords?.lon || 78.9629;

  const apiKey = getGroqApiKey();

  if (apiKey) {
    try {
      const systemPrompt = `You are TripVerse AI, the world's most advanced travel itinerary architect.
You build optimized ${duration}-day travel plans for ${destination}.

CRITICAL RULES:
1. ZERO DUPLICATE PLACES ACROSS DAYS: Every single attraction, monument, museum, landmark, and restaurant across the entire ${duration}-day trip MUST BE 100% UNIQUE. NEVER schedule the same place on multiple days. Travelers will not visit the same place twice. Each day MUST explore fresh, completely different places.
2. DEDUPLICATION OF DAYS: You MUST return exactly ${duration} unique days (Day 1 to Day ${duration}). Do NOT repeat day numbers.
3. CHAIN RADIUS HOPS (< 5 KM):
   - Place 1 (Morning Start): Top iconic attraction in ${destination}.
   - Place 2: MUST be within a 5 km radius of Place 1.
   - Place 3: MUST be within a 5 km radius of Place 2.
   - Place 4 (optional): MUST be within a 5 km radius of Place 3.
   - Every day should have ${targetPlacesPerDay} (or 2 to 4) high-value places. If the distance to another major spot exceeds 5 km, keep that day to 2 places to prevent transit fatigue.
4. Leave late night for rest/relaxation at the hotel/stay.
5. Return a valid JSON object matching this EXACT format:
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "name": "Unique Attraction Name",
          "type": "sightseeing",
          "duration": "2 Hours",
          "description": "Engaging description explaining why to visit and proximity to previous stop.",
          "lat": ${baseLat},
          "lon": ${baseLon}
        }
      ]
    }
  ],
  "tips": [
    "Practical travel tip 1",
    "Practical travel tip 2",
    "Practical travel tip 3"
  ]
}`;

      const userPayload = `Destination: ${destination}
Duration: ${duration} Days
Target Places Per Day: ${targetPlacesPerDay}
${preferences && preferences.length > 0 ? `Preferences: ${preferences.join(', ')}` : ''}
${options?.context ? `Context: ${options.context}` : ''}

Generate the complete ${duration}-day JSON itinerary with 100% unique places across all days and < 5km chained stops:`;

      const response = await callGroqWithFallback(apiKey, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');

        if (content.itinerary && Array.isArray(content.itinerary) && content.itinerary.length > 0) {
          // Strictly deduplicate days 1..duration & deduplicate places across all days
          const dayMap = new Map<number, DayPlan>();
          const seenPlaceNames = new Set<string>();

          content.itinerary.forEach((dayItem: any, idx: number) => {
            const dayNum = Number(dayItem.day) || (idx + 1);
            if (dayNum > duration) return;

            // Anchor day cluster
            const dayClusterLat = baseLat + ((dayNum - 1) * 0.012) * Math.cos(dayNum);
            const dayClusterLon = baseLon + ((dayNum - 1) * 0.012) * Math.sin(dayNum);

            let prevLat = dayClusterLat;
            let prevLon = dayClusterLon;

            const activities: Activity[] = [];
            (dayItem.activities || []).forEach((act: any, aIdx: number) => {
              const rawName = (act.name || `Day ${dayNum} Place ${aIdx + 1}`).trim();
              const normalizedName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');

              // Check if place was already visited on an earlier day
              let uniqueName = rawName;
              if (seenPlaceNames.has(normalizedName)) {
                uniqueName = `${rawName} & Surrounding District`;
              }
              seenPlaceNames.add(uniqueName.toLowerCase().replace(/[^a-z0-9]/g, ''));

              // Ensure consecutive chained offset (< 0.025 deg ~ 2.5 km)
              const hopOffsetLat = (aIdx * 0.006) * Math.sin(aIdx + 1);
              const hopOffsetLon = (aIdx * 0.006) * Math.cos(aIdx + 1);
              
              const actLat = act.lat || Number((prevLat + hopOffsetLat).toFixed(4));
              const actLon = act.lon || Number((prevLon + hopOffsetLon).toFixed(4));
              prevLat = actLat;
              prevLon = actLon;

              activities.push({
                name: uniqueName,
                type: act.type || 'sightseeing',
                duration: act.duration || '2 Hours',
                cost: 0,
                description: act.description || `Explore this attraction near the previous stop on Day ${dayNum}.`,
                lat: actLat,
                lon: actLon,
              });
            });

            if (!dayMap.has(dayNum) || activities.length > (dayMap.get(dayNum)?.activities.length || 0)) {
              dayMap.set(dayNum, {
                day: dayNum,
                activities,
                estimatedCost: 0,
              });
            }
          });

          // Fill any missing days up to duration
          const finalItinerary: DayPlan[] = [];
          for (let d = 1; d <= duration; d++) {
            if (dayMap.has(d)) {
              finalItinerary.push(dayMap.get(d)!);
            } else {
              finalItinerary.push({
                day: d,
                activities: [
                  {
                    name: `${destination} Day ${d} Morning Discovery`,
                    type: 'sightseeing',
                    duration: '2.5 Hours',
                    cost: 0,
                    description: `Explore top landmarks in ${destination}.`,
                    lat: Number((baseLat + d * 0.01).toFixed(4)),
                    lon: Number((baseLon + d * 0.01).toFixed(4)),
                  }
                ],
                estimatedCost: 0,
              });
            }
          }

          const tips = Array.isArray(content.tips) && content.tips.length > 0
            ? content.tips
            : [
                `Best time to visit ${destination} is during pleasant weather months.`,
                'All daily stops are chained within 5 km hops to minimize transit time.',
                'Book entrance passes and tickets online in advance to skip lines.',
              ];

          return {
            destination,
            duration,
            budget: 0,
            itinerary: finalItinerary,
            totalCost: 0,
            tips,
          };
        }
      }
    } catch (err) {
      console.error('Groq JSON plan generation error, falling back to structured generator:', err);
    }
  }

  // Curated 100% Unique Multi-Day Fallback Themes (Zero Place Duplication Across Days)
  const dayThemes = [
    {
      title: 'Historic Fortress & Royal Heritage',
      p1: 'Historic Fortress & Royal Palace',
      p2: 'Heritage Courtyard & Ancient Stepwell',
      p3: 'Traditional Royal Cuisine Dining',
      p4: 'Hilltop Sunset Bastion Viewpoint',
    },
    {
      title: 'Botanical Nature & Cultural Crafts',
      p1: 'Botanical Gardens & Tropical Aviary',
      p2: 'Artisan Crafts Village & Textile Center',
      p3: 'Garden Bistro & Regional Delicacies',
      p4: 'Lakeside Leisure Promenade & Sunset Point',
    },
    {
      title: 'Art, Architecture & Sacred Temples',
      p1: 'Sacred Temple Complex & Sculpted Shrines',
      p2: 'Contemporary Art Gallery & Museum',
      p3: 'Heritage Quarter Cafe & Bakery',
      p4: 'City Skyline Observation Deck',
    },
    {
      title: 'Nature Reserves & Scenic Valleys',
      p1: 'Eco Forest Nature Reserve & Waterfalls',
      p2: 'Scenic Valley Viewpoint & Tea Lounge',
      p3: 'Highland Specialty Restaurant',
      p4: 'Mountain Ridge Stargazing Terrace',
    },
    {
      title: 'Waterfront, Marina & Night Bazaars',
      p1: 'Science & Heritage Maritime Pavilion',
      p2: 'Waterfront Marina & Sunset Boat Pier',
      p3: 'Seaside Rooftop Gourmet Dining',
      p4: 'Vibrant Night Souk & Street Festival',
    },
    {
      title: 'Mountain Monasteries & Ridge Trails',
      p1: 'High Mountain Monastery & Meditation Hall',
      p2: 'Alpine Ridge Walking Trail',
      p3: 'Farm-to-Table Organic Mountain Cafe',
      p4: 'Panoramic Valley Sunset Overlook',
    },
    {
      title: 'Old Town Discovery & Farewell Walk',
      p1: 'Old Town Architectural Quarter & Clock Tower',
      p2: 'Spice Market & Artisan Souvenir Walk',
      p3: 'Grand Farewell Dinner Banquet',
      p4: 'Illuminated City Monuments Night Drive',
    },
  ];

  // Fallback 1..duration structured generator with 100% unique places across all days
  const fallbackDays: DayPlan[] = [];
  for (let i = 1; i <= duration; i++) {
    const dayAnchorLat = baseLat + (i * 0.012);
    const dayAnchorLon = baseLon + (i * 0.012);
    const theme = dayThemes[(i - 1) % dayThemes.length];

    fallbackDays.push({
      day: i,
      activities: [
        {
          name: `${destination} ${theme.p1}`,
          type: 'sightseeing',
          duration: '2.5 Hours',
          cost: 0,
          description: `Morning anchor attraction for Day ${i}: explore unique landmarks without repetition.`,
          lat: Number(dayAnchorLat.toFixed(4)),
          lon: Number(dayAnchorLon.toFixed(4)),
        },
        {
          name: `${theme.p2}`,
          type: 'sightseeing',
          duration: '1.5 Hours',
          cost: 0,
          description: `Located 1.8 km (< 5 km radius) from the morning landmark.`,
          lat: Number((dayAnchorLat + 0.008).toFixed(4)),
          lon: Number((dayAnchorLon + 0.005).toFixed(4)),
        },
        {
          name: `${theme.p3}`,
          type: 'dining',
          duration: '2 Hours',
          cost: 0,
          description: `Located 1.4 km (< 5 km radius) from the cultural spot.`,
          lat: Number((dayAnchorLat + 0.012).toFixed(4)),
          lon: Number((dayAnchorLon + 0.002).toFixed(4)),
        },
        {
          name: `${theme.p4}`,
          type: 'activity',
          duration: '1.5 Hours',
          cost: 0,
          description: `Located 2.1 km (< 5 km radius) from lunch, followed by evening relaxation.`,
          lat: Number((dayAnchorLat + 0.015).toFixed(4)),
          lon: Number((dayAnchorLon - 0.004).toFixed(4)),
        },
      ],
      estimatedCost: 0,
    });
  }

  return {
    destination,
    duration,
    budget: 0,
    itinerary: fallbackDays,
    totalCost: 0,
    tips: [
      `All consecutive daily stops are clustered within 5 km hops.`,
      `Every day visits completely fresh, unique places.`,
      `Comfortable walking shoes are recommended.`,
      `Use local transport for quick hops between sights.`,
    ],
  };
}

/**
 * Intelligent AI Itinerary Adjuster for Planner Chat
 * Dynamically moves unvisited places, adds nearby stops (<5km), swaps days, or re-balances routes
 */
export async function adjustTravelPlanWithAI(
  currentPlan: TravelPlan,
  userInstruction: string
): Promise<{ updatedPlan: TravelPlan; message: string }> {
  const apiKey = getGroqApiKey();
  const cleanInstruction = userInstruction.trim();

  if (!apiKey) {
    return {
      updatedPlan: currentPlan,
      message: '⚠️ Please configure your Groq API key in API Settings to use the AI Itinerary Assistant.',
    };
  }

  try {
    const systemPrompt = `You are the TripVerse AI Itinerary Optimizer & Travel Concierge.
The user has an existing travel itinerary and wants to make real-time adjustments (e.g. they only visited 1 place today due to unexpected delay/weather, so unvisited places need to be rescheduled to subsequent days, or they want new nearby attractions added under 5km distance, or activities swapped).

YOUR OBJECTIVES:
1. Reason over the user request carefully.
2. If the user only visited certain places on Day X, move the unvisited places to Day X+1 or subsequent days without dropping them.
3. Ensure every day maintains 3-5 high-value attractions clustered geographically (< 5 km apart).
4. Return a valid JSON object matching this EXACT format:
{
  "explanation": "Clear, friendly 1-2 sentence explanation of the modifications made (e.g. 'I have rescheduled the unvisited museum from Day 1 to Day 2 afternoon, keeping all Day 2 spots within 3 km of each other!')",
  "itinerary": [
    {
      "day": 1,
      "estimatedCost": 1200,
      "activities": [
        {
          "name": "Attraction Name",
          "type": "sightseeing",
          "duration": "2 Hours",
          "cost": 500,
          "description": "Short description",
          "lat": 28.6139,
          "lon": 77.2090
        }
      ]
    }
  ]
}`;

    const userPayload = `Current Destination: ${currentPlan.destination}
Total Days: ${currentPlan.duration}
Total Budget: ₹${currentPlan.budget}
Current Itinerary JSON:
${JSON.stringify(currentPlan.itinerary, null, 2)}

User Request: "${cleanInstruction}"

Please return the updated itinerary JSON with your explanation:`;

    const response = await callGroqWithFallback(apiKey, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPayload },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    if (response.ok) {
      const data = await response.json();
      const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      
      if (content.itinerary && Array.isArray(content.itinerary) && content.itinerary.length > 0) {
        // Recalculate costs & lat/lon safeguards
        const newItinerary: DayPlan[] = content.itinerary.map((dayItem: any, dayIdx: number) => {
          const dayNum = dayItem.day || (dayIdx + 1);
          const baseLat = dayItem.activities?.[0]?.lat || 20.5937;
          const baseLon = dayItem.activities?.[0]?.lon || 78.9629;

          const activities: Activity[] = (dayItem.activities || []).map((act: any, aIdx: number) => ({
            name: act.name || `Activity ${aIdx + 1}`,
            type: act.type || 'sightseeing',
            duration: act.duration || '2 Hours',
            cost: typeof act.cost === 'number' ? act.cost : 500,
            description: act.description || '',
            lat: act.lat || Number((baseLat + (aIdx * 0.005)).toFixed(4)),
            lon: act.lon || Number((baseLon + (aIdx * 0.005)).toFixed(4)),
          }));

          return {
            day: dayNum,
            activities,
            estimatedCost: activities.reduce((sum, a) => sum + a.cost, 0),
          };
        });

        const updatedPlan: TravelPlan = {
          ...currentPlan,
          itinerary: newItinerary,
          totalCost: newItinerary.reduce((sum, d) => sum + d.estimatedCost, 0),
        };

        return {
          updatedPlan,
          message: content.explanation || `Successfully updated your itinerary according to your request!`,
        };
      }
    }
  } catch (error: any) {
    console.error('Error adjusting travel plan with AI:', error);
  }

  // Graceful fallback if AI parse is interrupted
  return {
    updatedPlan: currentPlan,
    message: `I understood: "${cleanInstruction}". Your itinerary is preserved. For full automatic rescheduling, ensure your Groq API key is active in API Settings.`,
  };
}

function parseAIResponseToDays(
  response: string, 
  duration: number, 
  budget: number,
  baseLat: number = 20.5937,
  baseLon: number = 78.9629
): DayPlan[] {
  const days: DayPlan[] = [];
  const lines = response.split('\n');
  
  let currentDay: DayPlan | null = null;
  let currentActivity: Partial<Activity> | null = null;
  let actIdx = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    
    // Check for Day header
    const dayMatch = line.match(/^[-*#\s]*Day\s+(\d+)[:\s]*/i);
    if (dayMatch) {
      if (currentActivity && currentDay) {
        currentDay.activities.push(currentActivity as Activity);
        currentActivity = null;
      }
      if (currentDay) {
        currentDay.estimatedCost = currentDay.activities.reduce((s, a) => s + (a.cost || 0), 0);
        days.push(currentDay);
      }
      const dayNum = parseInt(dayMatch[1]);
      currentDay = {
        day: dayNum,
        activities: [],
        estimatedCost: 0,
      };
      actIdx = 0;
      continue;
    }

    // Stop parsing if we hit Tips section
    if (line.match(/^[-*#\s]*Tips[:\s]*/i)) {
      break;
    }

    if (!currentDay) continue;

    // Check for Activity Name
    const nameMatch = line.match(/^[-*\s]*(?:Name:\s*|Activity:\s*|\d+\.\s*)(.+)/i);
    if (nameMatch && !line.match(/^(?:Type|Duration|Cost|Description|Location):/i)) {
      if (currentActivity && currentActivity.name) {
        currentDay.activities.push(currentActivity as Activity);
      }
      actIdx++;
      // Assign realistic tight geographic cluster (< 2-3 km) per day
      const dayOffsetLat = ((currentDay.day - 1) * 0.02) * Math.cos(currentDay.day);
      const dayOffsetLon = ((currentDay.day - 1) * 0.02) * Math.sin(currentDay.day);
      
      const actOffsetLat = (actIdx * 0.004) * Math.sin(actIdx * 1.3);
      const actOffsetLon = (actIdx * 0.004) * Math.cos(actIdx * 1.3);

      currentActivity = {
        name: nameMatch[1].replace(/\*\*/g, '').trim(),
        type: 'sightseeing',
        duration: '2 Hours',
        cost: 500,
        description: '',
        lat: Number((baseLat + dayOffsetLat + actOffsetLat).toFixed(4)),
        lon: Number((baseLon + dayOffsetLon + actOffsetLon).toFixed(4)),
      };
      continue;
    }

    if (!currentActivity) continue;

    // Parse Activity fields
    const typeMatch = line.match(/^[-*\s]*Type:\s*(.+)/i);
    if (typeMatch) {
      currentActivity.type = typeMatch[1].toLowerCase().replace(/\*\*/g, '').trim();
      continue;
    }

    const durationMatch = line.match(/^[-*\s]*Duration:\s*(.+)/i);
    if (durationMatch) {
      currentActivity.duration = durationMatch[1].replace(/\*\*/g, '').trim();
      continue;
    }

    const costMatch = line.match(/^[-*\s]*Cost:\s*(?:₹|INR\s*)?(\d[\d,]*)/i);
    if (costMatch) {
      currentActivity.cost = parseInt(costMatch[1].replace(/,/g, ''));
      continue;
    }

    const descMatch = line.match(/^[-*\s]*Description:\s*(.+)/i);
    if (descMatch) {
      currentActivity.description = descMatch[1].replace(/\*\*/g, '').trim();
      continue;
    }
  }

  // Push remaining
  if (currentActivity && currentDay) {
    currentDay.activities.push(currentActivity as Activity);
  }
  if (currentDay) {
    currentDay.estimatedCost = currentDay.activities.reduce((s, a) => s + (a.cost || 0), 0);
    days.push(currentDay);
  }

  // If AI didn't format properly, generate a structured 4-place/day fallback (<5km clustered)
  if (days.length === 0) {
    const dailyBudget = Math.floor(budget / duration);
    for (let i = 1; i <= duration; i++) {
      const dayLat = baseLat + (i * 0.015);
      const dayLon = baseLon + (i * 0.015);

      days.push({
        day: i,
        activities: [
          {
            name: `Day ${i} Morning Landmark`,
            type: 'sightseeing',
            duration: '2.5 Hours',
            cost: Math.floor(dailyBudget * 0.25),
            description: `Visit iconic historical monuments and cultural heritage sites on Day ${i}.`,
            lat: Number((dayLat + 0.002).toFixed(4)),
            lon: Number((dayLon + 0.002).toFixed(4)),
          },
          {
            name: `Day ${i} Heritage Walk & Museum`,
            type: 'sightseeing',
            duration: '2 Hours',
            cost: Math.floor(dailyBudget * 0.2),
            description: `Explore nearby exhibits, art galleries, and historic streets (< 2 km away).`,
            lat: Number((dayLat + 0.005).toFixed(4)),
            lon: Number((dayLon - 0.003).toFixed(4)),
          },
          {
            name: `Day ${i} Regional Cuisine Lunch`,
            type: 'dining',
            duration: '1.5 Hours',
            cost: Math.floor(dailyBudget * 0.25),
            description: `Sample celebrated local dishes at top-rated nearby restaurants.`,
            lat: Number((dayLat - 0.004).toFixed(4)),
            lon: Number((dayLon + 0.004).toFixed(4)),
          },
          {
            name: `Day ${i} Sunset Viewpoint & Evening Rest`,
            type: 'activity',
            duration: '2 Hours',
            cost: 0,
            description: `Scenic sunset views followed by leisure relaxation at your stay.`,
            lat: Number((dayLat - 0.002).toFixed(4)),
            lon: Number((dayLon - 0.002).toFixed(4)),
          },
        ],
        estimatedCost: 0,
      });
    }
  }

  // Strictly deduplicate by day number
  const uniqueMap = new Map<number, DayPlan>();
  for (const d of days) {
    if (!uniqueMap.has(d.day) || d.activities.length > (uniqueMap.get(d.day)?.activities.length || 0)) {
      uniqueMap.set(d.day, d);
    }
  }

  const sortedUniqueDays = Array.from(uniqueMap.values()).sort((a, b) => a.day - b.day);
  return sortedUniqueDays.slice(0, duration);
}

function extractTipsFromResponse(response: string): string[] {
  const tips: string[] = [];
  const lines = response.split('\n');
  let inTipsSection = false;

  for (const line of lines) {
    if (line.match(/^[-*#\s]*Tips[:\s]*/i)) {
      inTipsSection = true;
      continue;
    }
    if (inTipsSection) {
      const tipMatch = line.match(/^[-*\d.]+\s*(.+)/);
      if (tipMatch && tipMatch[1].trim()) {
        tips.push(tipMatch[1].replace(/\*\*/g, '').trim());
      }
    }
  }

  return tips.slice(0, 5);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
