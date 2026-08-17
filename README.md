# 🌍 TripVerse — Next-Gen AI Travel Architect & Route Platform

TripVerse is an intelligent, high-efficiency travel planning and interactive routing platform built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Leaflet**.

TripVerse runs 100% on the frontend with a **Client-Side "Bring Your Own Key" (BYOK) Architecture**. Users can enter their own free API keys directly in the frontend settings, allowing personalized, unconstrained travel planning without intermediate servers, rate limits, or shared quotas.

---

## 🔒 Privacy & Security Architecture

- 🛡️ **100% Client-Side Storage**: All API keys are saved exclusively in your browser's local `localStorage`.
- 🚫 **Zero Backend Proxying**: Keys are never transmitted to any server or third-party proxy.
- 🌐 **Direct Provider Communication**: Network requests go straight from your browser to official HTTPS endpoints (`api.groq.com`, `api.tavily.com`, `v6.exchangerate-api.com`, `open-meteo.com`, `openstreetmap.org`, `wikipedia.org`).
- ⚡ **Instant Key Controls**: Test, update, mask, or wipe your keys from browser storage at any time with a single click.

---

## ✨ Core Features

### 1. 🤖 Chained $< 5\text{ km}$ Hop-by-Hop AI Itinerary Architect
- **Tight Geographic Clustering**: Plans daily itineraries where consecutive stops are within a **$\le$ 5 km radius** of the previous spot ($\text{Stop 1} \xrightarrow{<5\text{km}} \text{Stop 2} \xrightarrow{<5\text{km}} \text{Stop 3}$) to eliminate transit fatigue.
- **Zero Place Duplication**: Enforces 100% unique attractions, monuments, viewpoints, and dining across every day of the journey.
- **Customizable Stops Per Day**: Toggle between `2`, `3`, or `4` stops per day with 1-click re-generation.
- **Live Distance Badges**: Displays precise Haversine distance and proximity status between every waypoint.
- **Circular Percentage Progress Meter**: Sleek frosted-glass SVG loader tracking real-time itinerary synthesis (`0%` $\rightarrow$ `100%`).

### 2. 💬 Live AI Itinerary Adjuster & Concierge
- Built-in chat inside the Planner to modify trips in real-time.
- Tell the assistant if you only visited 1 place due to delays or weather—the AI will automatically reschedule remaining spots to subsequent days without dropping them.
- Request nearby additions under 3–5 km, swap activities, or reduce daily pace dynamically.

### 3. 🗺️ Full-Screen Routing Engine & Interactive Destinations Map
- **Global Overview by Default**: Starts in a clean, zoomed-out world map showcasing global destinations and user planned trips.
- **Day-by-Day Filter Tabs**: Switch between `All Days` or isolate `Day 1`, `Day 2`, `Day 3` to trace clustered daily polylines.
- **1-Click Multi-Stop Map Export**: Launch your sequenced route directly in **Google Maps** or **Apple Maps** with turn-by-turn waypoints.
- **Direct Itinerary Integration**: Any trip created in the Planner automatically synchronizes with the Destinations route map.

### 4. 🧠 Natural Language AI Destination & Location Discovery
- Search using thematic prompts (e.g. *"Peaceful hill stations with tea plantations in South India"*, *"Historic castles in Europe"*, *"Best coastal surfing spots in Portugal"*).
- AI analyzes the prompt and returns matching destinations with coordinates, descriptions, and photo previews.

### 5. 💱 Real-time Currency Converter & 🌤️ Live Weather
- Instant multi-currency conversion with automatic public rate fallbacks.
- Live weather forecasts powered by Open-Meteo.

---

## 🛠️ Tech Stack

### Frontend Core
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps & Routing**: [Leaflet](https://leafletjs.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)

### Direct Client Integrations & APIs
- **AI Engine**: [Groq Cloud API](https://console.groq.com/) (`llama-3.3-70b-versatile` with JSON schema output)
- **Live Web Enrichment**: [Tavily Search API](https://tavily.com/)
- **Currency Data**: [ExchangeRate-API](https://www.exchangerate-api.com/) & [open.er-api.com](https://open.er-api.com/)
- **Live Weather**: [Open-Meteo](https://open-meteo.com/) *(No key required)*
- **Geocoding & POIs**: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) & [Overpass API](https://overpass-api.de/) *(No key required)*
- **Descriptions & Media**: [Wikipedia REST API](https://en.wikipedia.org/) *(No key required)*

---

## 📁 Project Structure

```text
tripVerse/
├── src/
│   ├── components/
│   │   ├── ApiSettingsModal.tsx # In-app UI for local API key management & testing
│   │   ├── Navbar.tsx           # Global navigation with active trip & key status
│   │   └── Footer.tsx           # Global footer
│   ├── lib/
│   │   ├── apiKeyStorage.ts     # Safe client-side localStorage API key manager
│   │   ├── services.ts          # AI planner, route calculators, API clients & fallbacks
│   │   ├── context.tsx          # Application state & trip store
│   │   └── utils.ts             # Tailwind class merging & styling helpers
│   ├── pages/
│   │   ├── Home.tsx             # Hero search with live destination preview
│   │   ├── Explore.tsx          # AI destination explorer & 1-click trip planner
│   │   ├── Planner.tsx          # AI trip itinerary, <5km chaining & live AI chat
│   │   ├── Destinations.tsx     # Full-screen routing engine & Google/Apple Maps export
│   │   ├── Assistant.tsx        # Standalone AI travel concierge
│   │   └── Profile.tsx          # Saved trips, places & API settings
│   ├── App.tsx                  # Router & navigation configuration
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind CSS v4 & custom design tokens
├── vercel.json                  # Vercel SPA deployment rewrites
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite build configuration
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

### 3. Start Development Server
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
   - **Groq AI Key** *(Required for AI planning/chat)*: Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
   - **Tavily Search Key** *(Optional web search)*: Get a free key at [tavily.com](https://tavily.com/)
   - **ExchangeRate Key** *(Optional)*: Get a free key at [exchangerate-api.com](https://www.exchangerate-api.com/)
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

## ☁️ Deploying to Vercel

TripVerse is 100% static & SPA ready:

1. Push your code to your GitHub repository.
2. Import the repository in [Vercel](https://vercel.com/).
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy! (`vercel.json` already handles all client-side SPA routing).

---

## 📜 Available Scripts

- `npm run dev` — Starts the Vite development server.
- `npm run build` — Builds the optimized production bundle in `dist/`.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Validates TypeScript types across the codebase.

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).
