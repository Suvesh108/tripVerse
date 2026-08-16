import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../lib/context';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Destinations', path: '/destinations' },
    { name: 'Planner', path: '/planner' },
    { name: 'AI Assistant', path: '/assistant' },
    { name: 'Profile', path: '/profile' },
  ];

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Optional: keep the explore page results updated
      actions.searchDestinations(searchQuery);
      // Directly navigate to the Destinations page to show the specific location and map
      navigate(`/destinations/${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    actions.logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (state.user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
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
    <nav className="fixed top-0 w-full z-50 glass-panel border-none shadow-premium">
      <div className="flex justify-between items-center px-6 md:px-12 py-5 max-w-screen-2xl mx-auto font-headline">
        <Link to="/" className="text-2xl md:text-3xl font-bold tracking-tighter text-gradient flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-xs">TV</span>
          </div>
          TripVerse
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

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden lg:block group">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search horizons..."
                className="bg-slate-100 border-none rounded-full px-6 py-2 w-64 focus:ring-2 focus:ring-primary-container transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-4 top-2.5 text-slate-400 w-4 h-4" />
            </form>
          </div>
          
          <button 
            onClick={handleProfileClick}
            className="p-2 text-slate-500 hover:text-primary transition-colors hidden sm:block relative group"
          >
            <User className="w-5 h-5" />
            {state.user && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </button>
          
          {!state.user && (
            <Link 
              to="/login" 
              className="btn-primary hidden sm:block"
            >
              Sign In
            </Link>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors menu-button"
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
              
              <div className="pt-4 border-t border-slate-50 flex flex-col gap-4">
                {state.user ? (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{state.user.name}</p>
                        <p className="text-sm text-slate-500">{state.user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full py-3 text-left px-4 text-slate-600 hover:text-red-600 transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full py-3 btn-primary text-center"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
