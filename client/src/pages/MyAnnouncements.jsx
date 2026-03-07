import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { useSimpleAuth } from '../hooks/useSimpleAuth';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { FaBullhorn, FaClock, FaUsers, FaUserCheck, FaUserTimes, FaHourglassHalf, FaPlus, FaInfoCircle, FaSearch, FaFilter, FaTrash, FaTimes, FaCar, FaCheckCircle } from 'react-icons/fa';
import { announcementAPI, userAPI, rideCompletionAPI, reviewAPI } from '../services/api';
import ReviewModal from '../components/ReviewModal';
import socket, { setAnnouncementUpdateHandler } from '../utils/socket';

const MyAnnouncements = () => {
  const { user } = useSimpleAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [myRides, setMyRides] = useState([]);
  const [goingRides, setGoingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [activeTab, setActiveTab] = useState('my-rides');
  const [completionStatuses, setCompletionStatuses] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewableUsers, setReviewableUsers] = useState([]);
  
  // Separate states for different participation statuses
  const [requestedRides, setRequestedRides] = useState([]);
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [rejectedRides, setRejectedRides] = useState([]);

  // Check if ride time has passed (for Complete Ride button)
  const isRideTimePassed = (date, time) => {
    if (!date || !time) return false;
    
    const rideDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    return rideDateTime <= now;
  };

  // Check if user can complete the ride
  const canCompleteRide = (announcement) => {
    const isCreator = announcement.created_by?.id === user?.id;
    const isAcceptedParticipant = announcement.myParticipantStatus === 'accepted';
    const timePassed = isRideTimePassed(announcement.date, announcement.time);
    
    console.log('🔍 Can complete ride check:', {
      isCreator,
      isAcceptedParticipant,
      timePassed,
      rideCompleted: announcement.ride_completed,
      announcementId: announcement.id
    });
    
    // For creators: can complete if time passed and not already completed
    if (isCreator) {
      return timePassed && !announcement.ride_completed;
    }
    
    // For co-passengers: can complete if time passed (regardless of creator completion status)
    if (isAcceptedParticipant) {
      return timePassed;
    }
    
    return false;
  };

  useEffect(() => {
    fetchMyAnnouncements();
  }, [user]);

  // Set up real-time updates
  useEffect(() => {
    if (user) {
      // Listen for announcement updates
      setAnnouncementUpdateHandler((data) => {
        console.log('📡 Real-time announcement update in MyAnnouncements:', data);
        fetchMyAnnouncements(); // Refresh the data
      });
      
      // Make fetchMyAnnouncements available globally
      window.refreshMyAnnouncements = fetchMyAnnouncements;
      
      return () => {
        setAnnouncementUpdateHandler(null);
      };
    }
  }, [user]);

  const fetchMyAnnouncements = async () => {
    try {
      setLoading(true);
      
      // Fetch rides created by user (My Rides)
      const myRidesResponse = await announcementAPI.getMyAnnouncements({ limit: 50 });
      const myRidesData = myRidesResponse.data || [];
      
      // Transform and set my rides
      const transformedMyRides = myRidesData.map(announcement => ({
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
        views: announcement.views || 0,
        price: announcement.price,
        vehicle_type: announcement.vehicle_type,
        created_by: announcement.created_by,
        requesters: (announcement.joinedBy || []).map(req => ({
          id: req.id,
          user_id: req.user_id,
          name: req.user?.name || 'User',
          email: req.user?.email || '',
          phone: req.user?.phone_number || '',
          status: req.status,
          requested_at: req.created_at,
          average_rating: req.user?.average_rating,
          completed_trips: req.user?.completed_trips
        }))
      }));
      
      setMyRides(transformedMyRides);
      
      // Fetch rides user joined as participant (Going Rides) - Get ALL statuses
      let transformedGoingRides = [];
      let requested = [];
      let accepted = [];
      let rejected = [];
      
      try {
        const goingRidesResponse = await announcementAPI.getGoingRides({ limit: 100 });
        const goingRidesData = goingRidesResponse.data || [];
        
        // Transform and categorize rides by status
        transformedGoingRides = goingRidesData.map(announcement => ({
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
          views: announcement.views || 0,
          price: announcement.price,
          vehicle_type: announcement.vehicle_type,
          created_by: announcement.created_by,
          creator_name: announcement.created_by?.name || announcement.created_by_user?.name || 'Unknown',
          myParticipantStatus: announcement.my_participant_status || 'pending',
          joined_at: announcement.joined_at
        }));
        
        // Categorize rides by participation status
        requested = transformedGoingRides.filter(ride => ride.myParticipantStatus === 'pending' || ride.myParticipantStatus === 'requested');
        accepted = transformedGoingRides.filter(ride => ride.myParticipantStatus === 'accepted');
        rejected = transformedGoingRides.filter(ride => ride.myParticipantStatus === 'rejected');
        
        console.log('🔍 All going rides data:', goingRidesData);
        console.log('🚨 Sample raw announcement:', goingRidesData[0]);
        console.log('🔍 Creator data breakdown:', {
          created_by: goingRidesData[0]?.created_by,
          created_by_user: goingRidesData[0]?.created_by_user,
          creator: goingRidesData[0]?.creator,
          user: goingRidesData[0]?.user
        });
        console.log('📊 Transformed rides:', transformedGoingRides);
        console.log('📋 Categorized - Requested:', requested.length, 'Accepted:', accepted.length, 'Rejected:', rejected.length);
        console.log('🚨 Sample ride data:', transformedGoingRides[0]);
        
        setGoingRides(transformedGoingRides);
        setRequestedRides(requested);
        setAcceptedRides(accepted);
        setRejectedRides(rejected);
        
      } catch (goingRidesError) {
        console.error('Error fetching going rides:', goingRidesError);
        setGoingRides([]);
        setRequestedRides([]);
        setAcceptedRides([]);
        setRejectedRides([]);
      }
      
      // Don't fetch completion statuses - we'll use client-side time checking
      setCompletionStatuses({});
      
    } catch (error) {
      console.error('Error fetching my announcements:', error);
      error('Failed to fetch your announcements');
      setMyRides([]);
      setGoingRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async (announcementId, completionType) => {
    try {
      // First fetch reviewable users and show review modal
      const reviewableResponse = await reviewAPI.getReviewableUsers(announcementId);
      console.log('🔍 Reviewable users response:', reviewableResponse);
      const users = reviewableResponse.users || reviewableResponse.data?.users || [];
      console.log('👥 Extracted users:', users);
      
      if (users.length > 0) {
        // Store the completion data for later use after reviews
        setReviewableUsers(users);
        setSelectedAnnouncement(myRides.find(r => r.id === announcementId) || goingRides.find(r => r.id === announcementId));
        
        // Store completion info to use after reviews are done
        window.pendingCompletion = { announcementId, completionType };
        
        setShowReviewModal(true);
        success('Please complete reviews for all co-passengers first');
      } else {
        // No users to review, complete the ride directly
        const response = await rideCompletionAPI.completeRide(announcementId, { completionType });
        success(response.message || 'Ride completion recorded successfully');
        
        // Update completion status
        setCompletionStatuses(prev => ({
          ...prev,
          [announcementId]: response.data
        }));
        
        // Refresh data
        fetchMyAnnouncements();
      }
    } catch (err) {
      console.error('Error in handleCompleteRide:', err);
      error(err.message || 'Failed to initiate ride completion');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      await reviewAPI.submitReview(reviewData);
      success('Review submitted successfully!');
      
      // Check if there are more users to review
      const remainingUsers = reviewableUsers.filter(u => {
        const userData = u.users || u;
        return userData.id !== reviewData.revieweeId;
      });
      
      if (remainingUsers.length === 0) {
        // All reviews completed, now complete the ride
        console.log('🎉 All reviews completed, completing ride');
        
        if (window.pendingCompletion) {
          const { announcementId, completionType } = window.pendingCompletion;
          
          try {
            const response = await rideCompletionAPI.completeRide(announcementId, { completionType });
            success(response.message || 'Ride completed successfully!');
            
            // Update completion status
            setCompletionStatuses(prev => ({
              ...prev,
              [announcementId]: response.data
            }));
            
            // Refresh data
            fetchMyAnnouncements();
            
            // Clear pending completion
            window.pendingCompletion = null;
            
          } catch (completionError) {
            console.error('Error completing ride after reviews:', completionError);
            error(completionError.message || 'Failed to complete ride');
          }
        }
        
        // Close review modal
        setShowReviewModal(false);
        setReviewableUsers([]);
      } else {
        // Continue with next user
        setReviewableUsers(remainingUsers);
        // Modal will auto-select next user
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      error(err.message || 'Failed to submit review');
    }
  };

  const handleAcceptRequester = async (announcementId, requesterId) => {
    try {
      // Update connection request status in database
      const response = await announcementAPI.respondToJoinRequest(announcementId, requesterId, { action: 'accept' });
      success(response.message || 'Request accepted successfully!');
      fetchMyAnnouncements(); // Refresh data
    } catch (err) {
      console.error('Error accepting requester:', err);
      if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error(err.message || 'Failed to accept request');
      }
    }
  };

  const handleRejectRequester = async (announcementId, requesterId) => {
    try {
      // Update connection request status in database
      const response = await announcementAPI.respondToJoinRequest(announcementId, requesterId, { action: 'reject' });
      success(response.message || 'Request rejected successfully!');
      fetchMyAnnouncements(); // Refresh data
    } catch (err) {
      console.error('Error rejecting requester:', err);
      if (err.status === 500) {
        error('Server error - please try again later');
      } else {
        error(err.message || 'Failed to reject request');
      }
    }
  };

  const handleViewDetails = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedAnnouncement(null);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    try {
      await announcementAPI.deleteAnnouncement(announcementId);
      success('Announcement deleted successfully');
      fetchMyAnnouncements();
      handleCloseModal();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      error(err.message || 'Failed to delete announcement');
    }
  };

  const toggleExpanded = (announcementId) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(announcementId)) {
      newExpanded.delete(announcementId);
    } else {
      newExpanded.add(announcementId);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <FaUserCheck style={{ color: COLORS.success }} />;
      case 'rejected':
        return <FaUserTimes style={{ color: COLORS.error }} />;
      case 'pending':
      case 'requested':
        return <FaHourglassHalf style={{ color: COLORS.warning }} />;
      default:
        return <FaUsers style={{ color: COLORS.textMuted }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'requested':
      case 'pending':
        return COLORS.warning;
      default:
        return COLORS.textMuted;
    }
  };

  // Helper function to render going ride cards
  const renderGoingRideCard = (announcement, status) => {
    console.log('🎨 Rendering ride card:', { id: announcement.id, status, title: announcement.title });
    
    return (
      <div
        key={announcement.id}
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      >
        {/* Status Badge */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: status === 'accepted' ? COLORS.success : 
                           status === 'rejected' ? COLORS.error : COLORS.warning,
          color: '#fff'
        }}>
          {getStatusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>

        <div style={{ flex: 1, paddingRight: '8rem' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: COLORS.text,
            marginBottom: '0.5rem'
          }}>
            {announcement.title}
          </h3>
          <p style={{ color: COLORS.textMuted, marginBottom: '1rem', fontSize: '0.875rem' }}>
            {announcement.description}
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaClock style={{ color: COLORS.primary }} />
              <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                {announcement.date} at {announcement.time}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaUsers style={{ color: COLORS.primary }} />
              <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                {announcement.seatsAvailable}/{announcement.totalSeats} seats
              </span>
            </div>
            
            {announcement.price && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                  ₹{announcement.price}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          fontSize: '0.875rem',
          color: COLORS.text,
          marginBottom: '1rem'
        }}>
          <strong>Route:</strong> {announcement.from} → {announcement.to}
        </div>

        <div style={{ 
          fontSize: '0.875rem',
          color: COLORS.textMuted,
          marginBottom: '1rem'
        }}>
          <strong>Creator:</strong> {announcement.creator_name}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(announcement);
            }}
            style={{
              backgroundColor: 'transparent',
              color: COLORS.primary,
              border: `1px solid ${COLORS.primary}`,
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              flex: 1
            }}
          >
            <FaInfoCircle />
            View Details
          </button>
        </div>

        {/* Complete Ride Button - Only for accepted rides after ride time */}
        {status === 'accepted' && canCompleteRide(announcement) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              onClick={() => handleCompleteRide(announcement.id, 'participant')}
              style={{
                backgroundColor: COLORS.success,
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flex: 1
              }}
            >
              <FaCheckCircle />
              Complete Ride
            </button>
          </div>
        )}

        {/* Show ride completion status */}
        {announcement.ride_completed && (
          <div style={{
            backgroundColor: COLORS.success,
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            textAlign: 'center',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <FaCheckCircle />
            Ride Completed
          </div>
        )}

        {/* Show time remaining until completion is available */}
        {status === 'accepted' && !announcement.ride_completed && !isRideTimePassed(announcement.date, announcement.time) && (
          <div style={{
            backgroundColor: COLORS.surfaceLight,
            color: COLORS.textMuted,
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            border: `1px solid ${COLORS.border}`,
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <FaClock style={{ marginRight: '0.5rem' }} />
            Complete Ride button will be available after {announcement.time} on {new Date(announcement.date).toLocaleDateString()}
          </div>
        )}

        {/* Status-specific messages */}
        {status === 'requested' && (
          <div style={{
            backgroundColor: COLORS.surfaceLight,
            color: COLORS.textMuted,
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            border: `1px solid ${COLORS.border}`,
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <FaHourglassHalf style={{ marginRight: '0.5rem', color: COLORS.warning }} />
            Your request is pending approval from the ride creator
          </div>
        )}

        {status === 'rejected' && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: COLORS.error,
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            border: `1px solid ${COLORS.error}`,
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <FaUserTimes style={{ marginRight: '0.5rem' }} />
            Your request was not accepted for this ride
          </div>
        )}
      </div>
    );
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
        <div>Loading your announcements...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        <div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: COLORS.text,
            marginBottom: '0.5rem'
          }}>
            <FaBullhorn style={{ marginRight: '0.5rem', color: COLORS.primary }} />
            My Announcements
          </h1>
          <p style={{ color: COLORS.textMuted }}>
            Manage your ride announcements and track your journeys
          </p>
          
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginTop: '1rem',
            borderBottom: `1px solid ${COLORS.border}`,
            paddingBottom: '0'
          }}>
            <button
              onClick={() => setActiveTab('my-rides')}
              style={{
                backgroundColor: activeTab === 'my-rides' ? COLORS.primary : 'transparent',
                color: activeTab === 'my-rides' ? '#000' : COLORS.text,
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem 0.5rem 0 0',
                cursor: 'pointer',
                fontWeight: '500',
                borderBottom: activeTab === 'my-rides' ? `2px solid ${COLORS.primary}` : 'none',
                marginBottom: '-1px'
              }}
            >
              <FaCar style={{ marginRight: '0.5rem' }} />
              My Rides ({myRides.length})
            </button>
            <button
              onClick={() => setActiveTab('going-rides')}
              style={{
                backgroundColor: activeTab === 'going-rides' ? COLORS.primary : 'transparent',
                color: activeTab === 'going-rides' ? '#000' : COLORS.text,
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem 0.5rem 0 0',
                cursor: 'pointer',
                fontWeight: '500',
                borderBottom: activeTab === 'going-rides' ? `2px solid ${COLORS.primary}` : 'none',
                marginBottom: '-1px'
              }}
            >
              <FaUsers style={{ marginRight: '0.5rem' }} />
              Going Rides ({goingRides.length})
            </button>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/create-announcement')}
          style={{
            backgroundColor: COLORS.primary,
            color: '#000',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FaPlus />
          Create Announcement
        </motion.button>
      </motion.div>

      {/* Announcements List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'grid', gap: '1.5rem' }}
      >
        {(() => {
          if (activeTab === 'my-rides') {
            // My Rides tab content
            const isEmpty = myRides.length === 0;
            
            if (isEmpty) {
              return (
                <motion.div
                  variants={itemVariants}
                  style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: COLORS.surfaceLight,
                    borderRadius: '0.5rem',
                    color: COLORS.textMuted
                  }}
                >
                  <FaBullhorn style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                  <h3>No rides created yet</h3>
                  <p>Create your first announcement to start offering rides!</p>
                </motion.div>
              );
            }
            
            return myRides.map((announcement) => (
              <motion.div
                key={announcement.id}
                variants={itemVariants}
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {/* My Rides content - keep existing structure */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      color: COLORS.text,
                      marginBottom: '0.5rem'
                    }}>
                      {announcement.title}
                    </h3>
                    <p style={{ color: COLORS.textMuted, marginBottom: '1rem' }}>
                      {announcement.description}
                    </p>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaClock style={{ color: COLORS.primary }} />
                      <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                        {announcement.date} at {announcement.time}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaUsers style={{ color: COLORS.primary }} />
                      <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                        {announcement.seatsAvailable}/{announcement.totalSeats} seats available
                      </span>
                    </div>
                    
                    {announcement.price && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', color: COLORS.textMuted }}>
                          ₹{announcement.price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ 
                  fontSize: '0.875rem',
                  color: COLORS.text,
                  marginBottom: '1rem'
                }}>
                  <strong>Route:</strong> {announcement.from} → {announcement.to}
                </div>

                {/* Member Counts Display */}
                <div style={{
                  backgroundColor: COLORS.surfaceLight,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: COLORS.text,
                    marginBottom: '0.5rem'
                  }}>
                    Member Status
                  </h4>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaHourglassHalf style={{ color: COLORS.warning }} />
                      <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                        Pending: {announcement.requesters?.filter(r => r.status === 'pending').length || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaUserCheck style={{ color: COLORS.success }} />
                      <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                        Accepted: {announcement.requesters?.filter(r => r.status === 'accepted').length || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <FaUserTimes style={{ color: COLORS.error }} />
                      <span style={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
                        Rejected: {announcement.requesters?.filter(r => r.status === 'rejected').length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for My Rides */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
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
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      flex: 1
                    }}
                  >
                    <FaInfoCircle />
                    View Details
                  </motion.button>
                  
                  {/* Delete Button - Only show for My Rides without accepted passengers */}
                  {(!announcement.requesters || announcement.requesters.filter(r => r.status === 'accepted').length === 0) && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        flex: 1
                      }}
                      title="Delete this announcement (no co-passengers)"
                    >
                      <FaTrash />
                      Delete
                    </motion.button>
                  )}
                  
                  {/* Show message if there are accepted passengers */}
                  {announcement.requesters && announcement.requesters.filter(r => r.status === 'accepted').length > 0 && (
                    <div style={{
                      backgroundColor: COLORS.surfaceLight,
                      color: COLORS.textMuted,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      border: `1px solid ${COLORS.border}`,
                      textAlign: 'center',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      Cannot delete - has co-passengers
                    </div>
                  )}
                </div>

                {/* Complete Ride Button - Only show after ride time has passed */}
                {canCompleteRide(announcement) && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCompleteRide(announcement.id, 'creator')}
                      style={{
                        backgroundColor: COLORS.success,
                        color: '#fff',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        flex: 1
                      }}
                    >
                      <FaCheckCircle />
                      Complete Ride
                    </motion.button>
                  </div>
                )}

                {/* Show ride completion status */}
                {announcement.ride_completed && (
                  <div style={{
                    backgroundColor: COLORS.success,
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaCheckCircle />
                    Ride Completed
                  </div>
                )}

                {/* Show time remaining until completion is available */}
                {!announcement.ride_completed && !isRideTimePassed(announcement.date, announcement.time) && (
                  <div style={{
                    backgroundColor: COLORS.surfaceLight,
                    color: COLORS.textMuted,
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    border: `1px solid ${COLORS.border}`,
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    <FaClock style={{ marginRight: '0.5rem' }} />
                    Complete Ride button will be available after {announcement.time} on {new Date(announcement.date).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            ));
          } else {
            // Going Rides tab content - NEW STRUCTURE
            console.log('🎯 Rendering Going Rides - Data:', { 
              goingRides: goingRides.length, 
              requested: requestedRides.length, 
              accepted: acceptedRides.length, 
              rejected: rejectedRides.length 
            });
            
            return (
              <div>
                {/* Status Summary Cards */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem', 
                  marginBottom: '2rem' 
                }}>
                  <motion.div
                    variants={itemVariants}
                    style={{
                      backgroundColor: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}
                  >
                    <FaHourglassHalf style={{ fontSize: '2rem', color: COLORS.warning, marginBottom: '0.5rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text, margin: '0 0 0.5rem 0' }}>
                      {requestedRides.length}
                    </h3>
                    <p style={{ color: COLORS.textMuted, margin: 0 }}>Requested Rides</p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    style={{
                      backgroundColor: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}
                  >
                    <FaUserCheck style={{ fontSize: '2rem', color: COLORS.success, marginBottom: '0.5rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text, margin: '0 0 0.5rem 0' }}>
                      {acceptedRides.length}
                    </h3>
                    <p style={{ color: COLORS.textMuted, margin: 0 }}>Accepted Rides</p>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    style={{
                      backgroundColor: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}
                  >
                    <FaUserTimes style={{ fontSize: '2rem', color: COLORS.error, marginBottom: '0.5rem' }} />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: COLORS.text, margin: '0 0 0.5rem 0' }}>
                      {rejectedRides.length}
                    </h3>
                    <p style={{ color: COLORS.textMuted, margin: 0 }}>Rejected Rides</p>
                  </motion.div>
                </div>

                {/* No rides message */}
                {goingRides.length === 0 && (
                  <motion.div
                    variants={itemVariants}
                    style={{
                      textAlign: 'center',
                      padding: '3rem',
                      backgroundColor: COLORS.surfaceLight,
                      borderRadius: '0.5rem',
                      color: COLORS.textMuted
                    }}
                  >
                    <FaUsers style={{ fontSize: '3rem', marginBottom: '1rem' }} />
                    <h3>No rides joined yet</h3>
                    <p>Join some rides to see them here!</p>
                  </motion.div>
                )}

                {/* Rides by Status */}
                {goingRides.length > 0 && (
                  <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Debug: Show all rides if categorization fails */}
                    {requestedRides.length === 0 && acceptedRides.length === 0 && rejectedRides.length === 0 && (
                      <div>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          color: COLORS.text,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FaUsers style={{ color: COLORS.primary }} />
                          All Rides ({goingRides.length}) - Debug Mode
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {goingRides.map((announcement) => renderGoingRideCard(announcement, announcement.myParticipantStatus || 'unknown'))}
                        </div>
                      </div>
                    )}
                    
                    {/* Requested Rides Section */}
                    {requestedRides.length > 0 && (
                      <div>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          color: COLORS.text,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FaHourglassHalf style={{ color: COLORS.warning }} />
                          Requested Rides ({requestedRides.length})
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {requestedRides.map((announcement) => renderGoingRideCard(announcement, 'requested'))}
                        </div>
                      </div>
                    )}

                    {/* Accepted Rides Section */}
                    {acceptedRides.length > 0 && (
                      <div>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          color: COLORS.text,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FaUserCheck style={{ color: COLORS.success }} />
                          Accepted Rides ({acceptedRides.length})
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {acceptedRides.map((announcement) => renderGoingRideCard(announcement, 'accepted'))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Rides Section */}
                    {rejectedRides.length > 0 && (
                      <div>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          color: COLORS.text,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FaUserTimes style={{ color: COLORS.error }} />
                          Rejected Rides ({rejectedRides.length})
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                          {rejectedRides.map((announcement) => renderGoingRideCard(announcement, 'rejected'))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }
        })()}
      </motion.div>

      {/* Details Modal */}
      {showDetailsModal && selectedAnnouncement && (
        <div style={{
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
        onClick={handleCloseModal}
      >
        <div style={{
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
            <FaTimes />
          </button>

          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: COLORS.text,
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {selectedAnnouncement.title}
          </h2>

          <div style={{ 
            fontSize: '1rem', 
            color: COLORS.textMuted, 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {selectedAnnouncement.description}
          </div>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              backgroundColor: COLORS.surfaceLight,
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <strong>Date & Time:</strong> {selectedAnnouncement.date} at {selectedAnnouncement.time}
            </div>
            <div style={{
              backgroundColor: COLORS.surfaceLight,
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <strong>Route:</strong> {selectedAnnouncement.from} → {selectedAnnouncement.to}
            </div>
            <div style={{
              backgroundColor: COLORS.surfaceLight,
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <strong>Seats:</strong> {selectedAnnouncement.seatsAvailable}/{selectedAnnouncement.totalSeats} available
            </div>
            {selectedAnnouncement.price && (
              <div style={{
                backgroundColor: COLORS.surfaceLight,
                padding: '1rem',
                borderRadius: '0.5rem'
              }}>
                <strong>Price:</strong> ₹{selectedAnnouncement.price}
              </div>
            )}
            <div style={{
              backgroundColor: COLORS.surfaceLight,
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <strong>Creator:</strong> {selectedAnnouncement.creator_name}
            </div>
            <div style={{
              backgroundColor: COLORS.surfaceLight,
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
              <strong>Status:</strong> {selectedAnnouncement.myParticipantStatus || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setReviewableUsers([]);
          // Clear pending completion if user closes modal manually
          window.pendingCompletion = null;
        }}
        announcementId={selectedAnnouncement?.id}
        reviewableUsers={reviewableUsers}
        onSubmitReview={handleSubmitReview}
        currentUser={user}
      />
    </div>
  );
};

export default MyAnnouncements;
