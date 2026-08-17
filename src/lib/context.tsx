import type { ReactNode, Dispatch } from 'react';
import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import {
  Place, TravelPlan, ExchangeRates, TavilySearchResult,
  searchDestinations, generateTravelPlan, generateAIResponse, adjustTravelPlanWithAI,
  tavilySearch as tavilySearchService, tavilyAnswer,
  convertCurrency as convertCurrencyService, getExchangeRates,
} from './services';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  plan?: TravelPlan;
  savedPlaces: Place[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  places?: Place[];
}

export interface AppState {
  user: User | null;
  trips: Trip[];
  currentTrip: Trip | null;
  searchResults: Place[];
  filters: {
    budget: number;
    category: string;
    rating: number;
    preferences: string[];
  };
  chatMessages: ChatMessage[];
  exchangeRates: ExchangeRates | null;
  isLoading: boolean;
  error: string | null;
}

// Action types
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TRIPS'; payload: Trip[] }
  | { type: 'ADD_TRIP'; payload: Trip }
  | { type: 'UPDATE_TRIP'; payload: { id: string; updates: Partial<Trip> } }
  | { type: 'DELETE_TRIP'; payload: string }
  | { type: 'SET_CURRENT_TRIP'; payload: Trip | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: Place[] }
  | { type: 'SET_FILTERS'; payload: Partial<AppState['filters']> }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_EXCHANGE_RATES'; payload: ExchangeRates }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Initial state
const initialState: AppState = {
  user: null,
  trips: [],
  currentTrip: null,
  searchResults: [],
  filters: {
    budget: 50000,
    category: 'all',
    rating: 0,
    preferences: [],
  },
  chatMessages: [],
  exchangeRates: null,
  isLoading: false,
  error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TRIPS':
      return { ...state, trips: action.payload };
    case 'ADD_TRIP':
      return { ...state, trips: [...state.trips, action.payload] };
    case 'UPDATE_TRIP':
      return {
        ...state,
        trips: state.trips.map(trip =>
          trip.id === action.payload.id ? { ...trip, ...action.payload.updates } : trip
        ),
        currentTrip: state.currentTrip?.id === action.payload.id
          ? { ...state.currentTrip, ...action.payload.updates }
          : state.currentTrip,
      };
    case 'DELETE_TRIP':
      return {
        ...state,
        trips: state.trips.filter(trip => trip.id !== action.payload),
        currentTrip: state.currentTrip?.id === action.payload ? null : state.currentTrip,
      };
    case 'SET_CURRENT_TRIP':
      return { ...state, currentTrip: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload };
    case 'SET_EXCHANGE_RATES':
      return { ...state, exchangeRates: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
  actions: {
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    signup: (email: string, password: string, name: string) => Promise<boolean>;
    updateUser: (updates: Partial<User>) => void;
    searchDestinations: (location: string, preferences?: string[]) => Promise<void>;
    updateFilters: (filters: Partial<AppState['filters']>) => void;
    createTrip: (name: string, destination: string, startDate: string, endDate: string, budget: number) => Promise<Trip>;
    updateTrip: (tripId: string, updates: Partial<Trip>) => void;
    deleteTrip: (tripId: string) => void;
    savePlace: (place: Place) => void;
    removePlace: (placeId: string) => void;
    generateAIPlan: (destination: string, duration: number, budget?: number, preferences?: string[], options?: { context?: string; placesPerDay?: number }) => Promise<void>;
    adjustTripPlan: (instruction: string) => Promise<string>;
    sendChatMessage: (message: string) => Promise<void>;
    convertCurrency: (amount: number, from: string, to: string) => Promise<{ convertedAmount: number; rate: number }>;
    loadExchangeRates: (baseCurrency?: string) => Promise<void>;
    searchWeb: (query: string) => Promise<TavilySearchResult[]>;
    clearError: () => void;
    clearChat: () => void;
  };
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const isInitialMount = useRef(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tripverse_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('tripverse_user');
      }
    }

    const savedTrips = localStorage.getItem('tripverse_trips');
    if (savedTrips) {
      try {
        const trips = JSON.parse(savedTrips);
        dispatch({ type: 'SET_TRIPS', payload: trips });
      } catch (error) {
        console.error('Error parsing saved trips:', error);
        localStorage.removeItem('tripverse_trips');
      }
    }
  }, []);

  // Save trips to localStorage whenever they change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('tripverse_trips', JSON.stringify(state.trips));
  }, [state.trips]);

  const actions = {
    // Authentication
    login: async (email: string, password: string): Promise<boolean> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Simulate API call - in production, this would be a real API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email && password) {
          const user: User = {
            id: Date.now().toString(),
            email,
            name: email.split('@')[0],
          };
          dispatch({ type: 'SET_USER', payload: user });
          localStorage.setItem('tripverse_user', JSON.stringify(user));
          return true;
        }
        return false;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Login failed. Please try again.' });
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    updateUser: (updates: Partial<User>) => {
      const currentUser = state.user || {
        id: 'user_' + Date.now(),
        email: 'explorer@tripverse.app',
        name: 'New Explorer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      };
      const updated = { ...currentUser, ...updates };
      dispatch({ type: 'SET_USER', payload: updated });
      localStorage.setItem('tripverse_user', JSON.stringify(updated));
    },

    logout: () => {
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_CURRENT_TRIP', payload: null });
      localStorage.removeItem('tripverse_user');
    },

    signup: async (email: string, password: string, name: string): Promise<boolean> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email && password && name) {
          const user: User = {
            id: Date.now().toString(),
            email,
            name,
          };
          dispatch({ type: 'SET_USER', payload: user });
          localStorage.setItem('tripverse_user', JSON.stringify(user));
          return true;
        }
        return false;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Signup failed. Please try again.' });
        return false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    // Search functionality
    searchDestinations: async (location: string, preferences?: string[]) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        const results = await searchDestinations({
          location,
          budget: state.filters.budget,
          preferences: preferences || state.filters.preferences,
          category: state.filters.category,
        });
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to search destinations. Please try again.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    // Filters
    updateFilters: (filters: Partial<AppState['filters']>) => {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    },

    // Trip management
    createTrip: async (name: string, destination: string, startDate: string, endDate: string, budget: number): Promise<Trip> => {
      const trip: Trip = {
        id: Date.now().toString(),
        name,
        destination,
        startDate,
        endDate,
        budget,
        savedPlaces: [],
        createdAt: new Date().toISOString(),
      };
      
      dispatch({ type: 'ADD_TRIP', payload: trip });
      dispatch({ type: 'SET_CURRENT_TRIP', payload: trip });
      return trip;
    },

    savePlace: (place: Place) => {
      if (state.currentTrip) {
        const updatedPlaces = [...state.currentTrip.savedPlaces, place];
        dispatch({
          type: 'UPDATE_TRIP',
          payload: { id: state.currentTrip.id, updates: { savedPlaces: updatedPlaces } },
        });
      }
    },

    removePlace: (placeId: string) => {
      if (state.currentTrip) {
        const updatedPlaces = state.currentTrip.savedPlaces.filter(place => place.id !== placeId);
        dispatch({
          type: 'UPDATE_TRIP',
          payload: { id: state.currentTrip.id, updates: { savedPlaces: updatedPlaces } },
        });
      }
    },

    // AI planning
    generateAIPlan: async (destination: string, duration: number, budget?: number, preferences?: string[], options?: { context?: string; placesPerDay?: number }) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const plan = await generateTravelPlan({
          destination,
          duration,
          budget: budget || 0,
          placesPerDay: options?.placesPerDay,
          preferences,
          options,
        });
        
        if (state.currentTrip) {
          dispatch({
            type: 'UPDATE_TRIP',
            payload: { id: state.currentTrip.id, updates: { plan } },
          });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to generate AI plan. Please try again.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    // Dynamic AI Itinerary Adjustment & Rescheduling
    adjustTripPlan: async (instruction: string): Promise<string> => {
      if (!state.currentTrip?.plan) {
        return 'No active itinerary to adjust. Please generate an itinerary first.';
      }
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const { updatedPlan, message } = await adjustTravelPlanWithAI(state.currentTrip.plan, instruction);
        dispatch({
          type: 'UPDATE_TRIP',
          payload: { id: state.currentTrip.id, updates: { plan: updatedPlan } },
        });
        return message;
      } catch (error) {
        return 'Could not adjust itinerary. Please try again.';
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    // Trip management (additional)
    updateTrip: (tripId: string, updates: Partial<Trip>) => {
      dispatch({ type: 'UPDATE_TRIP', payload: { id: tripId, updates } });
    },

    deleteTrip: (tripId: string) => {
      dispatch({ type: 'DELETE_TRIP', payload: tripId });
    },

    // Chat functionality (real Groq AI + Tavily enrichment)
    sendChatMessage: async (message: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMessage });
      
      try {
        // Enrich with Tavily web search
        let webContext = '';
        try {
          const webAnswer = await tavilyAnswer(message);
          if (webAnswer) {
            webContext = `\n\nRecent web information: ${webAnswer}`;
          }
        } catch (e) {
          // Tavily enrichment is optional
        }

        // Generate AI response with Groq
        const aiContent = await generateAIResponse(
          message + webContext,
          state.currentTrip ? { currentTrip: state.currentTrip.destination } : undefined
        );
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_CHAT_MESSAGE', payload: assistantMessage });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to send message. Please try again.' });
      }
    },

    // Currency conversion
    convertCurrency: async (amount: number, from: string, to: string) => {
      return await convertCurrencyService(amount, from, to);
    },

    // Load exchange rates
    loadExchangeRates: async (baseCurrency: string = 'USD') => {
      try {
        const rates = await getExchangeRates(baseCurrency);
        dispatch({ type: 'SET_EXCHANGE_RATES', payload: rates });
      } catch (error) {
        console.error('Failed to load exchange rates:', error);
      }
    },

    // Tavily web search
    searchWeb: async (query: string) => {
      return await tavilySearchService(query);
    },

    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null });
    },

    clearChat: () => {
      dispatch({ type: 'SET_CHAT_MESSAGES', payload: [] });
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
