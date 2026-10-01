import React from 'react';
import { Link } from 'react-router-dom';
import { CarProfile } from '@phosphor-icons/react';
import { usePageMeta } from '../hooks/usePageMeta';
import { NOT_FOUND_META } from '../lib/seo';
import { BUSINESS } from '../config/business';

/**
 * Rendered for any URL that doesn't match a route. Netlify serves 404.html
 * (real 404 status) for these paths, which boots the app and lands here, so
 * unknown URLs no longer masquerade as a second copy of the homepage.
 */
const NotFound: React.FC = () => {
  usePageMeta({
    title: NOT_FOUND_META.title,
    description: NOT_FOUND_META.description,
    noindex: true,
  });

  return (
    <div className="min-h-screen glass-scene grain flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 text-center max-w-lg w-full">
        <CarProfile className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-sm font-semibold tracking-widest text-fnt-red mb-2">404</p>
        <h1 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
          Page not found
        </h1>
        <p className="text-gray-400 mb-8">
          That page doesn't exist or has moved. Browse our current stock or get in touch and we'll help you find the right car.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-glass-red text-white px-6 py-3 rounded-xl font-semibold">
            Browse used cars
          </Link>
          <a href={BUSINESS.phone.href} className="btn-glass text-white px-6 py-3 rounded-xl font-semibold">
            Call {BUSINESS.phone.display}
          </a>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          <Link to="/warranty-financing" className="hover:text-fnt-red transition-colors">Warranty &amp; finance</Link>
          {' · '}
          <Link to="/terms-conditions" className="hover:text-fnt-red transition-colors">Terms</Link>
          {' · '}
          <Link to="/privacy-policy" className="hover:text-fnt-red transition-colors">Privacy</Link>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
