import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map click events
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
    },
  });
  return null;
};

// Component to handle map operations (panning, etc.)
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  
  return null;
};

const MapPicker = ({ isOpen, onClose, onConfirm, initialLocation = null, title }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);

  // Forward geocoding using Nominatim (FREE)
  const forwardGeocode = async (query) => {
    setSearchLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'User-Agent': 'LinkCab-App' // Required by Nominatim usage policy
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to search location');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        
        // Update map center and zoom
        setMapCenter([location.lat, location.lng]);
        setMapZoom(15);
        
        // Select the location
        handleLocationSelect(location);
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      forwardGeocode(searchQuery.trim());
    }
  };

  // Reverse geocoding using Nominatim (FREE)
  const reverseGeocode = async (lat, lng) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LinkCab-App' // Required by Nominatim usage policy
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress('Location selected (address not found)');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to get address. Please try again.');
      setAddress('Location selected');
    } finally {
      setLoading(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    reverseGeocode(location.lat, location.lng);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedLocation && address) {
      onConfirm({
        name: address,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng
      });
      onClose();
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(initialLocation);
      setSearchQuery('');
      setError('');
      
      if (initialLocation && initialLocation.lat !== 0) {
        setMapCenter([initialLocation.lat, initialLocation.lng]);
        setMapZoom(15);
        reverseGeocode(initialLocation.lat, initialLocation.lng);
      } else {
        setMapCenter([20.5937, 78.9629]); // Center of India
        setMapZoom(13);
        setAddress('');
      }
    }
  }, [isOpen, initialLocation]);

  if (!isOpen) return null;

  return (
    <div
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
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          backgroundColor: COLORS.surface,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          overflowY: 'auto',
          flex: 1
        }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: COLORS.text,
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: COLORS.textSecondary,
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${COLORS.border}`
        }}>
          <form onSubmit={handleSearch} style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location (city, area, place name)"
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '0.9rem'
              }}
            />
            <motion.button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              whileHover={{ scale: searchLoading || !searchQuery.trim() ? 1 : 1.02 }}
              whileTap={{ scale: searchLoading || !searchQuery.trim() ? 1 : 0.98 }}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: searchLoading || !searchQuery.trim() ? COLORS.surfaceLight : COLORS.primary,
                border: 'none',
                borderRadius: '8px',
                color: searchLoading || !searchQuery.trim() ? COLORS.textMuted : COLORS.background,
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: searchLoading || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </motion.button>
          </form>
        </div>

        {/* Map Container */}
        <div style={{
          height: '400px',
          position: 'relative'
        }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapController center={mapCenter} zoom={mapZoom} />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  Selected Location
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Address Display */}
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${COLORS.border}`
        }}>
          <div style={{
            fontSize: '0.9rem',
            color: COLORS.textSecondary,
            marginBottom: '0.5rem'
          }}>
            Selected Address:
          </div>
          {loading ? (
            <div style={{ color: COLORS.primary }}>Loading address...</div>
          ) : error ? (
            <div style={{ color: '#ef4444' }}>{error}</div>
          ) : (
            <div style={{
              color: COLORS.text,
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              {address || 'Click on the map to select a location'}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          padding: '1rem',
          backgroundColor: COLORS.background,
          fontSize: '0.9rem',
          color: COLORS.textSecondary
        }}>
          💡 Click on the map or search for a location to select
        </div>

        {/* Actions */}
        <div style={{
          padding: '1.5rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            onClick={handleConfirm}
            disabled={!selectedLocation || !address || loading}
            whileHover={{ scale: selectedLocation && address && !loading ? 1.02 : 1 }}
            whileTap={{ scale: selectedLocation && address && !loading ? 0.98 : 1 }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: selectedLocation && address && !loading ? COLORS.primary : COLORS.surfaceLight,
              border: 'none',
              borderRadius: '8px',
              color: selectedLocation && address && !loading ? COLORS.background : COLORS.textMuted,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: selectedLocation && address && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s'
            }}
          >
            Confirm Location
          </motion.button>
        </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MapPicker;
