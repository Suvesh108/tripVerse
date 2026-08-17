/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './lib/context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Code-split route pages for light initial payload and instant loads
const Home = lazy(() => import('./pages/Home'));
const Explore = lazy(() => import('./pages/Explore'));
const Destinations = lazy(() => import('./pages/Destinations'));
const Planner = lazy(() => import('./pages/Planner'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading TripVerse...</span>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/destinations/:id?" element={<Destinations />} />
                <Route path="/planner" element={<Planner />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}
