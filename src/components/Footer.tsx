import { Globe, Share2, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full rounded-t-[3rem] mt-20 bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-16 max-w-screen-2xl mx-auto font-headline text-sm bg-slate-100/50">
        <div className="space-y-6">
          <div className="text-xl font-bold text-slate-900">TripVerse</div>
          <p className="text-slate-500 leading-relaxed">
            Pioneering the next era of digital travel curation. Explore beyond borders, guided by intelligence.
          </p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
              <Globe className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-slate-900 uppercase tracking-widest text-xs">Discover</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Global Destinations</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Trip Planner</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">AI Concierge</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Premium Stays</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-slate-900 uppercase tracking-widest text-xs">Company</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Support</a></li>
            <li><a href="#" className="text-slate-500 hover:text-blue-500 transition-colors">Press Kit</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-slate-900 uppercase tracking-widest text-xs">Stay Inspired</h4>
          <p className="text-slate-500 mb-4">Join our horizon mailing list for early access to boutique openings.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email"
              className="bg-white border-none rounded-full px-4 py-2 flex-grow focus:ring-1 focus:ring-blue-400"
            />
            <button className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="px-12 py-8 border-t border-slate-200/50 text-center text-slate-400 text-xs">
        © 2024 TripVerse AI. Your Digital Horizon.
      </div>
    </footer>
  );
}
