import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { COMFORT_LEVELS, SEAT_SHARING_PREFERENCES, COLORS } from '../utils/constants';
import { announcementService, favoritesService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { FaCar, FaUsers, FaRoute, FaTrophy, FaMapMarkerAlt, FaTimes, FaSearch, FaMapPin, FaClock, FaCog, FaComment, FaMusic, FaGlassCheers, FaSmokingBan, FaSnowflake, FaSuitcase, FaPaw, FaRestroom, FaDollarSign, FaUserFriends } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    startLocation: {
      name: '',
      lat: '',
      lng: ''
    },
    destination: {
      name: '',
      lat: '',
      lng: ''
    },
    date: '',
    time: '',
    price: '',
    passengerCapacity: '1',
    vehicleType: 'personal_car',
    comfortLevel: 'comfortable',
    seatPreference: 'partial-sharing',
    routeType: 'daily-route',
    notes: '',
    preferences: {
      smoking: '',
      alcohol: '',
      music: '',
      conversation: '',
      pets: '',
      ac: '',
      luggage: '',
      genderPreference: ''
    },
    saveAsFavorite: false
  });
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapModalType, setMapModalType] = useState(''); // 'start' or 'destination'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState({
    name: '',
    lat: 20.5937, // Default: India center
    lng: 78.9629
  });
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const mapRef = useRef(null);

  const { user } = useSimpleAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle preferences
    if (name.startsWith('pref_')) {
      const prefKey = name.replace('pref_', '');
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } 
    // Handle location inputs (trigger map modal)
    else if (name === 'startLocation' || name === 'destination') {
      setMapModalType(name);
      setShowMapModal(true);
    }
    // Handle regular form fields
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.startLocation.name || !formData.destination.name || !formData.date || !formData.time || !formData.price || !formData.passengerCapacity) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!formData.startLocation.lat || !formData.startLocation.lng || !formData.destination.lat || !formData.destination.lng) {
      alert('Please select valid locations from the map');
      return;
    }

    setLoading(true);

    try {
      // Transform frontend data to match backend schema
      const backendData = {
        start_location_name: formData.startLocation.name,
        start_location: `SRID=4326;POINT(${formData.startLocation.lng} ${formData.startLocation.lat})`,
        destination_name: formData.destination.name,
        destination: `SRID=4326;POINT(${formData.destination.lng} ${formData.destination.lat})`,
        date: formData.date,
        time: formData.time,
        price: parseFloat(formData.price),
        passenger_capacity: parseInt(formData.passengerCapacity),
        vehicle_type: formData.vehicleType,
        comfort_level: formData.comfortLevel,
        seat_preference: formData.seatPreference,
        route_type: formData.routeType,
        notes: formData.notes,
        smoking_preference: formData.preferences.smoking,
        alcohol_preference: formData.preferences.alcohol,
        music_preference: formData.preferences.music,
        conversation_preference: formData.preferences.conversation,
        pets_preference: formData.preferences.pets,
        ac_preference: formData.preferences.ac,
        luggage_preference: formData.preferences.luggage,
        gender_preference: formData.preferences.genderPreference
      };

      await announcementService.createAnnouncement(backendData);
      
      // Save as favorite if checkbox is checked
      if (formData.saveAsFavorite && formData.startLocation.name && formData.destination.name) {
        try {
          const token = localStorage.getItem('token');
          await favoritesService.addToFavorites({
            fromLocation: formData.startLocation.name,
            toLocation: formData.destination.name
          });
          console.log('Route saved as favorite');
        } catch (favoriteError) {
          console.error('Failed to save favorite route:', favoriteError);
          // Don't fail the announcement creation if favorite saving fails
        }
      }
      
      // Navigate to announcements page after successful creation
      navigate('/announcements');
      
      // Reset form
      setFormData({
        startLocation: { name: '', lat: '', lng: '' },
        destination: { name: '', lat: '', lng: '' },
        date: '',
        time: '',
        price: '',
        passengerCapacity: '1',
        vehicleType: 'personal_car',
        comfortLevel: 'comfortable',
        seatPreference: 'partial-sharing',
        routeType: 'daily-route',
        notes: '',
        preferences: {
          smoking: '',
          alcohol: '',
          music: '',
          conversation: '',
          pets: '',
          ac: '',
          luggage: '',
          genderPreference: ''
        },
        saveAsFavorite: false
      });
      alert('Travel announcement created successfully! All logged-in users will be notified.');
    } catch (error) {
      alert('Failed to create announcement: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    if (mapModalType === 'startLocation') {
      setFormData(prev => ({
        ...prev,
        startLocation: locationData
      }));
    } else if (mapModalType === 'destination') {
      setFormData(prev => ({
        ...prev,
        destination: locationData
      }));
    }
    setShowMapModal(false);
    setMapModalType('');
    // Reset map state for next use
    setSearchQuery('');
    setSelectedLocation({ name: '', lat: 20.5937, lng: 78.9629 });
    setMapCenter([20.5937, 78.9629]);
  };

  // Fix Leaflet default icon issue
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  // Get user's current location on modal open
  useEffect(() => {
    if (showMapModal) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setMapCenter([latitude, longitude]);
            setSelectedLocation(prev => ({ ...prev, lat: latitude, lng: longitude }));
          },
          (error) => {
            console.log('Location access denied, using default center');
          }
        );
      }
    }
  }, [showMapModal]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        
        setMapCenter([newLat, newLng]);
        setSelectedLocation({
          name: display_name,
          lat: newLat,
          lng: newLng
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          
          setSelectedLocation({
            name: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            lat,
            lng
          });
        } catch (error) {
          setSelectedLocation({
            name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            lat,
            lng
          });
        }
      }
    });
    return null;
  };

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          padding: '2rem',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#3b82f6',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Create Co-Passenger Announcement
        </h1>
        <p style={{ 
          color: '#64748b',
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          Share your travel plans and let others join you
        </p>
        
        {/* Reward Badge */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaTrophy style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.9rem', color: '#92400e' }}>
            Earn points for active co-passenger usage!
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* 1️⃣ Location - Moved to Top */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaMapPin /> Location
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Starting Location
                </label>
                <input
                  type="text"
                  name="startLocation"
                  value={formData.startLocation.name}
                  onChange={handleChange}
                  required
                  placeholder="Click to select on map"
                  readOnly
                  onClick={() => {
                    setMapModalType('startLocation');
                    setShowMapModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Destination
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination.name}
                  onChange={handleChange}
                  required
                  placeholder="Click to select on map"
                  readOnly
                  onClick={() => {
                    setMapModalType('destination');
                    setShowMapModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </div>
            {/* 2️⃣ Basic Info - Price & Passenger Capacity */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaDollarSign /> Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Price per Person (₹)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Passenger Capacity
                </label>
                <select
                  name="passengerCapacity"
                  value={formData.passengerCapacity}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem'
                  }}
                >
                  <option value="1">1 Passenger</option>
                  <option value="2">2 Passengers</option>
                  <option value="3">3 Passengers</option>
                  <option value="4">4 Passengers</option>
                </select>
              </div>
            </div>
          </div>
            {/* 3️⃣ Route Type */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaRoute /> Route Type
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData(prev => ({ ...prev, routeType: 'daily-route' }))}
                style={{
                  padding: '1rem',
                  backgroundColor: formData.routeType === 'daily-route' ? COLORS.primary : COLORS.surface,
                  border: formData.routeType === 'daily-route' ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: formData.routeType === 'daily-route' ? COLORS.background : COLORS.text,
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaRoute />
                Daily Route
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData(prev => ({ ...prev, routeType: 'self-car' }))}
                style={{
                  padding: '1rem',
                  backgroundColor: formData.routeType === 'self-car' ? COLORS.primary : COLORS.surface,
                  border: formData.routeType === 'self-car' ? `2px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: formData.routeType === 'self-car' ? COLORS.background : COLORS.text,
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaCar />
                Self Car
              </motion.button>
            </div>
          </div>
            {/* 4️⃣ Vehicle Type */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCar /> Vehicle Type
            </h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '1rem 2rem',
                  backgroundColor: COLORS.primary,
                  border: `2px solid ${COLORS.primary}`,
                  borderRadius: '8px',
                  color: COLORS.background,
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FaCar style={{ fontSize: '1.5rem' }} />
                <div>Personal Car</div>
              </motion.button>
            </div>
          </div>
            {/* 5️⃣ Travel Preferences */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCog /> Travel Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              {/* Smoking */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaSmokingBan /> Smoking
                </label>
                <select
                  name="pref_smoking"
                  value={formData.preferences.smoking}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="smoking-allowed">Smoking Allowed</option>
                  <option value="non-smoking">Non-Smoking Only</option>
                </select>
              </div>

              {/* Alcohol */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaGlassCheers /> Alcohol
                </label>
                <select
                  name="pref_alcohol"
                  value={formData.preferences.alcohol}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="alcohol-allowed">Alcohol Allowed</option>
                  <option value="no-alcohol">No Alcohol</option>
                </select>
              </div>

              {/* Music */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaMusic /> Music
                </label>
                <select
                  name="pref_music"
                  value={formData.preferences.music}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="music-allowed">Music Allowed</option>
                  <option value="silent-ride">Silent Ride</option>
                </select>
              </div>

              {/* Conversation */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaComment /> Conversation
                </label>
                <select
                  name="pref_conversation"
                  value={formData.preferences.conversation}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="chatting-allowed">Chatting Allowed</option>
                  <option value="quiet-ride">Quiet Ride</option>
                </select>
              </div>

              {/* Pets */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaPaw /> Pets
                </label>
                <select
                  name="pref_pets"
                  value={formData.preferences.pets}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="pets-allowed">Pets Allowed</option>
                  <option value="no-pets">No Pets</option>
                </select>
              </div>

              {/* AC */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaSnowflake /> AC
                </label>
                <select
                  name="pref_ac"
                  value={formData.preferences.ac}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="ac-on">AC On</option>
                  <option value="ac-off">AC Off</option>
                </select>
              </div>

              {/* Luggage */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaSuitcase /> Luggage
                </label>
                <select
                  name="pref_luggage"
                  value={formData.preferences.luggage}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="light-luggage">Light Luggage Only</option>
                  <option value="heavy-luggage">Heavy Luggage Allowed</option>
                </select>
              </div>

              {/* Gender Preference */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaRestroom /> Gender Preference
                </label>
                <select
                  name="pref_genderPreference"
                  value={formData.preferences.genderPreference}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="no-preference">No Preference</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6️⃣ Timing */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaClock /> Timing
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Travel Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Travel Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 7️⃣ Additional Preferences */}
          <div>
            <h3 style={{ 
              fontSize: '1.2rem', 
              fontWeight: '600', 
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaCog /> Additional Preferences
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Comfort Level
                </label>
                <select
                  name="comfortLevel"
                  value={formData.comfortLevel}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem'
                  }}
                >
                  {COMFORT_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem',
                  color: COLORS.text,
                  fontWeight: '500'
                }}>
                  Seat Sharing Preference
                </label>
                <select
                  name="seatPreference"
                  value={formData.seatPreference}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.text,
                    fontSize: '1rem'
                  }}
                >
                  {SEAT_SHARING_PREFERENCES.map((preference) => (
                    <option key={preference.value} value={preference.value}>
                      {preference.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 8️⃣ Notes */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              color: COLORS.text,
              fontWeight: '500'
            }}>
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional information about your travel plans..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Save as Favorite Checkbox */}
          <div style={{
            backgroundColor: COLORS.surface,
            padding: '1.5rem',
            borderRadius: '12px',
            border: `1px solid ${COLORS.border}`
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              fontSize: '1rem',
              color: COLORS.text
            }}>
              <input
                type="checkbox"
                name="saveAsFavorite"
                checked={formData.saveAsFavorite}
                onChange={(e) => setFormData(prev => ({ ...prev, saveAsFavorite: e.target.checked }))}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: COLORS.primary,
                  cursor: 'pointer'
                }}
              />
              <span>
                ⭐ Save this route as Favorite
              </span>
            </label>
            <p style={{
              fontSize: '0.875rem',
              color: COLORS.textMuted,
              marginTop: '0.5rem',
              marginLeft: '2.75rem'
            }}>
              Quick access to your frequently traveled routes
            </p>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '1rem',
              backgroundColor: loading ? COLORS.surfaceLight : COLORS.primary,
              border: 'none',
              borderRadius: '8px',
              color: loading ? COLORS.textMuted : COLORS.background,
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Creating...' : 'Create Co-Passenger Announcement'}
          </motion.button>
        </form>
      </motion.div>

      {/* Map Modal */}
      {showMapModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '800px',
            height: '85vh',
            maxHeight: '700px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#1f2937', 
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                Select {mapModalType === 'startLocation' ? 'Starting Location' : 'Destination'}
              </h3>
              <button
                onClick={() => setShowMapModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  color: '#6b7280',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Search Bar */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={handleSearch}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3b82f6';
                  }}
                >
                  <FaSearch />
                  Search
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div style={{
              flex: 1,
              position: 'relative',
              backgroundColor: '#f3f4f6'
            }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler />
                {selectedLocation.lat && selectedLocation.lng && (
                  <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                )}
              </MapContainer>
            </div>

            {/* Location Preview */}
            <div style={{
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#374151',
                minHeight: '2.5rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                {selectedLocation.name || 'Click on the map to select a location'}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowMapModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedLocation.name) {
                    handleLocationSelect(selectedLocation);
                  } else {
                    alert('Please select a location on the map');
                  }
                }}
                disabled={!selectedLocation.name}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: selectedLocation.name ? '#3b82f6' : '#9ca3af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: selectedLocation.name ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedLocation.name) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLocation.name) {
                    e.target.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAnnouncement;
