import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { FaBullhorn, FaClock, FaUsers, FaEye, FaPlus, FaInfoCircle, FaCheck, FaTimes, FaHourglassHalf, FaStar, FaSearch, FaFilter, FaCalendarAlt, FaRupeeSign, FaCar } from 'react-icons/fa';
import { announcementAPI, favoritesAPI } from '../services/api';

const Announcements = () => {
  const { user } = useSimpleAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Check if backend is available
  const checkBackendAvailability = async () => {
    try {
      await announcementAPI.getAllAnnouncements({ limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Check if backend is available first
      const isBackendUp = await checkBackendAvailability();
      setBackendAvailable(isBackendUp);
      
      if (!isBackendUp) {
        console.log('Backend not available, using fallback mode');
        setAnnouncements([]);
        return;
      }
      
      const response = await announcementAPI.getAllAnnouncements({ limit: 50 });
      const announcements = response.data || []; // Backend returns 'data' not 'announcements'
      
      console.log('Raw announcements from backend:', announcements);
      console.log('Response structure:', response);
      
      // Transform database data to match component expectations
      const transformedAnnouncements = announcements.map(announcement => ({
        id: announcement.id,
        title: `${announcement.start_location_name} → ${announcement.destination_name}`,
        description: announcement.notes || 'Join this ride!',
        from: announcement.start_location_name,
        to: announcement.destination_name,
        date: announcement.date,
        time: announcement.time,
        seatsAvailable: announcement.passenger_capacity - (announcement.joinedBy?.length || 0),
        totalSeats: announcement.passenger_capacity,
        status: announcement.ride_completed ? 'completed' : 'active',
        createdBy: announcement.created_by?.name || 'User',
        views: announcement.views || 0,
        price: announcement.price,
        vehicle_type: announcement.vehicle_type,
        created_by: announcement.created_by,
        // Include the original user data for direct access
        created_by_user: announcement.created_by,
        // Use real creator data from joined user table
        creator: {
          id: announcement.created_by?.id,
          name: announcement.created_by?.name,
          phone_number: announcement.created_by?.phone_number,
          average_rating: announcement.created_by?.average_rating
        }
      }));
      
      setAnnouncements(transformedAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setBackendAvailable(false);
      error('Server error - please try again later');
      setAnnouncements([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailsModal(true);
    
    // Fetch participants for this announcement
    try {
      setLoadingParticipants(true);
      const response = await announcementAPI.getAnnouncementParticipants(announcement.id);
      setParticipants(response.data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedAnnouncement(null);
    setParticipants([]);
  };

  // Favorites functions
  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      setLoadingFavorites(true);
      const response = await favoritesAPI.getUserFavorites();
      const favoriteIds = response.data?.map(fav => fav.announcement_id) || [];
      setFavorites(new Set(favoriteIds));
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleFavorite = async (announcementId) => {
    if (!user) {
      error('Please login to add favorites');
      navigate('/login');
      return;
    }

    try {
      if (favorites.has(announcementId)) {
        // Remove from favorites
        await favoritesAPI.removeFromFavorites(announcementId);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(announcementId);
          return newFavorites;
        });
        success('Removed from favorites');
      } else {
        // Add to favorites - get announcement data to send required fields
        const announcement = announcements.find(a => a.id === announcementId);
        if (announcement) {
          await favoritesAPI.addToFavorites({
            announcement_id: announcementId,
            from_location: announcement.from,
            to_location: announcement.to
          });
          setFavorites(prev => new Set([...prev, announcementId]));
          success('Added to favorites');
          
          // Also save to localStorage for cross-page sync
          const currentFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
          currentFavorites.push({ announcement_id: announcementId, from_location: announcement.from, to_location: announcement.to });
          localStorage.setItem('favorites', JSON.stringify(currentFavorites));
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      error(err.message || 'Failed to update favorites');
    }
  };

  const handleGoRide = async (announcementId) => {
    if (!user) {
      error('Please login to send go-ride request');
      navigate('/login');
      return;
    }

    try {
      await favoritesAPI.goRide(announcementId);
      success('Go-ride request sent successfully!');
    } catch (err) {
      console.error('Error sending go-ride request:', err);
      error(err.message || 'Failed to send go-ride request');
    }
  };

  const handleRequestRide = async (announcementId) => {
    try {
      if (!user) {
        error('Please login to request a ride');
        navigate('/login');
        return;
      }

      if (!backendAvailable) {
        error('Server not available - please try again later');
        return;
      }

      // Create connection request in database (real table)
      const response = await announcementAPI.createJoinRequest(announcementId);
      success(response.message || 'Ride request sent successfully!');
      
      // Refresh announcements to update UI
      fetchAnnouncements();
    } catch (err) {
      console.error('Error requesting ride:', err);
      if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error(err.message || 'Failed to request ride');
      }
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    // Apply status filter
    if (filter === 'active' && announcement.status !== 'active') return false;
    if (filter === 'closed' && announcement.status !== 'completed') return false;
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        announcement.from,
        announcement.to,
        announcement.createdBy,
        announcement.description,
        announcement.date,
        announcement.time
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    
    // Apply price filter
    if (priceRange.min && announcement.price < parseFloat(priceRange.min)) return false;
    if (priceRange.max && announcement.price > parseFloat(priceRange.max)) return false;
    
    // Apply date filter
    if (selectedDate && announcement.date !== selectedDate) return false;
    
    // Apply vehicle type filter
    if (selectedVehicleType && announcement.vehicle_type !== selectedVehicleType) return false;
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    switch (sortBy) {
      case 'newest':
        return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
      case 'oldest':
        return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'seats_low':
        return a.seatsAvailable - b.seatsAvailable;
      case 'seats_high':
        return b.seatsAvailable - a.seatsAvailable;
      default:
        return 0;
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.text 
      }}>
        <div>Loading announcements...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      maxWidth: '1400px', 
      margin: '0 auto',
      backgroundColor: COLORS.background,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: COLORS.text,
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <FaBullhorn style={{ color: COLORS.primary }} />
            Ride Announcements
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: COLORS.textMuted, 
            margin: 0,
            fontWeight: '400'
          }}>
            Find and join rides near you
          </p>
        </div>
        
        {user && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create-announcement')}
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
              color: '#000',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            <FaPlus />
            Create Announcement
          </motion.button>
        )}
      </motion.div>

      {/* Search Bar and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem', 
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: COLORS.surface,
          borderRadius: '1rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '250px',
            position: 'relative'
          }}>
            <FaSearch style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: COLORS.textMuted,
              fontSize: '1rem'
            }} />
            <input
              type="text"
              placeholder="Search by location, creator, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                backgroundColor: COLORS.background,
                color: COLORS.text,
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '0.5rem',
              backgroundColor: showFilters ? COLORS.primary : 'transparent',
              color: showFilters ? '#000' : COLORS.text,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            <FaFilter />
            Filters
          </motion.button>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: COLORS.textMuted 
          }}>
            {filteredAnnouncements.length} of {announcements.length} rides
          </div>
        </div>

        {/* Quick Status Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: COLORS.textMuted,
            marginRight: '0.5rem'
          }}>
            Status:
          </span>
          {['all', 'active', 'closed'].map((filterOption) => (
            <motion.button
              key={filterOption}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(filterOption)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '2rem',
                border: '2px solid',
                borderColor: filter === filterOption ? COLORS.primary : COLORS.border,
                backgroundColor: filter === filterOption ? COLORS.primary : 'transparent',
                color: filter === filterOption ? '#000' : COLORS.textMuted,
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: filter === filterOption ? '600' : '400',
                transition: 'all 0.3s ease',
                textTransform: 'capitalize'
              }}
            >
              {filterOption}
            </motion.button>
          ))}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${COLORS.border}`
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {/* Price Range */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: COLORS.textMuted,
                    marginBottom: '0.5rem'
                  }}>
                    <FaRupeeSign style={{ marginRight: '0.25rem' }} />
                    Price Range
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: COLORS.background,
                        color: COLORS.text,
                        outline: 'none'
                      }}
                    />
                    <span style={{ color: COLORS.textMuted }}>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        backgroundColor: COLORS.background,
                        color: COLORS.text,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: COLORS.textMuted,
                    marginBottom: '0.5rem'
                  }}>
                    <FaCalendarAlt style={{ marginRight: '0.25rem' }} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: COLORS.background,
                      color: COLORS.text,
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: COLORS.textMuted,
                    marginBottom: '0.5rem'
                  }}>
                    <FaCar style={{ marginRight: '0.25rem' }} />
                    Vehicle Type
                  </label>
                  <select
                    value={selectedVehicleType}
                    onChange={(e) => setSelectedVehicleType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: COLORS.background,
                      color: COLORS.text,
                      outline: 'none'
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="personal_car">Personal Car</option>
                    <option value="bike">Bike</option>
                    <option value="suv">SUV</option>
                    <option value="sedan">Sedan</option>
                    <option value="hatchback">Hatchback</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: COLORS.textMuted,
                    marginBottom: '0.5rem'
                  }}>
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      backgroundColor: COLORS.background,
                      color: COLORS.text,
                      outline: 'none'
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="seats_low">Seats: Low to High</option>
                    <option value="seats_high">Seats: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSearchQuery('');
                    setPriceRange({ min: '', max: '' });
                    setSelectedDate('');
                    setSelectedVehicleType('');
                    setSortBy('newest');
                    setFilter('all');
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '0.25rem',
                    backgroundColor: 'transparent',
                    color: COLORS.textMuted,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  Clear All Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Announcements List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gap: '1.5rem' }}
      >
        {filteredAnnouncements.length === 0 ? (
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: COLORS.surface,
              borderRadius: '1rem',
              color: COLORS.textMuted,
              border: `2px dashed ${COLORS.border}`,
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FaBullhorn style={{ 
              fontSize: '4rem', 
              marginBottom: '1.5rem',
              color: COLORS.textMuted,
              opacity: 0.5
            }} />
            <h3 style={{ 
              fontSize: '1.5rem',
              fontWeight: '600',
              color: COLORS.text,
              marginBottom: '0.5rem'
            }}>
              No announcements found
            </h3>
            <p style={{ 
              fontSize: '1rem',
              marginBottom: '1.5rem'
            }}>
              {filter === 'all' ? 'Be the first to create a ride announcement!' : `No ${filter} rides available`}
            </p>
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/create-announcement')}
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                  color: '#000',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Create First Announcement
              </motion.button>
            )}
          </motion.div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <motion.div
              key={announcement.id}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }}
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Status Badge - Moved to avoid overlap with price */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10
              }}>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '1.5rem',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  backgroundColor: announcement.status === 'active' ? '#10b981' : '#6b7280',
                  color: '#fff',
                  textTransform: 'uppercase',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {announcement.status}
                </span>
              </div>

              {/* Header with Profile */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                {/* Profile Picture */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {announcement.created_by?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                
                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    color: COLORS.text,
                    margin: '0 0 0.25rem 0',
                    lineHeight: '1.2'
                  }}>
                    {announcement.created_by?.name || 'Unknown User'}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    fontSize: '0.875rem',
                    color: COLORS.textMuted
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaCalendarAlt style={{ fontSize: '0.875rem' }} />
                      <span>{announcement.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaClock style={{ fontSize: '0.875rem' }} />
                      <span>{announcement.time}</span>
                    </div>
                  </div>
                </div>
                
                {/* Price and Seats */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.5rem'
                }}>
                  {announcement.price && (
                    <div style={{ 
                      fontSize: '1.25rem', 
                      color: COLORS.success, 
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ fontSize: '0.875rem' }}>₹</span>
                      {announcement.price}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: COLORS.textMuted,
                    fontWeight: '500'
                  }}>
                    {announcement.seatsAvailable} of {announcement.totalSeats} seats
                  </div>
                </div>
              </div>

              {/* Route Info */}
              <div style={{ 
                backgroundColor: COLORS.surfaceLight,
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  position: 'relative'
                }}>
                  {/* From Location */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: COLORS.textMuted,
                      marginBottom: '0.25rem',
                      fontWeight: '500'
                    }}>
                      FROM
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: COLORS.text,
                      fontWeight: '600'
                    }}>
                      {announcement.from}
                    </div>
                  </div>
                  
                  {/* Route Arrow */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: COLORS.primary,
                    fontSize: '1.5rem'
                  }}>
                    →
                  </div>
                  
                  {/* To Location */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: COLORS.textMuted,
                      marginBottom: '0.25rem',
                      fontWeight: '500'
                    }}>
                      TO
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: COLORS.text,
                      fontWeight: '600'
                    }}>
                      {announcement.to}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                {/* Left side buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                  {/* Request Ride Button */}
                  {user && announcement.seatsAvailable > 0 && announcement.status === 'active' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestRide(announcement.id);
                      }}
                      style={{
                        backgroundColor: COLORS.primary,
                        color: '#000',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        flex: 1
                      }}
                    >
                      Request
                    </motion.button>
                  )}
                  
                  {/* View Details Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(announcement);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: COLORS.primary,
                      border: `1px solid ${COLORS.primary}`,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <FaInfoCircle style={{ fontSize: '0.75rem' }} />
                    Details
                  </motion.button>
                  
                  {!user && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/login');
                      }}
                      style={{
                        backgroundColor: COLORS.surfaceLight,
                        color: COLORS.text,
                        border: `1px solid ${COLORS.border}`,
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        flex: 1
                      }}
                    >
                      Login
                    </motion.button>
                  )}
                  
                  {user && announcement.seatsAvailable === 0 && (
                    <div style={{
                      backgroundColor: COLORS.surfaceLight,
                      color: COLORS.textMuted,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      flex: 1
                    }}>
                      Full
                    </div>
                  )}
                </div>
                
                {/* Right side buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Favorite Star Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(announcement.id);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: favorites.has(announcement.id) ? '#fbbf24' : COLORS.textMuted,
                      border: 'none',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={favorites.has(announcement.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <FaStar />
                  </motion.button>
                  
                  {/* Go Ride Button - Only show if favorited and not own announcement */}
                  {user && favorites.has(announcement.id) && announcement.created_by !== user.id && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoRide(announcement.id);
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Send go-ride request to announcement creator"
                    >
                      Go Ride
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

    {/* Announcement Details Modal */}
    <AnimatePresence>
      {showDetailsModal && selectedAnnouncement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: COLORS.textMuted
              }}
            >
              ×
            </button>

            {/* Creator Info */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: COLORS.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {selectedAnnouncement.created_by_user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: COLORS.text,
                  marginBottom: '0.25rem'
                }}>
                  {selectedAnnouncement.created_by_user?.name || 'Unknown User'}
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: COLORS.textMuted,
                  margin: 0
                }}>
                  {selectedAnnouncement.created_by_user?.email || ''}
                </p>
              </div>
            </div>

            {/* Title and Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: COLORS.text,
                marginBottom: '0.5rem'
              }}>
                {selectedAnnouncement.title}
              </h2>
              {selectedAnnouncement.description && (
                <p style={{ 
                  fontSize: '1rem', 
                  color: COLORS.text,
                  lineHeight: '1.5'
                }}>
                  {selectedAnnouncement.description}
                </p>
              )}
            </div>

            {/* Route Info */}
            <div style={{ 
              backgroundColor: COLORS.surfaceLight,
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: COLORS.text,
                marginBottom: '0.5rem'
              }}>
                Route Details
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>From:</span>
                <span style={{ fontSize: '0.875rem', color: COLORS.text, fontWeight: '500' }}>
                  {selectedAnnouncement.from}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>To:</span>
                <span style={{ fontSize: '0.875rem', color: COLORS.text, fontWeight: '500' }}>
                  {selectedAnnouncement.to}
                </span>
              </div>
            </div>

            {/* Time and Date */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '1.5rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>Date</div>
                <div style={{ fontSize: '1rem', color: COLORS.text, fontWeight: '500' }}>
                  {selectedAnnouncement.date}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>Time</div>
                <div style={{ fontSize: '1rem', color: COLORS.text, fontWeight: '500' }}>
                  {selectedAnnouncement.time}
                </div>
              </div>
            </div>

            {/* Price */}
            {selectedAnnouncement.price && (
              <div style={{ 
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>Price</div>
                <div style={{ 
                  fontSize: '2rem', 
                  color: COLORS.success, 
                  fontWeight: 'bold'
                }}>
                  ₹{selectedAnnouncement.price}
                </div>
              </div>
            )}

            {/* Seats Available */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <FaUsers style={{ color: COLORS.primary }} />
              <span style={{ fontSize: '0.875rem', color: COLORS.text }}>
                {selectedAnnouncement.seatsAvailable}/{selectedAnnouncement.totalSeats} seats available
              </span>
            </div>

            {/* Participants Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: COLORS.text,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaUsers style={{ color: COLORS.primary }} />
                Participants ({participants.length})
              </h4>
              
              {loadingParticipants ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: COLORS.textMuted }}>
                  Loading participants...
                </div>
              ) : participants.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  backgroundColor: COLORS.surfaceLight,
                  borderRadius: '0.5rem',
                  color: COLORS.textMuted
                }}>
                  No participants yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {participants.map((participant) => (
                    <div key={participant.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: COLORS.surfaceLight,
                      borderRadius: '0.5rem',
                      border: `1px solid ${COLORS.border}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: COLORS.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#000',
                          fontSize: '1rem',
                          fontWeight: 'bold'
                        }}>
                          {participant.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            fontWeight: '600', 
                            color: COLORS.text 
                          }}>
                            {participant.user?.name || 'Unknown User'}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: COLORS.textMuted 
                          }}>
                            {participant.user?.phone_number || 'No phone'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {participant.status === 'accepted' && (
                            <>
                              <FaCheck style={{ color: '#10b981' }} />
                              <span style={{ color: '#10b981', backgroundColor: '#d1fae5', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>Accepted</span>
                            </>
                          )}
                          {participant.status === 'rejected' && (
                            <>
                              <FaTimes style={{ color: '#ef4444' }} />
                              <span style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>Rejected</span>
                            </>
                          )}
                          {participant.status === 'requested' && (
                            <>
                              <FaHourglassHalf style={{ color: '#f59e0b' }} />
                              <span style={{ color: '#f59e0b', backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>Pending</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {user && selectedAnnouncement.created_by === user.id && (
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                paddingTop: '1rem',
                borderTop: `1px solid ${COLORS.border}`
              }}>
            
                
                {participants.filter(p => p.status === 'accepted').length > 0 && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: COLORS.surfaceLight,
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    color: COLORS.textMuted,
                    fontSize: '0.875rem',
                    flex: 1
                  }}>
                    Cannot delete - passengers have joined
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};

export default Announcements;
