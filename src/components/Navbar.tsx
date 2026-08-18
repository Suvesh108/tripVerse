import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X, Key, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../lib/context';
import { getGroqApiKey } from '../lib/apiKeyStorage';
import ApiSettingsModal from './ApiSettingsModal';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { actions } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  const checkApiKey = () => {
    setHasApiKey(Boolean(getGroqApiKey()));
  };

  useEffect(() => {
    checkApiKey();
    window.addEventListener('tripverse_keys_updated', checkApiKey);
    return () => window.removeEventListener('tripverse_keys_updated', checkApiKey);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Planner', path: '/planner' },
    { name: 'Destinations', path: '/destinations' },
    { name: 'AI Assistant', path: '/assistant' },
  ];

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      actions.searchDestinations(searchQuery);
      navigate(`/destinations/${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-menu') && !target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="fixed top-0 w-full z-40 glass-panel border-none shadow-premium">
      <div className="flex justify-between items-center px-6 md:px-12 py-5 max-w-screen-2xl mx-auto font-headline">
        <Link to="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-gradient flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="TripVerse Logo" className="w-8 h-8 rounded-xl shadow-md group-hover:scale-105 transition-transform" />
          <span>TripVerse</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "text-sm font-bold transition-all hover:text-primary relative group",
                location.pathname === link.path 
                  ? "text-primary" 
                  : "text-on-surface-variant"
              )}
            >
              {link.name}
              <span className={cn(
                "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                location.pathname === link.path ? "w-full" : "w-0 group-hover:w-1/2"
              )} />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block group">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search horizons..."
                className="bg-slate-100 border-none rounded-full px-6 py-2 w-56 xl:w-64 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-4 top-2.5 text-slate-400 w-4 h-4" />
            </form>
          </div>

          {/* Missing API Key Warning Pill (only when unset) */}
          {!hasApiKey && (
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-700 hover:bg-amber-500/25 rounded-full text-xs font-bold transition-all animate-pulse cursor-pointer"
              title="API key missing - click to configure"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Configure API</span>
            </button>
          )}

          {/* Profile Icon Button on the Right */}
          <button 
            onClick={handleProfileClick}
            className={cn(
              "p-2.5 rounded-full transition-all hidden sm:flex items-center justify-center relative border cursor-pointer",
              location.pathname === '/profile'
                ? "bg-primary text-white border-primary shadow-md"
                : "text-slate-600 hover:text-primary hover:bg-slate-100 border-slate-200"
            )}
            title="Profile & API Key Settings"
            aria-label="Profile and Settings"
          >
            <User className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors menu-button cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100 overflow-hidden mobile-menu"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "text-lg font-medium py-2 transition-colors",
                    location.pathname === link.path ? "text-primary font-bold" : "text-slate-600"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                {!hasApiKey && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsApiModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 bg-amber-500/15 border border-amber-500/40 text-amber-800 rounded-xl text-xs font-bold flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Configure Groq API Key
                    </span>
                    <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">Action Needed</span>
                  </button>
                )}
                
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-between transition-colors",
                    location.pathname === '/profile'
                      ? "bg-primary text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4" />
                    Profile & API Key Settings
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ApiSettingsModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </nav>
  );
}
