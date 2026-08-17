/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserApiKeys {
  groqApiKey: string;
  tavilyApiKey: string;
  exchangeRateApiKey: string;
}

const STORAGE_KEY = 'tripverse_user_api_keys';

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
      };
    }
  } catch (error) {
    console.error('Failed to load user API keys from localStorage:', error);
  }

  return {
    groqApiKey: envGroq || '',
    tavilyApiKey: envTavily || '',
    exchangeRateApiKey: envExchange || '',
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
    window.dispatchEvent(new CustomEvent('tripverse_keys_updated', { detail: { groqApiKey: '', tavilyApiKey: '', exchangeRateApiKey: '' } }));
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
 * Test Groq API key connection
 */
export async function testGroqKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  const key = apiKey.trim();
  if (!key) {
    return { success: false, message: 'Please enter a Groq API key.' };
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Reply with "OK"' }],
        max_tokens: 5,
      }),
    });

    if (res.ok) {
      return { success: true, message: 'Groq API Key is valid and connected!' };
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
      return { success: true, message: 'Tavily Search API Key is valid and connected!' };
    }

    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.message || err.error || `Tavily API responded with status ${res.status}.`,
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
    if (res.ok) {
      const data = await res.json();
      if (data.result === 'success') {
        return { success: true, message: 'ExchangeRate API Key is valid and connected!' };
      }
    }

    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err['error-type'] || `ExchangeRate API responded with status ${res.status}.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Network error connecting to ExchangeRate API.' };
  }
}
