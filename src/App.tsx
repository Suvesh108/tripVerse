/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './lib/context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Destinations from './pages/Destinations';
import Planner from './pages/Planner';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Login from './pages/Login';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/destinations/:id?" element={<Destinations />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AppProvider>
  );
}
