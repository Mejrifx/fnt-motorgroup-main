import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import fntLogo from '../../assets/fnt-logo.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    console.log('AdminLogin - checking user status:', { user, loading });
    if (!loading && user) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', email);
      const { data, error } = await signIn(email, password);
      
      console.log('Login response:', { data, error });
      
      if (error) {
        console.error('Login error:', error);
        setError(`Login failed: ${error.message}`);
        return;
      }

      if (data.user) {
        console.log('Login successful, navigating to dashboard');
        // Use replace to avoid history issues
        navigate('/admin/dashboard', { replace: true });
        // Backup navigation method
        setTimeout(() => {
          if (window.location.pathname !== '/admin/dashboard') {
            window.location.href = '/admin/dashboard';
          }
        }, 500);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fnt-black via-gray-900 to-fnt-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fnt-black via-gray-900 to-fnt-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={fntLogo} 
            alt="FNT Motor Group" 
            className="h-64 sm:h-80 lg:h-96 w-auto mx-auto mb-6 drop-shadow-2xl"
          />
          <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Portal
          </h1>
          <p className="text-gray-400">Employee access only</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="admin@fntmotorgroup.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fnt-red focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-fnt-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {loginLoading ? 'Signing in...' : 'Access Dashboard'}
            </button>
          </form>

          {/* Back to Site */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white text-sm transition-colors duration-300"
            >
              ← Back to main site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
