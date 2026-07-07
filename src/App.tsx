import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import WhatWouldYouLikeToDo from './components/WhatWouldYouLikeToDo';
import FeaturedCars from './components/FeaturedCars';
import Services from './components/Services';
import About from './components/About';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CarDetails from './components/CarDetails';
import WarrantyFinancing from './components/WarrantyFinancing';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookiePolicy from './components/CookiePolicy';
import { ToastProvider } from './components/ui/ToastContainer';
import { useRevealObserver } from './hooks/useRevealObserver';
import { usePageMeta } from './hooks/usePageMeta';

// Admin routes are only ever used by staff, not the public/SEO-facing site.
// Loading them lazily keeps pdf-lib and the whole admin UI out of the
// bundle that every visitor browsing cars has to download and parse.
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

const AdminLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0b0c0f]">
    <div className="w-8 h-8 border-2 border-white/20 border-t-fnt-red rounded-full animate-spin" />
  </div>
);

// Main Site Component
const MainSite = () => {
  const [searchFilters, setSearchFilters] = useState(null);

  usePageMeta({
    title: 'Used Cars for Sale in Manchester',
    description: 'Browse quality used cars for sale at FNT Motor Group in Manchester. Trusted dealer with 6-month warranty, flexible finance and 1,000+ happy customers. Visit our showroom or shop online today.',
    path: '/',
  });

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
  };

  return (
    <div className="min-h-screen">
      <Hero onFilterChange={handleFilterChange} />
      {/* One continuous ambient background canvas behind every dark section,
          so the glow reads as a single scene instead of resetting at each
          section boundary — without resorting to background-attachment:fixed,
          which is very expensive to scroll past all the backdrop-filter glass
          panels these sections contain. */}
      <div className="glass-scene">
        <WhatWouldYouLikeToDo />
        <Reviews />
        <FeaturedCars searchFilters={searchFilters} />
        <Services />
        <About />
        <Contact />
      </div>
      <Footer />
    </div>
  );
};

function App() {
  useRevealObserver();
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/warranty-financing" element={<WarrantyFinancing />} />
          <Route path="/terms-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/admin/login" element={<Suspense fallback={<AdminLoading />}><AdminLogin /></Suspense>} />
          <Route path="/admin/dashboard" element={<Suspense fallback={<AdminLoading />}><AdminDashboard /></Suspense>} />
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<MainSite />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;