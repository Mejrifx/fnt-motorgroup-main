import React, { useState } from 'react';
import Hero from './components/Hero';
import WhatWouldYouLikeToDo from './components/WhatWouldYouLikeToDo';
import FeaturedCars from './components/FeaturedCars';
import Services from './components/Services';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
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
}

export default App;