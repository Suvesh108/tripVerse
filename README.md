# 🌍 TripVerse — AI-Powered Travel Planning & Discovery Platform (Client-Side BYOK)

TripVerse is a modern, intelligent travel planning and discovery platform built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Leaflet**.

TripVerse runs completely on the frontend with a **Client-Side "Bring Your Own Key" (BYOK) Architecture**. Users can enter their own free API keys directly in the frontend settings, allowing unlimited personalized travel planning without server-side rate limits or shared quotas.

---

## 🔒 Local Privacy & Security Architecture

- 🛡️ **100% Client-Side Storage**: All API keys are saved exclusively in your browser's local `localStorage`.
- 🚫 **Zero Backend Proxying / No Credential Sharing**: Keys are never transmitted to any intermediate server, backend database, or third party.
- 🌐 **Direct Provider Communication**: Network requests go straight from your browser to official provider endpoints over secure HTTPS (`api.groq.com`, `api.tavily.com`, `v6.exchangerate-api.com`, `open.er-api.com`, `open-meteo.com`, `openstreetmap.org`, `wikipedia.org`).
- ⚡ **Full User Control**: You can test, update, mask, or wipe your keys from browser storage at any time with a single click.

---

## ✨ Features

- 🤖 **AI-Powered Trip Planner**: Generates personalized, day-by-day itineraries with estimated budgets, activities, hotels, and attractions.
- 💬 **AI Travel Chat Assistant**: Real-time interactive travel concierge for customized suggestions, packing tips, and regional guides.
- 🗺️ **Interactive Maps & Geolocation**: Map view powered by **Leaflet** & **OpenStreetMap** to discover attractions, accommodations, and dining.
- 🔍 **Destination Explorer**: Browse curated destinations worldwide with summaries from Wikipedia and live weather from Open-Meteo.
- 💱 **Live Currency Converter**: Real-time exchange rate calculations and pair conversions with built-in public rate fallbacks.
- 🌤️ **Live Weather Forecasts**: Real-time temperatures and conditions for any destination.
- 👤 **Trip Management & Travel Profile**: Save custom itineraries, manage saved places, and track travel stats locally.
- 🔑 **Built-in API Settings Manager**: In-app UI modal to manage and test Groq, Tavily, and ExchangeRate API keys with instant connection feedback.

---

## 🛠️ Tech Stack

### Frontend Core
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Routing**: [React Router v7](https://reactrouter.com/)

### Direct Client Integrations & APIs
- **AI Inference**: [Groq Cloud API](https://console.groq.com/) (`llama-3.3-70b-versatile`)
- **Web Search**: [Tavily Search API](https://tavily.com/)
- **Currency Data**: [ExchangeRate-API](https://www.exchangerate-api.com/) & [open.er-api.com](https://open.er-api.com/)
- **Weather Data**: [Open-Meteo](https://open-meteo.com/) (No key required)
- **Map & POI Data**: [OpenStreetMap](https://www.openstreetmap.org/) & [Overpass API](https://overpass-api.de/) (No key required)
- **Place Descriptions**: [Wikipedia REST API](https://en.wikipedia.org/) (No key required)

---

## 📁 Project Structure

```text
tripVerse/
├── src/
│   ├── components/
│   │   ├── ApiSettingsModal.tsx # In-app UI for local API key management & testing
│   │   ├── Navbar.tsx           # Global navigation with API key status trigger
│   │   └── Footer.tsx           # Global footer
│   ├── lib/
│   │   ├── apiKeyStorage.ts     # Safe client-side localStorage API key manager
│   │   ├── services.ts          # Direct browser API client services & fallbacks
│   │   ├── context.tsx          # React Context state management
│   │   └── utils.ts             # Styling & utility helpers
│   ├── pages/
│   │   ├── Home.tsx             # Landing hero & featured destinations
│   │   ├── Explore.tsx          # Dynamic destination explorer
│   │   ├── Destinations.tsx     # Destination details & attraction maps
│   │   ├── Planner.tsx          # AI trip & itinerary planner
│   │   ├── Assistant.tsx        # AI travel chat assistant
│   │   ├── Profile.tsx          # User profile & API security settings
│   │   └── Login.tsx            # Guest / user session
│   ├── App.tsx                  # Main router & layout
│   ├── main.tsx                 # React entry point
│   └── index.css                # Global styling & Tailwind CSS imports
├── .env.example                 # Optional environment template
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`, `pnpm`, or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/Suvesh108/tripVerse.git
cd tripVerse
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🔑 Configuring Your Free API Keys

You can configure your API keys in two ways:

### Option A: Directly in the Web UI (Recommended)
1. Click the **"Set API Key"** / **"API Ready"** button in the top navigation bar (or visit **Profile** > **API Keys**).
2. Enter your keys:
   - **Groq AI Key** (Required for AI planning/chat): Get free key at [console.groq.com/keys](https://console.groq.com/keys)
   - **Tavily Search Key** (Optional web enrichment): Get free key at [tavily.com](https://tavily.com/)
   - **ExchangeRate Key** (Optional): Get free key at [exchangerate-api.com](https://www.exchangerate-api.com/)
3. Click **Test** to verify connection.
4. Click **Save Keys to Browser**.

### Option B: Via `.env` File (Optional for Local Dev)
Copy `.env.example` to `.env` and insert your keys:
```env
VITE_GROQ_API_KEY=gsk_your_groq_key_here
VITE_TAVILY_API_KEY=tvly_your_tavily_key_here
VITE_EXCHANGERATE_API_KEY=your_exchange_key_here
```

---

## 📜 Available Scripts

- `npm run dev` — Starts the Vite development server.
- `npm run build` — Builds the production bundle in `dist/`.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Validates TypeScript types across the codebase.

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).
