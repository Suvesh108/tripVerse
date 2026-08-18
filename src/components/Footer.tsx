import { Globe, Github, Sparkles, MapPin, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full rounded-t-[3rem] mt-20 bg-slate-900 text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-8 md:px-14 py-16 max-w-screen-2xl mx-auto font-headline text-sm">
        {/* Project info */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="TripVerse Logo" className="w-8 h-8 rounded-xl shadow-md" />
            <span className="text-2xl font-bold tracking-tight">TripVerse</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            A 100% free, open-source AI travel discovery and itinerary planning platform. Built for global explorers with zero ads, zero trackers, and complete client-side privacy.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://github.com/Suvesh108/tripVerse"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 text-xs font-bold"
            >
              <Github className="w-4 h-4" />
              GitHub Repo
            </a>
          </div>
        </div>

        {/* Explore Links */}
        <div>
          <h4 className="font-bold mb-4 text-white uppercase tracking-widest text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Explore Tools
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link to="/explore" className="hover:text-primary transition-colors">Destination Explorer</Link></li>
            <li><Link to="/planner" className="hover:text-primary transition-colors">AI Trip & Itinerary Planner</Link></li>
            <li><Link to="/assistant" className="hover:text-primary transition-colors">AI Travel Concierge</Link></li>
            <li><Link to="/destinations" className="hover:text-primary transition-colors">Interactive Places Map</Link></li>
            <li><Link to="/profile" className="hover:text-primary transition-colors">Saved Trips & Profile</Link></li>
          </ul>
        </div>

        {/* Open Source & APIs */}
        <div>
          <h4 className="font-bold mb-4 text-white uppercase tracking-widest text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Open Integrations
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><a href="https://console.groq.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Groq Cloud AI (Llama 3.3)</a></li>
            <li><a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">OpenStreetMap & Overpass API</a></li>
            <li><a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Open-Meteo Live Forecasts</a></li>
            <li><a href="https://en.wikipedia.org/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Wikipedia REST API</a></li>
            <li><a href="https://open.er-api.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">ExchangeRate API</a></li>
          </ul>
        </div>

        {/* Community & Privacy */}
        <div>
          <h4 className="font-bold mb-4 text-white uppercase tracking-widest text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Open Source Promise
          </h4>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            TripVerse is non-commercial community software licensed under Apache-2.0. All API keys remain strictly in your browser storage.
          </p>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[11px] text-slate-300">
            <span className="text-emerald-400 font-bold block mb-1">🌿 Free & Community Driven</span>
            Fork, contribute, or self-host your own instance freely on GitHub.
          </div>
        </div>
      </div>

      <div className="px-8 md:px-14 py-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs max-w-screen-2xl mx-auto">
        <p>© 2026 TripVerse • Licensed under Apache 2.0 • 100% Free & Open Source</p>
        <p className="flex items-center gap-1">
          Made for travelers with open data & AI
        </p>
      </div>
    </footer>
  );
}
