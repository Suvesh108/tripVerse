const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ============================================================
// Proxy Routes
// ============================================================

// 1. Groq AI Proxy
app.post('/api/ai/chat', async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured on server' });
    }

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', req.body, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Groq Proxy Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

// 2. Tavily Search Proxy
app.post('/api/search', async (req, res) => {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Tavily API key not configured on server' });
    }

    const response = await axios.post('https://api.tavily.com/search', {
      ...req.body,
      api_key: apiKey,
    });

    res.json(response.data);
  } catch (error) {
    console.error('Tavily Proxy Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

// 3. ExchangeRate Proxy (Latest Rates)
app.get('/api/exchange/latest/:base', async (req, res) => {
  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    const { base } = req.params;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'ExchangeRate API key not configured on server' });
    }

    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`);
    res.json(response.data);
  } catch (error) {
    console.error('ExchangeRate Proxy Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

// 4. ExchangeRate Proxy (Pair Conversion)
app.get('/api/exchange/pair/:from/:to/:amount', async (req, res) => {
  try {
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    const { from, to, amount } = req.params;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'ExchangeRate API key not configured on server' });
    }

    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${amount}`);
    res.json(response.data);
  } catch (error) {
    console.error('ExchangeRate Conversion Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Internal Server Error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TripVerse Secure Proxy running on http://localhost:${PORT}`);
});
