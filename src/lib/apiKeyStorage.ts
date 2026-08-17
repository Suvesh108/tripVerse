/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserApiKeys {
  groqApiKey: string;
  tavilyApiKey: string;
  exchangeRateApiKey: string;
  selectedGroqModel?: string;
  availableGroqModels?: string[];
}

const STORAGE_KEY = 'tripverse_user_api_keys';

// Preferred candidate model hierarchy for Groq
export const DEFAULT_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

/**
 * Retrieve saved API keys from localStorage, with fallback to environment variables
 */
export function getStoredApiKeys(): UserApiKeys {
  const envGroq = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
  const envTavily = (import.meta as any).env?.VITE_TAVILY_API_KEY || '';
  const envExchange = (import.meta as any).env?.VITE_EXCHANGERATE_API_KEY || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        groqApiKey: parsed.groqApiKey || envGroq || '',
        tavilyApiKey: parsed.tavilyApiKey || envTavily || '',
        exchangeRateApiKey: parsed.exchangeRateApiKey || envExchange || '',
        selectedGroqModel: parsed.selectedGroqModel || '',
        availableGroqModels: Array.isArray(parsed.availableGroqModels) ? parsed.availableGroqModels : [],
      };
    }
  } catch (error) {
    console.error('Failed to load user API keys from localStorage:', error);
  }

  return {
    groqApiKey: envGroq || '',
    tavilyApiKey: envTavily || '',
    exchangeRateApiKey: envExchange || '',
    selectedGroqModel: '',
    availableGroqModels: [],
  };
}

/**
 * Save user API keys locally in browser localStorage
 * NOTE: Keys are strictly kept on the client and never sent to any backend proxy or third-party server.
 */
export function saveStoredApiKeys(keys: Partial<UserApiKeys>): void {
  try {
    const current = getStoredApiKeys();
    const updated: UserApiKeys = {
      ...current,
      ...keys,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch a custom event so other components can react immediately
    window.dispatchEvent(new CustomEvent('tripverse_keys_updated', { detail: updated }));
  } catch (error) {
    console.error('Failed to save user API keys to localStorage:', error);
  }
}

/**
 * Clear all API keys from local browser storage
 */
export function clearStoredApiKeys(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('tripverse_keys_updated', { 
      detail: { groqApiKey: '', tavilyApiKey: '', exchangeRateApiKey: '', selectedGroqModel: '', availableGroqModels: [] } 
    }));
  } catch (error) {
    console.error('Failed to clear user API keys:', error);
  }
}

export function getGroqApiKey(): string {
  return getStoredApiKeys().groqApiKey.trim();
}

export function getTavilyApiKey(): string {
  return getStoredApiKeys().tavilyApiKey.trim();
}

export function getExchangeRateApiKey(): string {
  return getStoredApiKeys().exchangeRateApiKey.trim();
}

export function hasValidGroqKey(): boolean {
  const key = getGroqApiKey();
  return typeof key === 'string' && key.length > 5;
}

/**
 * Fetch available chat models directly from Groq using the provided API key
 */
export async function fetchAvailableGroqModels(apiKey: string): Promise<string[]> {
  const key = apiKey.trim();
  if (!key) return DEFAULT_GROQ_MODELS;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return DEFAULT_GROQ_MODELS;
    }

    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      // Filter active chat models (exclude audio/whisper/embedding models)
      const chatModels: string[] = data.data
        .filter((m: any) => {
          const id = (m.id || '').toLowerCase();
          return !id.includes('whisper') && !id.includes('embed') && !id.includes('tts') && (m.active !== false);
        })
        .map((m: any) => m.id);

      // Sort models prioritizing top performers (Llama 3.3, Llama 3.1, Gemma2, Mixtral)
      chatModels.sort((a, b) => {
        const indexA = DEFAULT_GROQ_MODELS.indexOf(a);
        const indexB = DEFAULT_GROQ_MODELS.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      });

      return chatModels.length > 0 ? chatModels : DEFAULT_GROQ_MODELS;
    }
  } catch (error) {
    console.error('Failed to fetch Groq models:', error);
  }

  return DEFAULT_GROQ_MODELS;
}

/**
 * Automatically determine the best active Groq model to use
 */
export function getBestGroqModel(): string {
  const stored = getStoredApiKeys();
  if (stored.selectedGroqModel && stored.selectedGroqModel !== 'auto') {
    return stored.selectedGroqModel;
  }
  if (stored.availableGroqModels && stored.availableGroqModels.length > 0) {
    return stored.availableGroqModels[0];
  }
  return DEFAULT_GROQ_MODELS[0];
}

/**
 * Test Groq API key connection and automatically discover & select available models
 */
export async function testGroqKey(apiKey: string): Promise<{ 
  success: boolean; 
  message: string; 
  models?: string[];
  selectedModel?: string;
}> {
  const key = apiKey.trim();
  if (!key) {
    return { success: false, message: 'Please enter a Groq API key.' };
  }

  try {
    // 1. Fetch live models available for this key
    const models = await fetchAvailableGroqModels(key);
    const candidateModel = models[0] || 'llama-3.3-70b-versatile';

    // 2. Perform a test completion with the candidate model
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: candidateModel,
        messages: [{ role: 'user', content: 'Reply with "OK"' }],
        max_tokens: 5,
      }),
    });

    if (res.ok) {
      // Save detected models and selected model to storage
      saveStoredApiKeys({
        groqApiKey: key,
        availableGroqModels: models,
        selectedGroqModel: candidateModel,
      });

      return { 
        success: true, 
        message: `Connected! Auto-selected model: ${candidateModel} (${models.length} models available)`,
        models,
        selectedModel: candidateModel
      };
    }

    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.error?.message || `Groq API responded with status ${res.status}. Check if key is valid.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error connecting to Groq API.' };
  }
}

/**
 * Test Tavily API key connection
 */
export async function testTavilyKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const key = apiKey.trim();
  if (!key) {
    return { success: false, message: 'Please enter a Tavily API key.' };
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: key,
        query: 'travel',
        max_results: 1,
      }),
    });

    if (res.ok) {
      saveStoredApiKeys({ tavilyApiKey: key });
      return { success: true, message: 'Tavily Search API Key is valid and connected!' };
    }

    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.error?.message || err.detail || `Tavily API responded with status ${res.status}.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error connecting to Tavily API.' };
  }
}

/**
 * Test ExchangeRate API key connection
 */
export async function testExchangeRateKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const key = apiKey.trim();
  if (!key) {
    return { success: false, message: 'Please enter an ExchangeRate API key.' };
  }

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`);
    const data = await res.json();

    if (res.ok && data.result === 'success') {
      saveStoredApiKeys({ exchangeRateApiKey: key });
      return { success: true, message: 'ExchangeRate API Key is valid and connected!' };
    }

    return {
      success: false,
      message: data['error-type'] ? `ExchangeRate error: ${data['error-type']}` : `API returned status ${res.status}.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error connecting to ExchangeRate API.' };
  }
}
