import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import NotFound from './components/NotFound';
import { ToastProvider } from './components/ui/ToastContainer';
import { useRevealObserver } from './hooks/useRevealObserver';
import { usePageMeta } from './hooks/usePageMeta';
import { STATIC_PAGES } from './lib/seo';

// Admin routes are only ever used by staff, not the public/SEO-facing site.
// Loading them lazily keeps pdf-lib and the whole admin UI out of the
// bundle that every visitor browsing cars has to download and parse.
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));

/**
 * Site navigation uses real anchors (/#inventory, /#contact …) so crawlers can
 * follow them. After a client-side route change React Router doesn't scroll to
 * the hash itself, so do it here once the target section exists.
 */
const ScrollToHash = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const timers: number[] = [];
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        // Sections above (reviews, stock) load asynchronously and push the
        // target down after the first scroll; re-align briefly while the
        // layout settles, unless the user has already scrolled away.
        [600, 1400].forEach((delay) =>
          timers.push(
            window.setTimeout(() => {
              if (!userScrolled && Math.abs(el.getBoundingClientRect().top) > 40) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }, delay)
          )
        );
      } else if (attempts++ < 20) {
        timers.push(window.setTimeout(tryScroll, 100));
      }
    };
    let userScrolled = false;
    const markScrolled = () => {
      userScrolled = true;
    };
    window.addEventListener('wheel', markScrolled, { passive: true, once: true });
    window.addEventListener('touchstart', markScrolled, { passive: true, once: true });
    tryScroll();
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('wheel', markScrolled);
      window.removeEventListener('touchstart', markScrolled);
    };
  }, [pathname, hash]);
  return null;
};

const AdminLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0b0c0f]">
    <div className="w-8 h-8 border-2 border-white/20 border-t-fnt-red rounded-full animate-spin" />
  </div>
);

// Main Site Component
const MainSite = () => {
  const [searchFilters, setSearchFilters] = useState(null);

  usePageMeta(STATIC_PAGES['/']);

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
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/warranty-financing" element={<WarrantyFinancing />} />
          <Route path="/terms-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/admin/login" element={<Suspense fallback={<AdminLoading />}><AdminLogin /></Suspense>} />
          <Route path="/admin/dashboard" element={<Suspense fallback={<AdminLoading />}><AdminDashboard /></Suspense>} />
          {/* Unknown URLs: Netlify already answered with 404.html (404 status);
              this renders the matching UI instead of a duplicate homepage. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;