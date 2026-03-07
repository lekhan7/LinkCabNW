import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { userService, authAPI } from '../services/api';
import Avatar from '../components/Avatar';
import { FaCamera, FaStar, FaCheckCircle, FaMapMarkerAlt, FaLightbulb } from 'react-icons/fa';
import { config } from '../config/env.js';
import { useSimpleAuth } from '../hooks/useSimpleAuth';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsData, setReviewsData] = useState({ averageRating: 0, totalReviews: 0, reviews: [] });
  const [editing, setEditing] = useState(false);
  const [editingPlaces, setEditingPlaces] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: ''
  });
  const [placesInput, setPlacesInput] = useState('');
  const [preferredPlaces, setPreferredPlaces] = useState([]);
  const { user } = useSimpleAuth();

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        if (!user?.id) return;
        setReviewsLoading(true);
        const response = await userService.getUserReviews(user.id);
        if (response?.success) {
          setReviewsData({
            averageRating: response.averageRating || 0,
            totalReviews: response.totalReviews || 0,
            reviews: response.reviews || []
          });
        }
      } catch (error) {
        console.error('Failed to fetch user reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [user?.id]);

  const fetchProfileData = async () => {
    try {
      // Use authAPI to get profile data (not updateProfile)
      if (!user) {
        // Don't show error, just wait for user data to load
        return;
      }
      
      // Get fresh profile data from backend using authAPI
      const response = await authAPI.getProfile();
      if (response?.success && response?.data) {
        setProfileData(response.data);
        setFormData({
          name: response.data.name || '',
          phoneNumber: response.data.phone_number || ''
        });
        
        // Fetch preferred places
        const places = response.data.preferredTravelPlaces || [];
        setPreferredPlaces(places);
        setPlacesInput(places.join(', '));
      } else {
        // Fallback to localStorage data if API fails
        setProfileData(user);
        setFormData({
          name: user.name || '',
          phoneNumber: user.phone_number || ''
        });
        
        const places = user.preferredTravelPlaces || [];
        setPreferredPlaces(places);
        setPlacesInput(places.join(', '));
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      // Fallback to localStorage data
      if (user) {
        setProfileData(user);
        setFormData({
          name: user.name || '',
          phoneNumber: user.phone_number || ''
        });
        
        const places = user.preferredTravelPlaces || [];
        setPreferredPlaces(places);
        setPlacesInput(places.join(', '));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Reset form data
      setFormData({
        name: profileData.name,
        phoneNumber: profileData.phone_number
      });
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    try {
      // In a real app, you'd update the profile via API
      alert('Profile updated successfully!');
      setEditing(false);
      setProfileData(prev => ({ ...prev, ...formData }));
    } catch (error) {
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlacesEditToggle = () => {
    if (editingPlaces) {
      // Reset places input
      setPlacesInput(preferredPlaces.join(', '));
    }
    setEditingPlaces(!editingPlaces);
  };

  const handlePlacesSave = async () => {
    try {
      // Parse the input string into an array of places
      const places = placesInput
        .split(',')
        .map(place => place.trim())
        .filter(place => place.length > 0);
      
      // Update user profile with preferred places
      await userService.updateProfile({ preferredTravelPlaces: places });
      
      setPreferredPlaces(places);
      setEditingPlaces(false);
      
      // Update local user data
      if (profileData) {
        setProfileData(prev => ({ ...prev, preferredTravelPlaces: places }));
      }
      
      alert('Preferred travel places updated successfully!');
    } catch (error) {
      console.error('Failed to update preferred places:', error);
      alert('Failed to update preferred places: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleProfilePhotoUpdate = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and WEBP files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);

      // Use the correct API endpoint
      const response = await userService.updateProfilePhoto(formData);

      if (response?.success) {
        const newPhotoUrl = response.profilePicture;
        
        // Update local state
        setProfileData(prev => ({ ...prev, profilePicture: newPhotoUrl }));
        
        // Update localStorage user data if needed
        if (user) {
          const updatedUser = { ...user, profile_picture: newPhotoUrl };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        alert('Profile photo updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update profile photo');
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
      alert('Failed to update profile photo: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoClick = () => {
    if (editing) {
      fileInputRef.current?.click();
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} style={{ color: COLORS.primary }} />
        ))}
        {hasHalfStar && <FaStar style={{ color: COLORS.primary }} />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaStar key={`empty-${i}`} style={{ color: COLORS.border }} />
        ))}
      </div>
    );
  };

  if (loading || !user) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.textSecondary
      }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: `4px solid ${COLORS.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}
        />
        Loading profile...
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.textSecondary
      }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: `4px solid ${COLORS.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}
        />
        Loading profile information...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: COLORS.primary,
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Profile
        </h1>
        <p style={{ 
          color: COLORS.textSecondary,
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          Manage your account information and preferences
        </p>

        {/* Profile Card */}
        <motion.div
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem'
          }}
        >
          {/* Photo at Top */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div onClick={handlePhotoClick} style={{ cursor: editing ? 'pointer' : 'default' }}>
                {profileData.profilePicture ? (
                  <img
                    src={`${config.getBaseUrl()}${profileData.profilePicture}`}
                    alt={profileData.name || 'User avatar'}
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #f3f4f6',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      backgroundColor: '#f3f4f6'
                    }}
                    onError={(e) => {
                      console.error('Image failed to load:', e.target.src);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully');
                    }}
                  />
                ) : null}
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  border: '4px solid #f3f4f6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  backgroundColor: COLORS.primary,
                  color: COLORS.background,
                  display: profileData.profilePicture ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  fontWeight: 'bold'
                }}>
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
              {editing && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePhotoClick}
                  disabled={uploadingPhoto}
                  style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.primary,
                    border: 'none',
                    color: COLORS.background,
                    fontSize: '1.2rem',
                    cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                    opacity: uploadingPhoto ? 0.6 : 1,
                  }}
                >
                  {uploadingPhoto ? <FaCamera /> : <FaCamera />}
                </motion.button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleProfilePhotoUpdate(file);
                  }
                }}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Name and Verification Below Photo */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {editing ? (
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  padding: '0.75rem',
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text,
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}
              />
            ) : (
              <h2 style={{ 
                color: COLORS.text, 
                fontSize: '1.8rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                {profileData.name}
              </h2>
            )}
            
            {/* Phone Number */}
            <p style={{ 
              color: COLORS.textSecondary,
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              <FaCamera style={{ marginRight: '0.5rem', color: COLORS.textSecondary }} /> {profileData.phone_number}
            </p>

            {/* Verification Badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {profileData.isPhoneVerified && (
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: COLORS.success,
                  color: COLORS.background,
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  <FaCheckCircle style={{ marginRight: '0.25rem' }} /> Phone Verified
                </span>
              )}
            </div>

            {/* Edit Button */}
            <div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={editing ? handleSave : handleEditToggle}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: editing ? COLORS.success : COLORS.primary,
                  border: 'none',
                  borderRadius: '8px',
                  color: COLORS.background,
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                {editing ? 'Save' : 'Edit Profile'}
              </motion.button>
            </div>
          </div>

          {/* Stats Section - Removed Online/Offline Status */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            padding: '1.5rem',
            backgroundColor: COLORS.background,
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                color: COLORS.primary, 
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {profileData.averageRating?.toFixed(1) || '0.0'}
              </div>
              <div style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                Average Rating
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem' }}>
                {renderStars(profileData.averageRating || 0)}
              </div>
              <div style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                Star Rating
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                color: COLORS.primary, 
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                {reviewsData.totalReviews || 0}
              </div>
              <div style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                Total Reviews
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preferred Travel Places */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ 
              color: COLORS.text, 
              fontSize: '1.3rem',
              fontWeight: '600',
              margin: 0
            }}>
              Preferred / Frequent Travel Places
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={editingPlaces ? handlePlacesSave : handlePlacesEditToggle}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: editingPlaces ? COLORS.success : COLORS.primary,
                border: 'none',
                borderRadius: '6px',
                color: COLORS.background,
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              {editingPlaces ? 'Save' : 'Edit'}
            </motion.button>
          </div>
          
          {editingPlaces ? (
            <div>
              <textarea
                value={placesInput}
                onChange={(e) => setPlacesInput(e.target.value)}
                placeholder="Enter places separated by commas (e.g., Madikeri, Mangalore, Mysore, Goa)"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  color: COLORS.text,
                  fontSize: '1rem',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{
                color: COLORS.textSecondary,
                fontSize: '0.85rem',
                marginTop: '0.5rem',
                margin: 0
              }}>
                <FaLightbulb style={{ marginRight: '0.5rem', color: COLORS.primary }} /> Enter multiple places separated by commas. You'll get notifications when others announce trips to these destinations.
              </p>
            </div>
          ) : (
            <div>
              {preferredPlaces.length > 0 ? (
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem' 
                }}>
                  {preferredPlaces.map((place, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '20px',
                        color: COLORS.text,
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: COLORS.primary }} />{place}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '1rem',
                  backgroundColor: COLORS.background,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: COLORS.textSecondary,
                    margin: 0,
                    fontSize: '0.9rem'
                  }}>
                    No preferred places added yet. Click Edit to add your frequent travel destinations.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem'
          }}
        >
          <h3 style={{ 
            color: COLORS.text, 
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Account Information
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '0.75rem',
              backgroundColor: COLORS.background,
              borderRadius: '8px'
            }}>
              <span style={{ color: COLORS.textSecondary }}>Member Since</span>
              <span style={{ color: COLORS.text }}>
                {new Date(profileData.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '0.75rem',
              backgroundColor: COLORS.background,
              borderRadius: '8px'
            }}>
              <span style={{ color: COLORS.textSecondary }}>Last Active</span>
              <span style={{ color: COLORS.text }}>
                {new Date(profileData.lastActive).toLocaleDateString()}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '0.75rem',
              backgroundColor: COLORS.background,
              borderRadius: '8px'
            }}>
              <span style={{ color: COLORS.textSecondary }}>Account Type</span>
              <span style={{ color: COLORS.text }}>
                {profileData.verified ? 'Verified' : 'Basic'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '2rem'
          }}
        >
          <h3 style={{
            color: COLORS.text,
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            ⭐ Ratings & Reviews
          </h3>

          {reviewsLoading ? (
            <div style={{ 
              textAlign: 'center',
              padding: '2rem',
              color: COLORS.textSecondary 
            }}>
              Loading reviews...
            </div>
          ) : (
            <>
              {/* Rating Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.background,
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: COLORS.primary, 
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {(reviewsData.averageRating || 0).toFixed(1)}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    {renderStars(reviewsData.averageRating || 0)}
                  </div>
                  <div style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                    Average Rating
                  </div>
                </div>
                <div style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.background,
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: COLORS.primary, 
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    {reviewsData.totalReviews || 0}
                  </div>
                  <div style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                    Total Reviews
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              {reviewsData.reviews?.length ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {reviewsData.reviews.map((r) => (
                    <motion.div
                      key={r._id}
                      whileHover={{ scale: 1.01 }}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.background,
                        transition: 'all 0.3s'
                      }}
                    >
                      {/* Review Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '1rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: COLORS.primary,
                            color: COLORS.background,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                          }}>
                            {(r.reviewer?.name || 'User').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ 
                              color: COLORS.text, 
                              fontWeight: '600',
                              fontSize: '1rem'
                            }}>
                              {r.reviewer?.name || 'User'}
                            </div>
                            <div style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ color: COLORS.primary }}>
                            {renderStars(Number(r.rating || 0))}
                          </div>
                          <span style={{ 
                            color: COLORS.textSecondary, 
                            fontWeight: '600',
                            fontSize: '0.9rem'
                          }}>
                            {Number(r.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Review Content */}
                      <div style={{ 
                        color: COLORS.textSecondary,
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        marginBottom: '1rem'
                      }}>
                        {r.feedback}
                      </div>

                      {/* Ride Info */}
                      {r.ride && (
                        <div style={{
                          padding: '0.75rem',
                          backgroundColor: COLORS.surface,
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: COLORS.textMuted
                        }}>
                          🚗 {r.ride.startLocation?.name || 'From'} → {r.ride.destination?.name || 'To'}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: '3rem',
                  color: COLORS.textSecondary,
                  fontSize: '1.1rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                  No reviews yet. Be the first to share your experience!
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Legal & Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '2rem'
          }}
        >
          <h3 style={{ 
            color: COLORS.text, 
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Legal & Support
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/privacy-policy'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <span>Privacy Policy</span>
              <span style={{ color: COLORS.textSecondary }}>→</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/terms-and-conditions'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.text,
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <span>Terms and Conditions</span>
              <span style={{ color: COLORS.textSecondary }}>→</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/emergency-support'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '8px',
                color: COLORS.error,
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <span>Disclaimer</span>
              <span style={{ color: COLORS.error }}>→</span>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      
    </div>
  );
};

export default Profile;
