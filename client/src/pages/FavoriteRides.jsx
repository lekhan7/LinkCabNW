import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { FaStar } from 'react-icons/fa';
import { favoritesService } from '../services/api';
import { announcementService } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const FavoriteRides = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repostingId, setRepostingId] = useState(null);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      // Try to get favorites from API first
      const response = await favoritesService.getUserFavorites();
      
      const apiFavorites = response.data || response.favorites || [];
      
      // Also check localStorage for any favorites saved from announcements page
      const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      
      // Clean up corrupted localStorage data
      const validLocalFavorites = localFavorites.filter(fav => 
        fav && fav.announcement_id && fav.fromLocation && fav.toLocation
      );
      
      // Update localStorage with cleaned data
      if (validLocalFavorites.length !== localFavorites.length) {
        localStorage.setItem('favorites', JSON.stringify(validLocalFavorites));
        console.log('Cleaned up corrupted localStorage favorites data');
      }
      
      // Transform localStorage favorites to match API structure (only if valid)
      const transformedLocalFavorites = validLocalFavorites.map(fav => ({
        id: fav.announcement_id,
        announcement: {
          id: fav.announcement_id,
          createdBy: fav.createdBy,
          createdAt: fav.createdAt,
          date: fav.date,
          time: fav.time,
          price: fav.price || 0,
          passenger_capacity: fav.passenger_capacity || 4,
          vehicle_type: fav.vehicle_type || 'personal_car',
          comfort_level: fav.comfort_level || 'comfortable',
          seat_preference: fav.seat_preference || 'partial-sharing',
          route_type: fav.route_type || 'daily-route',
          notes: fav.notes || '',
          start_location_name: fav.fromLocation,
          destination_name: fav.toLocation
        }
      }));
      
      // Merge both sources, prioritizing API data
      const allFavorites = [...apiFavorites, ...transformedLocalFavorites];
      
      // Remove duplicates by announcement_id, keeping API version if available
      const uniqueFavorites = allFavorites.filter((fav, index, self) => 
        self.findIndex(f => f.announcement?.id === fav.announcement?.id) === index
      );
      
      // Filter out any entries without valid announcement data
      const validFavorites = uniqueFavorites.filter(fav => 
        fav.announcement && 
        fav.announcement.start_location_name && 
        fav.announcement.destination_name
      );
      
      setFavorites(validFavorites);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      
      // Check if it's a network/backend unavailable error
      const isBackendUnavailable = !error.response && (
        error.message?.includes('Network Error') || 
        error.message?.includes('ERR_NETWORK') ||
        error.message?.includes('timeout') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Backend unavailable') ||
        error.message?.includes('Server is being developed')
      );
      
      if (!isBackendUnavailable) {
        addToast(error.message || 'Failed to fetch favorite rides', 'error');
      }
      
      // Try to load from localStorage as fallback
      try {
        const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const transformedLocalFavorites = localFavorites
          .filter(fav => fav.announcement_id && fav.fromLocation && fav.toLocation) // Filter out invalid entries
          .map(fav => ({
            id: fav.announcement_id,
            announcement: {
              id: fav.announcement_id,
              createdBy: fav.createdBy,
              createdAt: fav.createdAt,
              date: fav.date,
              time: fav.time,
              price: fav.price || 0,
              passenger_capacity: fav.passenger_capacity || 4,
              vehicle_type: fav.vehicle_type || 'personal_car',
              comfort_level: fav.comfort_level || 'comfortable',
              seat_preference: fav.seat_preference || 'partial-sharing',
              route_type: fav.route_type || 'daily-route',
              notes: fav.notes || '',
              start_location_name: fav.fromLocation,
              destination_name: fav.toLocation
            }
          }));
        
        // Filter out any entries without valid announcement data
        const validFavorites = transformedLocalFavorites.filter(fav => 
          fav.announcement && 
          fav.announcement.start_location_name && 
          fav.announcement.destination_name
        );
        
        setFavorites(validFavorites);
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError);
        setFavorites([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearCorruptedData = () => {
    try {
      localStorage.removeItem('favorites');
      setFavorites([]);
      addToast('Corrupted favorites data cleared. Please refresh the page.', 'success');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      addToast('Failed to clear corrupted data', 'error');
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await favoritesService.removeFromFavorites(favoriteId);
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      addToast('Removed from favorites', 'success');
    } catch (error) {
      console.error('Error removing favorite:', error);
      
      // Check if it's a network/backend unavailable error
      const isBackendUnavailable = !error.response && (
        error.message?.includes('Network Error') || 
        error.message?.includes('ERR_NETWORK') ||
        error.message?.includes('timeout') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Backend unavailable') ||
        error.message?.includes('Server is being developed')
      );
      
      if (isBackendUnavailable) {
        // Still remove from local state
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
      } else {
        addToast(error.message || 'Failed to remove from favorites', 'error');
      }
    }
  };

  const handleQuickView = (announcementId) => {
    navigate('/announcements', { state: { viewAnnouncementId: announcementId } });
  };

  const handleRepost = (favorite) => {
    if (!favorite?.announcement) {
      addToast('This ride is no longer available.', 'error');
      return;
    }
    
    setSelectedFavorite(favorite);
    // Set default date and time from the original announcement
    setSelectedDate(favorite.announcement.date || '');
    setSelectedTime(favorite.announcement.time || '');
    setShowDateTimeModal(true);
  };

  const handleConfirmRepost = async () => {
    if (!selectedDate || !selectedTime) {
      addToast('Please select both date and time', 'error');
      return;
    }

    try {
      setRepostingId(selectedFavorite.id);
      
      // Create a new announcement with the same details but new date/time
      const newAnnouncementData = {
        start_location_name: selectedFavorite.announcement.start_location_name,
        destination_name: selectedFavorite.announcement.destination_name,
        date: selectedDate,
        time: selectedTime,
        price: parseFloat(selectedFavorite.announcement.price) || 0,
        passenger_capacity: parseInt(selectedFavorite.announcement.passenger_capacity) || 4,
        vehicle_type: selectedFavorite.announcement.vehicle_type || 'personal_car',
        comfort_level: selectedFavorite.announcement.comfort_level || 'comfortable',
        seat_preference: selectedFavorite.announcement.seat_preference || 'partial-sharing',
        route_type: selectedFavorite.announcement.route_type || 'daily-route',
        notes: selectedFavorite.announcement.notes || 'Reposted from favorites',
        // Send valid PostGIS geometry strings (required fields)
        start_location: 'SRID=4326;POINT(0 0)',
        destination: 'SRID=4326;POINT(0 0)'
      };

      const response = await announcementService.createAnnouncement(newAnnouncementData);
      const newId = response?.data?.id || response?.id;

      addToast('Announcement created successfully!', 'success');
      setShowDateTimeModal(false);
      setSelectedFavorite(null);
      setSelectedDate('');
      setSelectedTime('');

      if (newId) {
        navigate('/announcements', { state: { viewAnnouncementId: newId } });
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      
      // Check if it's a network/backend unavailable error
      const isBackendUnavailable = !error.response && (
        error.message?.includes('Network Error') || 
        error.message?.includes('ERR_NETWORK') ||
        error.message?.includes('timeout') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('Backend unavailable') ||
        error.message?.includes('Server is being developed')
      );
      
      if (!isBackendUnavailable) {
        addToast(error.message || 'Failed to create announcement', 'error');
      }
    } finally {
      setRepostingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div style={{ color: '#64748b' }}>Loading favorite rides...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        padding: '2rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '0.5rem',
            }}
          >
            ⭐ Favorite Rides
          </h1>
          <p
            style={{
              color: '#64748b',
              fontSize: '1.1rem',
              marginBottom: '2rem',
            }}
          >
            Your saved travel destinations
          </p>
        </div>

        {favorites.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            maxWidth: '500px',
            margin: '0 auto'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            <FaStar style={{ color: '#fbbf24' }} />
          </div>
          <h2 style={{
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            You don't have any favorite rides yet
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Start exploring announcements and save your favorite routes!
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/announcements')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Browse Announcements
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearCorruptedData}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Clear Corrupted Data
            </motion.button>
          </div>
        </motion.div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            {favorites.map((favorite, index) => (
              <motion.div
                key={favorite._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '2px dotted #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s',
                  position: 'relative'
                }}
                whileHover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
              >
                {/* Header */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3
                      style={{
                        color: '#1e293b',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        margin: 0,
                      }}
                    >
                      {favorite?.announcement?.created_by?.name || favorite?.announcement?.createdBy?.name || 'Unknown User'}
                    </h3>
                    <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>⭐</span>
                  </div>
                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '0.8rem',
                      margin: '0.25rem 0 0 0',
                    }}
                  >
                    Favorited on {formatDate(favorite.created_at)}
                  </p>
                </div>

                {/* Route Information */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>📍</span>
                    <h4
                      style={{
                        color: '#3b82f6',
                        fontSize: '1rem',
                        fontWeight: '600',
                        margin: 0,
                      }}
                    >
                      {favorite?.announcement?.destination_name || favorite?.toLocation || 'Unknown Destination'}
                    </h4>
                  </div>
                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '0.85rem',
                      margin: '0 0 0 1.5rem',
                    }}
                  >
                    From: {favorite?.announcement?.start_location_name || favorite?.fromLocation || 'Unknown Location'}
                  </p>
                </div>

                {/* Date and Time */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#1e293b',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>📅</span>
                    <span>{favorite?.announcement?.date ? formatDate(favorite.announcement.date) : '—'}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#1e293b',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>🕐</span>
                    <span>{favorite?.announcement?.time ? formatTime(favorite.announcement.time) : '—'}</span>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.5rem',
                      backgroundColor: '#F5C400',
                      borderRadius: '8px',
                      border: '2px solid #000000'
                    }}
                  >
                    <span style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold', 
                      color: '#000000' 
                    }}>
                      ₹{favorite?.announcement?.price || 0}
                    </span>
                  </div>
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '0.7rem', 
                    textAlign: 'center',
                    margin: '0.25rem 0 0 0' 
                  }}>
                    per person
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const announcementId = favorite?.announcement?.id;
                      if (announcementId) handleQuickView(announcementId);
                    }}
                    disabled={!favorite?.announcement?.id}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.75rem',
                      backgroundColor: !favorite?.announcement?.id ? '#94a3b8' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: !favorite?.announcement?.id ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                    }}
                  >
                    Quick View
                  </motion.button>

                  <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRepost(favorite)}
                      disabled={!favorite?.announcement?.id || repostingId === favorite?.id}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        padding: '0.75rem',
                        backgroundColor: (!favorite?.announcement?.id || repostingId === favorite?.id) ? '#94a3b8' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: (!favorite?.announcement?.id || repostingId === favorite?.id) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s',
                      }}
                    >
                      {repostingId === favorite?.id ? 'Creating...' : 'Go Again'}
                    </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      handleRemoveFavorite(favorite.id);
                    }}
                    style={{
                      padding: '0.75rem',
                      minWidth: '120px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: !(favorite?.announcement?._id || favorite?.announcement) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                    }}
                  >
                    Remove
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Date/Time Picker Modal */}
      <AnimatePresence>
        {showDateTimeModal && selectedFavorite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
            onClick={() => setShowDateTimeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '400px',
                width: '100%',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDateTimeModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>

              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#1e293b',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Choose Date & Time
              </h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem' 
                }}>
                  📅 Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '0.5rem' 
                }}>
                  🕐 Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '1rem',
                marginTop: '2rem'
              }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDateTimeModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmRepost}
                  disabled={repostingId === selectedFavorite?.id}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: repostingId === selectedFavorite?.id ? '#94a3b8' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: repostingId === selectedFavorite?.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {repostingId === selectedFavorite?.id ? 'Creating...' : 'Go Again'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FavoriteRides;
