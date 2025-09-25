import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import WhatWouldYouLikeToDo from './components/WhatWouldYouLikeToDo';
import FeaturedCars from './components/FeaturedCars';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';

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
      <Contact />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;