# 🌍 TripVerse — AI-Powered Travel Planning & Discovery Platform

TripVerse is an intelligent, modern travel companion and itinerary planning platform. Powered by AI and interactive mapping, TripVerse helps travelers discover dream destinations, generate day-by-day itineraries, chat with an AI travel assistant, explore interactive maps, convert currencies in real-time, and check live weather forecasts.

---

## ✨ Features

- 🤖 **AI-Powered Travel Planner**: Generate customized, multi-day trip itineraries based on destination, budget, travel style, and duration.
- 💬 **AI Travel Assistant**: Conversational travel assistant for instant recommendations, packing tips, cultural guides, and local cuisine suggestions.
- 🗺️ **Interactive Maps & Geolocation**: Interactive map view powered by **Leaflet** & **OpenStreetMap** to discover attractions, landmarks, and accommodations.
- 🔍 **Destination Explorer**: Browse curated and trending destinations worldwide with detailed guides, highlights, and travel insights.
- 💱 **Live Currency Converter**: Real-time exchange rate calculations and pair conversions across international currencies.
- 🌤️ **Real-Time Weather Forecasts**: Up-to-date weather data and forecasts for your travel destinations via Open-Meteo.
- 👤 **Trip Management & User Profile**: Save favorite destinations, manage custom itineraries, and view trip history.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Routing**: [React Router v7](https://reactrouter.com/)

### Backend (Proxy Server)
- **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Security & Middleware**: CORS, Morgan, Dotenv

### External APIs & Integrations
- **AI Engine**: [Groq AI](https://console.groq.com/) (Ultra-fast LLM inference)
- **Web Search**: [Tavily Search API](https://tavily.com/)
- **Currency Data**: [ExchangeRate-API](https://www.exchangerate-api.com/)
- **Weather Data**: [Open-Meteo](https://open-meteo.com/)
- **Map Tiles & Data**: [OpenStreetMap](https://www.openstreetmap.org/) & [Overpass API](https://overpass-api.de/)

---

## 📁 Project Structure

```text
tripVerse/
├── public/                # Static public assets
├── server/                # Express backend API & secure proxy
│   ├── index.js           # Server routes (AI proxy, Tavily search, Exchange rates)
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Backend environment variables template
├── src/
│   ├── components/        # Reusable UI components (Navbar, Footer, etc.)
│   ├── lib/               # Context providers, services & utility functions
│   ├── pages/             # Page components
│   │   ├── Home.tsx       # Landing page & hero section
│   │   ├── Explore.tsx    # Destination discovery page
│   │   ├── Destinations.tsx # Destination details & attraction maps
│   │   ├── Planner.tsx    # AI trip & itinerary planner
│   │   ├── Assistant.tsx  # AI travel chat assistant
│   │   ├── Profile.tsx    # User profile & saved trips
│   │   └── Login.tsx      # Authentication / login page
│   ├── App.tsx            # Main app router & layout
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styling & Tailwind CSS imports
├── .env.example           # Client environment template
├── package.json           # Frontend dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `yarn` / `pnpm`

### 1. Clone the Repository
```bash
git clone https://github.com/Suvesh108/tripVerse.git
cd tripVerse
```

### 2. Frontend Setup
1. Install client dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your credentials:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_TAVILY_API_KEY=your_tavily_api_key_here
   VITE_EXCHANGERATE_API_KEY=your_exchangerate_api_key_here
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 3. Backend Proxy Setup (Optional / Recommended for secure API proxying)
1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install server dependencies:
   ```bash
   npm install
   ```

3. Configure server environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your `GROQ_API_KEY`, `TAVILY_API_KEY`, and `EXCHANGERATE_API_KEY`.

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend proxy will run on `http://localhost:3000`.

---

## 📜 Available Scripts

### Frontend
- `npm run dev` — Starts the Vite dev server.
- `npm run build` — Builds the application for production.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs TypeScript type checks.

### Backend
- `npm run dev` — Runs the Express proxy with `nodemon` auto-reload.
- `npm run start` — Runs the Express server in production mode.

---

## 🔑 Environment Variables Reference

| Variable | Description | Required |
| :--- | :--- | :--- |
| `VITE_GROQ_API_KEY` | Groq Cloud API Key for AI generation & chat | Yes |
| `VITE_TAVILY_API_KEY` | Tavily API Key for enriched search | Optional |
| `VITE_EXCHANGERATE_API_KEY` | ExchangeRate-API Key for currency conversions | Optional |
| `VITE_API_BASE_URL` | Backend server URL (`http://localhost:3000/api`) | Optional |

---

## 📄 License

This project is licensed under the [Apache-2.0 License](LICENSE).
