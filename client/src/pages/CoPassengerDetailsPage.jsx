import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useToast } from '../hooks/useToast';
import { announcementAPI, userAPI, ratingAPI, rideCompletionAPI, reviewAPI } from '../services/api';
import ReviewModal from '../components/ReviewModal';
import { 
  FaUsers, FaUserCheck, FaUserClock, FaUserTimes, FaStar, FaMapMarkerAlt, 
  FaCalendar, FaClock, FaFilter, FaArrowLeft, FaEye, FaCar, FaRupeeSign,
  FaUserCircle, FaCheckCircle
} from 'react-icons/fa';

const CoPassengerDetailsPage = () => {
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  const { success, error } = useToast();

  const [announcement, setAnnouncement] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userRatings, setUserRatings] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewableUsers, setReviewableUsers] = useState([]);

  useEffect(() => {
    if (announcementId && user) {
      fetchAnnouncementData();
    }
  }, [announcementId, user]);

  // Check if ride time has passed (for Complete Ride button)
  const isRideTimePassed = (date, time) => {
    if (!date || !time) return false;
    
    const rideDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    return rideDateTime <= now;
  };

  // Check if user can complete the ride
  const canCompleteRide = (announcement) => {
    return (
      !announcement.ride_completed && 
      isRideTimePassed(announcement.date, announcement.time) &&
      announcement.created_by?.id === user?.id
    );
  };

  const fetchAnnouncementData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Fetching announcement data for:', announcementId);
      
      // Fetch announcement details with ownership validation
      const announcementResponse = await announcementAPI.getAnnouncementById(announcementId);
      const announcementData = announcementResponse.data;
      
      console.log('📋 Announcement response:', announcementData);
      
      // Validate ownership
      if (announcementData.created_by?.id !== user.id) {
        error('You do not have permission to manage this announcement');
        navigate('/co-passenger-management');
        return;
      }
      
      setAnnouncement(announcementData);
      
      // Fetch participants for this announcement
      const participantsResponse = await announcementAPI.getAnnouncementParticipants(announcementId);
      const participantsData = participantsResponse.data || [];
      
      console.log('👥 Participants response:', participantsData);
      
      // Log each participant's user data for debugging
      const participantsWithUserData = await Promise.all(
        participantsData.map(async (participant, index) => {
          console.log(`👤 Participant ${index + 1}:`, {
            participant_id: participant.id,
            user_id: participant.user_id,
            status: participant.status,
            user_data: participant.user,
            user_name: participant.user?.name,
            user_phone: participant.user?.phone_number,
            user_email: participant.user?.email,
            completed_trips: participant.user?.completed_trips,
            total_trips: participant.user?.total_trips,
            is_phone_verified: participant.user?.is_phone_verified
          });
          
          // Debug if user data is missing
          if (!participant.user) {
            console.error(`❌ MISSING USER DATA for participant ${participant.id} (user_id: ${participant.user_id})`);
            console.log(`🔄 Fetching user data manually for ${participant.user_id}...`);
            
            try {
              const userResponse = await userAPI.getUserById(participant.user_id);
              console.log(`✅ Fetched user data:`, userResponse.data);
              
              return {
                ...participant,
                user: userResponse.data
              };
            } catch (err) {
              console.error(`❌ Failed to fetch user data for ${participant.user_id}:`, err);
              return participant;
            }
          }
          
          return participant;
        })
      );
      
      console.log(`📤 Final participants data:`, participantsWithUserData);
      setParticipants(participantsWithUserData);
      
      // Skip ratings fetching for now to avoid database issues
      // const ratingsPromises = participantsData.map(async (participant) => {
      //   if (participant.user_id) {
      //     try {
      //       const ratingResponse = await ratingAPI.getUserRatings(participant.user_id);
      //       console.log(`⭐ Ratings for user ${participant.user_id}:`, ratingResponse.data);
      //       return { userId: participant.user_id, ratings: ratingResponse.data || [] };
      //     } catch (err) {
      //       console.error(`Error fetching ratings for user ${participant.user_id}:`, err);
      //       return { userId: participant.user_id, ratings: [] };
      //     }
      //   }
      //   return null;
      // });
      
      // const ratingsResults = await Promise.all(ratingsPromises);
      // const ratingsMap = {};
      // ratingsResults.forEach(result => {
      //   if (result) {
      //     ratingsMap[result.userId] = result.ratings;
      //   }
      // });
      // setUserRatings(ratingsMap);
      
      // Set empty ratings for now
      setUserRatings({});
      
    } catch (err) {
      console.error('❌ Error fetching announcement data:', err);
      if (err.status === 404) {
        error('Announcement not found');
      } else if (err.status === 403) {
        error('You do not have permission to access this announcement');
      } else {
        error('Failed to load announcement data');
      }
      navigate('/co-passenger-management');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'rejected': return COLORS.error;
      case 'requested': return COLORS.info;
      case 'completed': return COLORS.textMuted;
      default: return COLORS.textMuted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <FaUserCheck />;
      case 'pending': return <FaUserClock />;
      case 'rejected': return <FaUserTimes />;
      case 'requested': return <FaUserClock />;
      case 'completed': return <FaUserCheck />;
      default: return <FaUserCircle />;
    }
  };

  const filteredParticipants = participants.filter(participant => {
    if (filterStatus === 'all') return true;
    return participant.status === filterStatus;
  });

  const getStatusCounts = () => {
    const counts = {
      total: participants.length,
      accepted: participants.filter(p => p.status === 'accepted').length,
      pending: participants.filter(p => p.status === 'pending').length,
      rejected: participants.filter(p => p.status === 'rejected').length,
      requested: participants.filter(p => p.status === 'requested').length,
      completed: participants.filter(p => p.status === 'completed').length
    };
    return counts;
  };

  const handleViewProfile = async (participant) => {
    try {
      console.log('🔍 Fetching profile for participant:', participant);
      console.log('👤 Participant user data:', participant.user);
      
      // Use the user data that's already available from the participants API
      if (participant.user) {
        setSelectedUser({
          ...participant.user,
          participant_status: participant.status,
          joined_at: participant.joined_at
        });
        setShowProfileModal(true);
      } else {
        // Fallback: fetch user data if not available
        console.log('⚠️ User data not available, fetching from API...');
        const userResponse = await userAPI.getUserById(participant.user_id);
        console.log('📤 User API response:', userResponse);
        
        setSelectedUser({
          ...userResponse.data,
          participant_status: participant.status,
          joined_at: participant.joined_at
        });
        setShowProfileModal(true);
      }
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      error('Failed to load user profile');
    }
  };

  const calculateUserRating = (userId) => {
    const ratings = userRatings[userId] || [];
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const handleCompleteRide = async (announcementId, completionType = 'creator') => {
    try {
      const response = await rideCompletionAPI.completeRide(announcementId, { completionType });
      success(response.message || 'Ride completion recorded successfully');
      
      // Refresh data
      fetchAnnouncementData();
      
      // Fetch reviewable users and show review modal if ride is ready for reviews
      if (response.data.completion_status === 'pending_completion' || response.data.completion_status === 'completed') {
        try {
          const reviewableResponse = await reviewAPI.getReviewableUsers(announcementId);
          setReviewableUsers(reviewableResponse.data.users || []);
          setShowReviewModal(true);
        } catch (reviewError) {
          console.error('Error fetching reviewable users:', reviewError);
        }
      }
    } catch (err) {
      console.error('Error completing ride:', err);
      error(err.message || 'Failed to complete ride');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await reviewAPI.submitReview(reviewData);
      success('Review submitted successfully!');
      setShowReviewModal(false);
      setReviewableUsers([]);
    } catch (err) {
      console.error('Error submitting review:', err);
      error(err.message || 'Failed to submit review');
    }
  };

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
        <div>Loading announcement details...</div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: COLORS.text 
      }}>
        <div>Announcement not found</div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}
      >
        <button
          onClick={() => navigate('/co-passenger-management')}
          style={{
            backgroundColor: 'transparent',
            color: COLORS.primary,
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}
        >
          <FaArrowLeft />
          Back to Co-Passenger Management
        </button>

        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: COLORS.text,
          marginBottom: '0.5rem'
        }}>
          <FaUsers style={{ marginRight: '0.5rem', color: COLORS.primary }} />
          Announcement Details
        </h1>
        <p style={{ color: COLORS.textMuted }}>
          Manage co-passenger requests for this announcement
        </p>
      </motion.div>

      {/* Announcement Summary Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: COLORS.text,
          marginBottom: '1.5rem'
        }}>
          Announcement Information
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem'
            }}>
              Route
            </h4>
            <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <FaMapMarkerAlt style={{ color: COLORS.primary }} />
                <span>{announcement.start_location_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaMapMarkerAlt style={{ color: COLORS.error }} />
                <span>{announcement.destination_name}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem'
            }}>
              Schedule
            </h4>
            <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <FaCalendar style={{ color: COLORS.primary }} />
                <span>{new Date(announcement.date).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaClock style={{ color: COLORS.primary }} />
                <span>{announcement.time}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem'
            }}>
              Details
            </h4>
            <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <FaCar style={{ color: COLORS.primary }} />
                <span>{announcement.vehicle_type}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaRupeeSign style={{ color: COLORS.primary }} />
                <span>{announcement.price}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '0.5rem'
            }}>
              Capacity
            </h4>
            <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
              <p>{statusCounts.accepted} / {announcement.passenger_capacity} seats filled</p>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: COLORS.surfaceLight,
                borderRadius: '4px',
                marginTop: '0.5rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(statusCounts.accepted / announcement.passenger_capacity) * 100}%`,
                  height: '100%',
                  backgroundColor: COLORS.primary,
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Requests Statistics Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '0.75rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: COLORS.text,
          marginBottom: '1.5rem'
        }}>
          Co-Passenger Statistics
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: COLORS.surfaceLight,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '0.5rem' }}>
              {statusCounts.total}
            </div>
            <div style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
              Total Requests
            </div>
          </div>
          
          <div style={{
            backgroundColor: COLORS.surfaceLight,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.success, marginBottom: '0.5rem' }}>
              {statusCounts.accepted}
            </div>
            <div style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
              Accepted
            </div>
          </div>
          
          <div style={{
            backgroundColor: COLORS.surfaceLight,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.warning, marginBottom: '0.5rem' }}>
              {statusCounts.pending}
            </div>
            <div style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
              Pending
            </div>
          </div>
          
          <div style={{
            backgroundColor: COLORS.surfaceLight,
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.error, marginBottom: '0.5rem' }}>
              {statusCounts.rejected}
            </div>
            <div style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
              Rejected
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaFilter style={{ color: COLORS.primary }} />
          <span style={{ fontSize: '0.875rem', color: COLORS.text, marginRight: '0.5rem' }}>Filter:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              backgroundColor: COLORS.surface
            }}
          >
            <option value="all">Show All ({statusCounts.total})</option>
            <option value="accepted">Accepted ({statusCounts.accepted})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="rejected">Rejected ({statusCounts.rejected})</option>
            <option value="requested">Requested ({statusCounts.requested})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
          </select>
        </div>
      </motion.div>

      {/* Complete Ride Button - Only show after ride time has passed */}
      {canCompleteRide(announcement) && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '0.75rem',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: COLORS.text,
              marginBottom: '1rem'
            }}>
              Ride Completion
            </h3>
            <p style={{ color: COLORS.textMuted, marginBottom: '1.5rem' }}>
              The ride time has passed. You can now complete this ride and review your co-passengers.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCompleteRide(announcement.id, 'creator')}
              style={{
                backgroundColor: COLORS.success,
                color: '#fff',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              <FaCheckCircle />
              Complete Ride
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Show ride completion status */}
      {announcement.ride_completed && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          style={{
            backgroundColor: COLORS.success,
            color: '#fff',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            textAlign: 'center',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <FaCheckCircle />
          Ride Completed
        </motion.div>
      )}

      {/* Show time remaining until completion is available */}
      {!announcement.ride_completed && !isRideTimePassed(announcement.date, announcement.time) && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          style={{
            backgroundColor: COLORS.surfaceLight,
            color: COLORS.textMuted,
            padding: '1.5rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            border: `1px solid ${COLORS.border}`,
            textAlign: 'center',
            marginBottom: '2rem'
          }}
        >
          <FaClock style={{ marginRight: '0.5rem' }} />
          Complete Ride button will be available after {announcement.time} on {new Date(announcement.date).toLocaleDateString()}
        </motion.div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewableUsers([]);
        }}
        announcementId={announcementId}
        reviewableUsers={reviewableUsers}
        onSubmitReview={handleSubmitReview}
        currentUser={user}
      />

      {/* Co-Passenger Profiles Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: COLORS.text,
          marginBottom: '1.5rem'
        }}>
          Co-Passenger Profiles
        </h2>
        
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredParticipants.length === 0 ? (
            <motion.div
              variants={itemVariants}
              style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: COLORS.surfaceLight,
                borderRadius: '0.75rem',
                color: COLORS.textMuted
              }}
            >
              <FaUsers style={{ fontSize: '3rem', marginBottom: '1rem' }} />
              <h3>No co-passengers found</h3>
              <p>
                {filterStatus === 'all' 
                  ? 'No one has requested to join this announcement yet.' 
                  : `No ${filterStatus} requests found.`}
              </p>
            </motion.div>
          ) : (
            filteredParticipants.map((participant) => (
              <motion.div
                key={participant.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: '#000'
                    }}>
                      {participant.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    
                    <div>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600', 
                        color: COLORS.text,
                        marginBottom: '0.5rem'
                      }}>
                        {participant.user?.name || 'Unknown User'}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <p style={{ color: COLORS.textMuted, fontSize: '0.875rem', margin: 0 }}>
                          📱 {participant.user?.phone_number || 'N/A'}
                        </p>
                        <p style={{ color: COLORS.textMuted, fontSize: '0.875rem', margin: 0 }}>
                          ✉️ {participant.user?.email || 'N/A'}
                        </p>
                        <p style={{ color: COLORS.textMuted, fontSize: '0.875rem', margin: 0 }}>
                          🚗 Completed Trips: {participant.user?.completed_trips || '0'}
                        </p>
                        <p style={{ color: COLORS.textMuted, fontSize: '0.875rem', margin: 0 }}>
                          📊 Total Trips: {participant.user?.total_trips || '0'}
                        </p>
                        <p style={{ color: COLORS.textMuted, fontSize: '0.875rem', margin: 0 }}>
                          ✅ Phone Verified: {participant.user?.is_phone_verified ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      backgroundColor: getStatusColor(participant.status),
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getStatusIcon(participant.status)}
                      {participant.status}
                    </div>
                    
                    <button
                      onClick={() => handleViewProfile(participant)}
                      style={{
                        backgroundColor: COLORS.primary,
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      <FaEye />
                      View Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedUser && (
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
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: '1rem',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowProfileModal(false)}
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

              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#000',
                  margin: '0 auto 1rem'
                }}>
                  {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: 'bold', 
                  color: COLORS.text,
                  marginBottom: '0.5rem'
                }}>
                  {selectedUser.name}
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    backgroundColor: getStatusColor(selectedUser.participant_status),
                    color: '#fff',
                    padding: '0.25rem 1rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    textTransform: 'capitalize'
                  }}>
                    {selectedUser.participant_status}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: COLORS.text
                  }}>
                    <FaStar style={{ color: COLORS.primary }} />
                    {calculateUserRating(selectedUser.id)} ⭐
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: '0.5rem'
                  }}>
                    Contact Information
                  </h4>
                  <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                    <p><strong>Phone:</strong> {selectedUser.phone_number}</p>
                    <p><strong>Code:</strong> {selectedUser.code_number}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: '0.5rem'
                  }}>
                    Statistics
                  </h4>
                  <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                    <p><strong>Completed Trips:</strong> {selectedUser.completed_trips || 0}</p>
                    <p><strong>Total Trips:</strong> {selectedUser.total_trips || 0}</p>
                    <p><strong>Average Rating:</strong> {selectedUser.average_rating || '0.00'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: '0.5rem'
                  }}>
                    Account Status
                  </h4>
                  <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                    <p><strong>Verified:</strong> {selectedUser.verified ? 'Yes' : 'No'}</p>
                    <p><strong>Phone Verified:</strong> {selectedUser.is_phone_verified ? 'Yes' : 'No'}</p>
                    <p><strong>Premium:</strong> {selectedUser.is_premium ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: '0.5rem'
                  }}>
                    Request Details
                  </h4>
                  <div style={{ color: COLORS.textMuted, lineHeight: '1.6' }}>
                    <p><strong>Joined:</strong> {new Date(selectedUser.joined_at).toLocaleDateString()}</p>
                    <p><strong>Member Since:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    <p><strong>Last Active:</strong> {new Date(selectedUser.last_active).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {userRatings[selectedUser.id]?.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: '1rem'
                  }}>
                    Recent Reviews
                  </h4>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {userRatings[selectedUser.id].slice(0, 3).map((rating, index) => (
                      <div key={index} style={{
                        backgroundColor: COLORS.surfaceLight,
                        padding: '1rem',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {[...Array(5)].map((_, i) => (
                              <FaStar 
                                key={i} 
                                style={{ 
                                  color: i < rating.stars ? COLORS.primary : COLORS.textMuted,
                                  fontSize: '0.875rem'
                                }} 
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.review && (
                          <p style={{ fontSize: '0.875rem', color: COLORS.text, fontStyle: 'italic' }}>
                            "{rating.review}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoPassengerDetailsPage;
