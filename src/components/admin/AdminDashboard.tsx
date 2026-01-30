import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, LogOut, Car, DollarSign, Calendar, Fuel, Star, MessageSquare, Home, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, type Car, type Review } from '../../lib/supabase';
import AddCarModal from './AddCarModal';
import EditCarModal from './EditCarModal';
import AddReviewModal from './AddReviewModal';
import EditReviewModal from './EditReviewModal';
import fntLogo from '../../assets/fnt-logo.png';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'cars' | 'reviews'>('cars');
  const [cars, setCars] = useState<Car[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // AutoTrader sync state
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [showSyncLogs, setShowSyncLogs] = useState(false);
  
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Helper function to format mileage
  const formatMileage = (mileage: string): string => {
    if (!mileage) return '';
    
    // If mileage already contains "miles" or "Miles", return as is
    if (mileage.toLowerCase().includes('miles')) {
      return mileage;
    }
    
    // If it's just a number, add "Miles"
    const numericMileage = mileage.replace(/[^\d]/g, '');
    if (numericMileage) {
      return `${numericMileage} Miles`;
    }
    
    return mileage;
  };

  useEffect(() => {
    console.log('AdminDashboard - checking auth:', { user, authLoading });
    
    // Don't redirect while auth is still loading
    if (authLoading) {
      console.log('AdminDashboard - auth still loading, waiting...');
      return;
    }
    
    // Only redirect if auth is complete and no user
    if (!authLoading && !user) {
      console.log('AdminDashboard - no user found, redirecting to login');
      navigate('/admin/login');
      return;
    }

    // User is authenticated, fetch data
    if (user) {
      console.log('AdminDashboard - user authenticated, fetching data');
      fetchCars();
      fetchReviews();
      fetchSyncStatus();
      fetchSyncLogs();
    }
  }, [user, authLoading, navigate]);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      // Fetch latest sync log
      const { data: latestSync, error: syncError } = await supabase
        .from('autotrader_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (syncError && syncError.code !== 'PGRST116') { // Ignore "no rows" error
        console.error('Error fetching sync status:', syncError);
      }
      
      setSyncStatus(latestSync);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('autotrader_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncSuccess(false);
    
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Not authenticated. Please sign in again.');
        return;
      }

      // Call trigger-sync function
      const response = await fetch('/.netlify/functions/trigger-sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh data
        await fetchCars();
        await fetchSyncStatus();
        await fetchSyncLogs();
        
        // Show success checkmark
        setIsSyncing(false);
        setSyncSuccess(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setSyncSuccess(false);
        }, 3000);
      } else {
        alert(`Sync failed: ${result.message || result.error}`);
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Manual sync error:', error);
      alert('Failed to trigger sync. Check console for details.');
      setIsSyncing(false);
    }
  };

  const handleDeleteCar = async (id: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCars(cars.filter(car => car.id !== id));
    } catch (error) {
      console.error('Error deleting car:', error);
      alert('Error deleting car. Please try again.');
    }
  };

  const handleEditCar = (car: Car) => {
    setSelectedCar(car);
    setShowEditModal(true);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setReviews(reviews.filter(review => review.id !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Error deleting review. Please try again.');
    }
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setShowEditReviewModal(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show loading screen while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fnt-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-4 py-4 sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={fntLogo} alt="FNT Motor Group" className="h-12 w-auto" />
                <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title="Back to Home"
                >
                  <Home className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xs:inline">Sign Out</span>
                </button>
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={fntLogo} alt="FNT Motor Group" className="h-12 w-auto" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <button
                onClick={handleBackToHome}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AutoTrader Sync Status Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Sync Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative w-6 h-6">
                  {syncSuccess ? (
                    <Check className="w-6 h-6 text-green-600 absolute inset-0 transition-all duration-500 ease-in-out animate-in fade-in zoom-in" />
                  ) : (
                    <RefreshCw className={`w-6 h-6 text-blue-600 absolute inset-0 transition-all duration-300 ease-in-out ${isSyncing ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">AutoTrader Sync Status</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Last Sync Time */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Sync</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-sm font-medium text-gray-900">
                      {syncStatus?.created_at 
                        ? new Date(syncStatus.created_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
                
                {/* Sync Status */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <div className="flex items-center space-x-2">
                    {syncStatus?.status === 'success' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Success</span>
                      </>
                    ) : syncStatus?.status === 'failed' ? (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Failed</span>
                      </>
                    ) : syncStatus?.status === 'partial' ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">Partial</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">No sync yet</span>
                    )}
                  </div>
                </div>
                
                {/* AutoTrader vs Manual Cars */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">From AutoTrader</p>
                  <p className="text-sm font-medium text-gray-900">
                    {cars.filter(car => car.synced_from_autotrader).length} / {cars.length} cars
                  </p>
                </div>
                
                {/* Last Sync Stats */}
                {syncStatus && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Sync Results</p>
                    <p className="text-sm font-medium text-gray-900">
                      +{syncStatus.cars_added} | ~{syncStatus.cars_updated} | -{syncStatus.cars_marked_unavailable}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleManualSync}
                disabled={isSyncing || syncSuccess}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  isSyncing || syncSuccess
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                } ${syncSuccess ? '!bg-green-600' : ''}`}
              >
                <div className="relative w-5 h-5">
                  {syncSuccess ? (
                    <Check className="w-5 h-5 absolute inset-0 transition-all duration-500 ease-in-out animate-in fade-in zoom-in" />
                  ) : (
                    <RefreshCw className={`w-5 h-5 absolute inset-0 transition-all duration-300 ease-in-out ${isSyncing ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <span>
                  {syncSuccess ? 'Synced!' : isSyncing ? 'Syncing...' : 'Sync Now'}
                </span>
              </button>
              
              <button
                onClick={() => setShowSyncLogs(!showSyncLogs)}
                className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                {showSyncLogs ? 'Hide' : 'View'} Logs
              </button>
            </div>
          </div>
          
          {/* Sync Logs */}
          {showSyncLogs && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Logs (Last 20)</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Removed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {syncLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            No sync logs yet
                          </td>
                        </tr>
                      ) : (
                        syncLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.sync_type === 'full_sync' ? 'bg-blue-100 text-blue-800' :
                                log.sync_type === 'webhook' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {log.sync_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.status === 'success' ? 'bg-green-100 text-green-800' :
                                log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{log.cars_added}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{log.cars_updated}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{log.cars_marked_unavailable}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {log.sync_duration_ms ? `${(log.sync_duration_ms / 1000).toFixed(2)}s` : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Car className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cars</p>
                <p className="text-2xl font-bold text-gray-900">{cars.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Cars</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cars.filter(car => car.is_available).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cars.filter(car => {
                    const carDate = new Date(car.created_at);
                    const now = new Date();
                    return carDate.getMonth() === now.getMonth() && carDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Fuel className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{cars.length > 0 ? Math.round(cars.reduce((sum, car) => sum + car.price, 0) / cars.length).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('cars')}
              className={`
                ${activeTab === 'cars'
                  ? 'border-fnt-red text-fnt-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
              `}
            >
              <Car className="w-5 h-5" />
              <span>Cars</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`
                ${activeTab === 'reviews'
                  ? 'border-fnt-red text-fnt-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
              `}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Reviews</span>
            </button>
          </nav>
        </div>

        {/* Cars Tab */}
        {activeTab === 'cars' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Car Inventory</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Car</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cars.map((car) => (
                  <tr key={car.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={
                            car.cover_image_path 
                              ? supabase.storage.from('car-images').getPublicUrl(car.cover_image_path).data.publicUrl
                              : car.cover_image_url || 'https://via.placeholder.com/60x40'
                          } 
                          alt={`${car.make} ${car.model}`}
                          className="w-12 h-8 sm:w-15 sm:h-10 rounded object-cover"
                        />
                        <div className="ml-2 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {car.make} {car.model}
                          </div>
                          <div className="text-xs text-gray-500">{car.year}</div>
                          <div className="sm:hidden text-xs text-gray-600 font-medium">
                            £{car.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      £{car.price.toLocaleString()}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatMileage(car.mileage)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        car.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {car.is_available ? 'Available' : 'Sold'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEditCar(car)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Edit car"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Delete car"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cars.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No cars in inventory yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-fnt-red hover:text-red-600 font-medium"
              >
                Add your first car
              </button>
            </div>
          )}
        </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Customer Reviews</h2>
              <button
                onClick={() => setShowAddReviewModal(true)}
                className="flex items-center justify-center space-x-2 bg-fnt-red hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Review</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.customer_name}</div>
                        {review.vehicle_purchased && (
                          <div className="text-xs text-gray-500">{review.vehicle_purchased}</div>
                        )}
                        <div className="text-xs text-gray-400">{review.review_date}</div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">{review.review_text}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{review.rating}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      {review.is_featured ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Featured
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Edit review"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reviews.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reviews yet.</p>
              <button
                onClick={() => setShowAddReviewModal(true)}
                className="mt-2 text-fnt-red hover:text-red-600 font-medium"
              >
                Add your first review
              </button>
            </div>
          )}
        </div>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddCarModal
          onClose={() => setShowAddModal(false)}
          onCarAdded={(newCar) => {
            setCars([newCar, ...cars]);
            setShowAddModal(false);
          }}
        />
      )}

      {showEditModal && selectedCar && (
        <EditCarModal
          car={selectedCar}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCar(null);
          }}
          onCarUpdated={(updatedCar) => {
            setCars(cars.map(car => car.id === updatedCar.id ? updatedCar : car));
            setShowEditModal(false);
            setSelectedCar(null);
          }}
        />
      )}

      {showAddReviewModal && (
        <AddReviewModal
          onClose={() => setShowAddReviewModal(false)}
          onSuccess={() => {
            fetchReviews();
            setShowAddReviewModal(false);
          }}
        />
      )}

      {showEditReviewModal && selectedReview && (
        <EditReviewModal
          review={selectedReview}
          onClose={() => {
            setShowEditReviewModal(false);
            setSelectedReview(null);
          }}
          onSuccess={() => {
            fetchReviews();
            setShowEditReviewModal(false);
            setSelectedReview(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
