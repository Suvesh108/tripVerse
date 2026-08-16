// API service functions for external integrations

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
  location: string;
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
  score: number;
}

// ============================================================
// API Key Helpers
// ============================================================

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api';


// ============================================================
// 1. Overpass API — Places Search (OpenStreetMap)
//    https://overpass-api.de/api/interpreter
// ============================================================

// Geocode a location name to lat/lon using Nominatim (OpenStreetMap)
export async function geocode(locationName: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&countrycodes=in&limit=1`,
      { headers: { 'User-Agent': 'TripVerse/1.0' } }
    );
    const data = await response.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}


/**
 * Fetches detailed history and area insights using Groq AI
 */
export async function getDetailedInsights(location: string): Promise<{ history: string; areaInfo: string; highlights: { title: string; desc: string; icon: string }[] }> {
  try {
    const prompt = `Provide detailed insights for ${location}. 
    1. History of the place (about 100 words).
    2. About the area and its vibe (about 50 words).
    3. Three key experience highlights with a short title, description, and a Lucide icon name (like Camera, Wine, Mountain, MapPin, etc.).
    Format the response as JSON: { "history": "...", "areaInfo": "...", "highlights": [{ "title": "...", "desc": "...", "icon": "..." }] }`;

    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) throw new Error('AI insights failed');
    const data = await response.json();
    const content = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    
    return {
      history: content.history || 'History details coming soon...',
      areaInfo: content.areaInfo || 'Discover the local charm of this area.',
      highlights: content.highlights || [
        { title: 'Local Landmarks', desc: 'Must-visit historical sites', icon: 'MapPin' },
        { title: 'Hidden Gems', desc: 'Off-the-beaten-path experiences', icon: 'Sparkles' },
        { title: 'Food & Culture', desc: 'Authentic local traditions', icon: 'Utensils' }
      ]
    };
  } catch (error) {
    console.error('Error fetching detailed insights:', error);
    return {
      history: 'Discover the rich historical tapestry of this destination, where ancient traditions meet modern life.',
      areaInfo: 'This area is known for its vibrant community and stunning landscapes.',
      highlights: [
        { title: 'Iconic Sights', desc: 'Breathtaking views and landmarks', icon: 'Camera' },
        { title: 'Cultural Heritage', desc: 'Rich history and local customs', icon: 'Globe' },
        { title: 'Local Flavors', desc: 'A culinary journey like no other', icon: 'Utensils' }
      ]
    };
  }
}

/**
 * Calculates an optimal visit path using a Greedy (Nearest Neighbor) approach
 * This serves as a practical implementation of the visiting order requirement.
 */
export function calculateOptimalPath(places: Place[]): Place[] {
  if (places.length <= 1) return places;
  
  const result: Place[] = [];
  const remaining = [...places];
  
  // Start with the first place in the list
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
  try {
    const coords = await geocode(location);
    if (!coords) return [];

    const searchRadius = 30000;
    let tourismTypes = '';
    
    if (category === 'Hotel') {
      tourismTypes = 'hotel|hostel|guest_house|motel';
    } else if (category === 'Restaurant') {
      tourismTypes = 'restaurant|cafe|food_court|fast_food';
    } else {
      tourismTypes = 'attraction|museum|viewpoint|gallery|theme_park';
    }

    const query = `
      [out:json][timeout:25];
      (
        node["tourism"~"${tourismTypes}"]["name"](around:${searchRadius}, ${coords.lat}, ${coords.lon});
        way["tourism"~"${tourismTypes}"]["name"](around:${searchRadius}, ${coords.lat}, ${coords.lon});
        relation["tourism"~"${tourismTypes}"]["name"](around:${searchRadius}, ${coords.lat}, ${coords.lon});
        
        node["amenity"~"restaurant|cafe"]["name"](around:${searchRadius}, ${coords.lat}, ${coords.lon});
        way["amenity"~"restaurant|cafe"]["name"](around:${searchRadius}, ${coords.lat}, ${coords.lon});
      );
      out center 30;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();
    
    // Filter out duplicates by name
    const seenNames = new Set<string>();
    const uniquePlaces: any[] = [];
    
    for (const element of (data.elements || [])) {
      const name = element.tags?.name;
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        uniquePlaces.push(element);
      }
    }
    
    return uniquePlaces.map((element: any) => ({
      id: element.id.toString(),
      name: element.tags?.name || 'Unknown Place',
      location: {
        lat: element.lat || element.center?.lat || 0,
        lon: element.lon || element.center?.lon || 0,
        address: element.tags?.['addr:full'] || `${element.tags?.name}, ${location}`,
      },
      category: element.tags?.tourism || element.tags?.historic || 'attraction',
      rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)), // Random rating between 3.5-5.0
      tags: Object.keys(element.tags || {}).filter(key => key.startsWith('tourism') || key.startsWith('historic') || key === 'wikidata'),
    }));
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

// ============================================================
// 2. Wikipedia API — Destination Descriptions
//    https://en.wikipedia.org/api/rest_v1/
// ============================================================

export async function getWikiInfo(placeName: string): Promise<string> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
    );
    
    if (!response.ok) {
      return 'No description available for this location.';
    }
    
    const data = await response.json();
    return data.extract || 'No description available for this location.';
  } catch (error) {
    console.error('Error fetching Wikipedia info:', error);
    return 'No description available for this location.';
  }
}

// ============================================================
// 3. Open-Meteo API — Weather Data
//    https://api.open-meteo.com/v1/forecast
// ============================================================

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );
    
    const data = await response.json();
    
    return {
      temperature: data.current_weather?.temperature || 20,
      condition: data.current_weather?.weathercode ? getWeatherCondition(data.current_weather.weathercode) : 'Clear',
      humidity: data.current_weather?.humidity || 50,
      windSpeed: data.current_weather?.windspeed || 10,
      icon: getWeatherIcon(data.current_weather?.weathercode || 0),
    };
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
// 4. Groq API — AI Chat & Travel Planning
//    https://api.groq.com/openai/v1/chat/completions
// ============================================================

export async function generateAIResponse(prompt: string, context?: any): Promise<string> {
  try {
    const systemPrompt = `You are a helpful travel planning assistant for TripVerse. 
    Provide detailed, practical travel advice and create comprehensive itineraries. 
    Be specific about locations, costs (in INR), and timing. 
    Format your responses in a clear, organized way.
    If you are generating an itinerary, always use a clear 'Day X:' header followed by activities with '- Name: [Activity Name]', '- Type: [Type]', '- Duration: [Duration]', '- Cost: [Cost in INR]', and '- Description: [Description]'.`;

    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(context ? [{ role: 'system', content: `Additional context: ${JSON.stringify(context)}` }] : []),
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'text' } // Using text but with strict formatting
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API error:', response.status, errorData);
      return 'I apologize, but I encountered an error while processing your request. Please try again.';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, but I\'m having trouble connecting to my AI services right now. Please try again later.';
  }
}

// ============================================================
// 5. Tavily API — Web Search for Travel Info
//    https://api.tavily.com/search
// ============================================================

export async function tavilySearch(query: string, maxResults: number = 5): Promise<TavilySearchResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `travel ${query}`,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: true,
      }),
    });

    if (!response.ok) {
      console.error('Tavily API error:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }));
  } catch (error) {
    console.error('Error with Tavily search:', error);
    return [];
  }
}

// Get a summarized answer from Tavily
export async function tavilyAnswer(query: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `travel ${query}`,
        max_results: 3,
        search_depth: 'basic',
        include_answer: true,
      }),
    });

    if (!response.ok) return '';

    const data = await response.json();
    return data.answer || '';
  } catch (error) {
    console.error('Error with Tavily answer:', error);
    return '';
  }
}

// ============================================================
// 6. ExchangeRate API — Currency Conversion
//    https://v6.exchangerate-api.com/v6/{key}/latest/{base}
// ============================================================

export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  try {
    const response = await fetch(`${API_BASE_URL}/exchange/latest/${baseCurrency}`);

    if (!response.ok) {
      console.error('ExchangeRate API error:', response.status);
      return { base: baseCurrency, rates: {}, lastUpdated: '' };
    }

    const data = await response.json();
    return {
      base: data.base_code || baseCurrency,
      rates: data.conversion_rates || {},
      lastUpdated: data.time_last_update_utc || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return { base: baseCurrency, rates: {}, lastUpdated: '' };
  }
}

export async function convertCurrency(
  amount: number,
  from: string = 'USD',
  to: string = 'EUR'
): Promise<{ convertedAmount: number; rate: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/exchange/pair/${from}/${to}/${amount}`);

    if (!response.ok) {
      return { convertedAmount: amount, rate: 1 };
    }

    const data = await response.json();
    return {
      convertedAmount: data.conversion_result || amount,
      rate: data.conversion_rate || 1,
    };
  } catch (error) {
    console.error('Error converting currency:', error);
    return { convertedAmount: amount, rate: 1 };
  }
}

// ============================================================
// 7. Leaflet / OpenStreetMap — Map Tile URL
//    https://tile.openstreetmap.org/{z}/{x}/{y}.png
// ============================================================

export const LEAFLET_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const LEAFLET_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
    53: '🌦️',
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

export async function searchDestinations(params: {
  location: string;
  budget?: number;
  preferences?: string[];
  category?: string;
}): Promise<Place[]> {
  const { location, budget, preferences, category } = params;
  
  try {
    // Get places from Overpass
    const places = await getPlaces(location, category);
    
    // Enhance with Wikipedia descriptions and weather
    const enhancedPlaces = await Promise.all(
      places.map(async (place) => {
        const description = await getWikiInfo(place.name);
        const weather = await getWeather(place.location.lat, place.location.lon);
        
        return {
          ...place,
          description,
          weather,
          price: Math.floor(Math.random() * 20000) + 5000, // Random price between 5000-25000 INR
        };
      })
    );
    
    // Apply filters and scoring
    let filteredPlaces = enhancedPlaces;
    
    if (budget) {
      filteredPlaces = filteredPlaces.filter(place => 
        !place.price || place.price <= budget
      );
    }
    
    if (preferences && preferences.length > 0) {
      filteredPlaces = filteredPlaces.filter(place =>
        preferences.some(pref => 
          place.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase())) ||
          place.name.toLowerCase().includes(pref.toLowerCase())
        )
      );
    }
    
    // Apply recommendation scoring
    return filteredPlaces.map(place => ({
      ...place,
      score: calculateRecommendationScore(place, params),
    })).sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.error('Error searching destinations:', error);
    return [];
  }
}

// ============================================================
// Recommendation Scoring
// ============================================================

export function calculateRecommendationScore(place: Place, params: {
  budget?: number;
  preferences?: string[];
}): number {
  let score = 0;
  
  // +5 if matches user preference
  if (params.preferences && params.preferences.length > 0) {
    const hasPreferenceMatch = params.preferences.some(pref =>
      place.tags.some(tag => tag.toLowerCase().includes(pref.toLowerCase())) ||
      place.name.toLowerCase().includes(pref.toLowerCase())
    );
    if (hasPreferenceMatch) score += 5;
  }
  
  // +5 if within budget
  if (params.budget && (!place.price || place.price <= params.budget)) {
    score += 5;
  }
  
  // +3 if rating ≥ 4
  if (place.rating >= 4) {
    score += 3;
  }
  
  return score;
}

// ============================================================
// AI Travel Plan Generation (Groq + Tavily enrichment)
// ============================================================

export async function generateTravelPlan(input: {
  destination: string;
  duration: number;
  budget: number;
  preferences?: string[];
}): Promise<TravelPlan> {
  const { destination, duration, budget, preferences } = input;
  
  // Enrich AI context with real web search data from Tavily
  let tavilyContext = '';
  try {
    const searchResults = await tavilySearch(`best things to do in ${destination} travel guide`, 3);
    if (searchResults.length > 0) {
      tavilyContext = `\n\nHere is some recent travel information about ${destination}:\n` +
        searchResults.map(r => `- ${r.title}: ${r.content.slice(0, 200)}`).join('\n');
    }
  } catch (e) {
    // Tavily enrichment is optional, continue without it
  }

  const prompt = `Create a detailed ${duration}-day travel plan for ${destination} with a budget of ₹${budget}. 
  Include specific activities, restaurants, and attractions. 
  ${preferences ? `Focus on these preferences: ${preferences.join(', ')}.` : ''}
  ${tavilyContext}
  Format as a day-by-day itinerary with estimated costs for each activity.`;
  
  const aiResponse = await generateAIResponse(prompt);
  
  // Parse AI response and create structured plan
  const days = parseAIResponseToDays(aiResponse, duration);
  
  return {
    destination,
    duration,
    budget,
    itinerary: days,
    totalCost: days.reduce((sum, day) => sum + day.estimatedCost, 0),
    tips: [
      'Book accommodations in advance for better rates',
      'Consider local transportation passes',
      'Check seasonal weather patterns',
      'Make restaurant reservations for popular spots'
    ],
  };
}

function parseAIResponseToDays(response: string, duration: number): DayPlan[] {
  const days: DayPlan[] = [];
  const daySections = response.split(/Day\s*\d+\s*[:\-]/i);
  
  // Skip the first section if it's preamble
  const actualDays = daySections.length > duration ? daySections.slice(1) : daySections;

  for (let i = 0; i < duration; i++) {
    const dayContent = actualDays[i] || '';
    const activities: Activity[] = [];
    
    // Regex to find activity blocks
    const activityMatches = dayContent.split(/\-\s*Name\s*[:\-]/i).slice(1);
    
    activityMatches.forEach(block => {
      const name = block.split(/\n/)[0].trim();
      const typeMatch = block.match(/Type\s*[:\-]\s*([^\n]+)/i);
      const durationMatch = block.match(/Duration\s*[:\-]\s*([^\n]+)/i);
      const costMatch = block.match(/Cost\s*[:\-]\s*(?:₹|INR)?\s*([\d,]+)/i);
      const descMatch = block.match(/Description\s*[:\-]\s*([^\n]+)/i);

      activities.push({
        name: name || 'Sightseeing',
        type: typeMatch?.[1].trim().toLowerCase() || 'sightseeing',
        duration: durationMatch?.[1].trim() || '2 hours',
        cost: parseInt(costMatch?.[1].replace(/,/g, '') || '0'),
        description: descMatch?.[1].trim() || 'Enjoy the local atmosphere and scenery.',
        location: name || 'City Center',
        // Mock coordinates for the planner map (in a real app, these would come from geocoding each activity)
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lon: 77.2090 + (Math.random() - 0.5) * 0.1,
      });
    });

    // Fallback if no activities parsed
    if (activities.length === 0) {
      activities.push({
        name: 'Morning Exploration',
        type: 'sightseeing',
        duration: '3 hours',
        cost: 500,
        description: 'Explore the local landmarks and city center.',
        location: 'City Center'
      });
    }

    days.push({
      day: i + 1,
      activities,
      estimatedCost: activities.reduce((sum, a) => sum + a.cost, 0),
    });
  }
  
  return days;
}

// ============================================================
// Cache Utilities
// ============================================================

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedData(key: string): any | null {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedData(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// ============================================================
// Debounce Utility
// ============================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
}
