import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // The password for development access
  const CORRECT_PASSWORD = 'Zenica2007';

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem('fnt_dev_auth');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem('fnt_dev_auth', 'authenticated');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-fnt-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red"></div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-fnt-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/fnt-logo.png" 
              alt="FNT Motor Group" 
              className="h-20 w-auto mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold text-white mb-2">
              Development Preview
            </h1>
            <p className="text-gray-400">
              This site is currently in development
            </p>
          </div>

          {/* Password Form */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-fnt-red/20 p-4 rounded-full">
                <Lock className="w-8 h-8 text-fnt-red" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fnt-red focus:border-transparent transition-all"
                  placeholder="Enter development password"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠</span>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-fnt-red hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-fnt-red focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Access Site
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                This password protection is temporary and will be removed when the site launches to customers.
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-gray-600 text-sm mt-8">
            FNT Motor Group © {new Date().getFullYear()} • All Rights Reserved
          </p>
        </div>
      </div>
    );
  }

  // Show the actual app if authenticated
  return <>{children}</>;
};

export default PasswordGate;
