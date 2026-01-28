import React, { useState } from 'react';
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
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import PasswordGate from './components/PasswordGate';

// Main Site Component
const MainSite = () => {
  const [searchFilters, setSearchFilters] = useState(null);

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
  };

  return (
    <div className="min-h-screen">
      <Hero onFilterChange={handleFilterChange} />
      <WhatWouldYouLikeToDo />
      <FeaturedCars searchFilters={searchFilters} />
      <Services />
      <About />
      <Reviews />
      <Contact />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <PasswordGate>
      <Router>
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/warranty-financing" element={<WarrantyFinancing />} />
          <Route path="/terms-conditions" element={<TermsAndConditions />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<MainSite />} />
        </Routes>
      </Router>
    </PasswordGate>
  );
}

export default App;