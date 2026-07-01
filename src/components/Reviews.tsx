import React, { useState, useEffect } from 'react';
import { Star, Quotes, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { supabase, type Review } from '../lib/supabase';

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentReview, setCurrentReview] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch reviews from Supabase
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setReviews(data);
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (!isPaused && reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentReview((prev) => (prev + 1) % reviews.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPaused, reviews.length]);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const previousReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={20}
            weight="fill"
            className={index < rating ? 'text-amber-400' : 'text-white/15'}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-20 glass-scene grain">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="glass rounded-3xl p-8 md:p-12 animate-pulse space-y-4">
              <div className="h-5 w-40 bg-white/10 rounded-full mx-auto"></div>
              <div className="h-4 w-full bg-white/5 rounded-full"></div>
              <div className="h-4 w-5/6 bg-white/5 rounded-full mx-auto"></div>
              <div className="h-12 w-12 bg-white/10 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show section if no reviews
  }

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  return (
    <section id="reviews" className="py-24 glass-scene grain">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <h2 className="section-title text-5xl md:text-7xl text-white mb-6">
            What our <span className="text-fnt-red">customers</span> say
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Don't just take our word for it - hear from our satisfied customers
          </p>
          
          {/* Rating Summary */}
          <div className="flex items-center justify-center space-x-4 glass rounded-3xl p-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">{renderStars(5)}</div>
              <div className="text-sm text-gray-400 mb-3">Based on {reviews.length}+ reviews</div>
              <div className="inline-block bg-white rounded-lg px-3 py-1.5">
                <img 
                  src="/autotrader-logo.jpg" 
                  alt="AutoTrader" 
                  className="h-8 w-auto mx-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Review Carousel */}
        <div className="max-w-5xl mx-auto">
          <div
            className="relative glass rounded-3xl p-8 md:p-12 reveal"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Quote Icon */}
            <div className="absolute top-8 left-8 opacity-10">
              <Quotes size={96} weight="fill" className="text-fnt-red" />
            </div>

            {/* Review Content */}
            <div className="relative z-10">
              {/* Reviewed on Feefo */}
              <div className="flex flex-col items-center mb-4">
                <div className="flex items-center justify-center w-full">
                  <p className="text-xs text-gray-500 mb-2" style={{ transform: 'translateX(-7px)' }}>Reviewed on</p>
                </div>
                <div className="bg-white rounded-md px-2 py-1">
                  <img 
                    src="/feefo%20image.png" 
                    alt="Feefo" 
                    className="h-6 w-auto"
                  />
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center mb-6">
                {renderStars(reviews[currentReview].rating)}
              </div>

              {/* Review Text */}
              <blockquote className="text-center mb-8">
                <div className="max-h-32 sm:max-h-40 overflow-y-auto px-2">
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed italic mb-6">
                    "{reviews[currentReview].review_text}"
                  </p>
                </div>
                
                {/* Reviewer Info */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 btn-glass-red rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                    {reviews[currentReview].customer_name.charAt(0)}
                  </div>
                  <div className="font-bold text-white text-lg">
                    {reviews[currentReview].customer_name}
                  </div>
                  {reviews[currentReview].vehicle_purchased && (
                    <div className="text-gray-400 text-sm mb-1">
                      Purchased: {reviews[currentReview].vehicle_purchased}
                    </div>
                  )}
                  <div className="text-gray-500 text-sm">
                    {reviews[currentReview].review_date}
                  </div>
                </div>
              </blockquote>

              {/* Navigation Arrows */}
              {reviews.length > 1 && (
                <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                  <button
                    onClick={previousReview}
                    className="p-2 sm:p-3 rounded-full glass-chip text-white hover:text-fnt-red transition-all duration-300 group"
                    aria-label="Previous review"
                  >
                    <CaretLeft size={22} weight="bold" />
                  </button>

                  {/* Position indicator: dots for small sets, counter for large */}
                  {reviews.length <= 8 ? (
                    <div className="flex space-x-1 sm:space-x-2 max-w-full overflow-hidden">
                      {reviews.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentReview(index)}
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                            index === currentReview
                              ? 'bg-fnt-red w-6 sm:w-8'
                              : 'bg-white/20 hover:bg-white/40'
                          }`}
                          aria-label={`Go to review ${index + 1}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 text-sm text-gray-400 font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {currentReview + 1} <span className="text-gray-600">/ {reviews.length}</span>
                    </div>
                  )}

                  <button
                    onClick={nextReview}
                    className="p-2 sm:p-3 rounded-full glass-chip text-white hover:text-fnt-red transition-all duration-300 group"
                    aria-label="Next review"
                  >
                    <CaretRight size={22} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trust stats: open row, no card chrome */}
          <div className="grid grid-cols-1 sm:grid-cols-3 mt-16 border-t hairline reveal">
            {[
              { value: '1000+', label: 'Happy Customers' },
              { value: averageRating.toFixed(1), label: 'Average Rating' },
              { value: '100%', label: 'Satisfaction Guarantee' },
            ].map((stat) => (
              <div key={stat.label} className="text-center py-10 sm:border-r hairline last:border-r-0">
                <div className="text-5xl md:text-6xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
                <div className="text-gray-500 font-medium text-sm uppercase" style={{ letterSpacing: '0.14em' }}>{stat.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Reviews;

