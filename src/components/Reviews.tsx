import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
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
            className={`w-5 h-5 ${
              index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading reviews...</p>
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
    <section className="py-20" style={{ backgroundColor: '#171819' }}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            What Our <span className="text-fnt-red">Customers</span> Say
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Don't just take our word for it - hear from our satisfied customers
          </p>
          
          {/* Rating Summary */}
          <div className="flex items-center justify-center space-x-4 bg-white rounded-2xl shadow-lg p-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-fnt-black mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">{renderStars(5)}</div>
              <div className="text-sm text-gray-600">Based on {reviews.length}+ reviews</div>
            </div>
          </div>
        </div>

        {/* Review Carousel */}
        <div className="max-w-5xl mx-auto">
          <div
            className="relative bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Quote Icon */}
            <div className="absolute top-8 left-8 opacity-10">
              <Quote className="w-24 h-24 text-fnt-red" />
            </div>

            {/* Review Content */}
            <div className="relative z-10">
              {/* Reviewed on Feefo */}
              <div className="flex flex-col items-center mb-4">
                <p className="text-xs text-gray-500 mb-2">Reviewed on</p>
                <img 
                  src="/feefo image.png" 
                  alt="Feefo" 
                  className="h-6 w-auto"
                />
              </div>

              {/* Stars */}
              <div className="flex justify-center mb-6">
                {renderStars(reviews[currentReview].rating)}
              </div>

              {/* Review Text */}
              <blockquote className="text-center mb-8">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed italic mb-6">
                  "{reviews[currentReview].review_text}"
                </p>
                
                {/* Reviewer Info */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-fnt-red to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                    {reviews[currentReview].customer_name.charAt(0)}
                  </div>
                  <div className="font-bold text-fnt-black text-lg">
                    {reviews[currentReview].customer_name}
                  </div>
                  {reviews[currentReview].vehicle_purchased && (
                    <div className="text-gray-500 text-sm mb-1">
                      Purchased: {reviews[currentReview].vehicle_purchased}
                    </div>
                  )}
                  <div className="text-gray-400 text-sm">
                    {reviews[currentReview].review_date}
                  </div>
                </div>
              </blockquote>

              {/* Navigation Arrows */}
              {reviews.length > 1 && (
                <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                  <button
                    onClick={previousReview}
                    className="p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-fnt-red hover:text-white transition-all duration-300 group"
                    aria-label="Previous review"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex space-x-1 sm:space-x-2 max-w-full overflow-hidden">
                    {reviews.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentReview(index)}
                        className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                          index === currentReview
                            ? 'bg-fnt-red w-6 sm:w-8'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`Go to review ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextReview}
                    className="p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-fnt-red hover:text-white transition-all duration-300 group"
                    aria-label="Next review"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl font-bold text-fnt-red mb-2">1000+</div>
              <div className="text-gray-600 font-medium">Happy Customers</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl font-bold text-fnt-red mb-2">{averageRating.toFixed(1)}</div>
              <div className="text-gray-600 font-medium">Average Rating</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl font-bold text-fnt-red mb-2">100%</div>
              <div className="text-gray-600 font-medium">Satisfaction Guarantee</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <a
              href="tel:07735770031"
              className="inline-flex items-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span>Experience the FNT Difference</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;

