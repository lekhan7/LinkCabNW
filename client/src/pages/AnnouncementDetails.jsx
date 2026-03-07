import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { announcementService } from '../services/api';
import { reviewService } from '../services/api';
import { useToast } from '../hooks/useToast';

const AnnouncementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewedRevieweeIds, setReviewedRevieweeIds] = useState(new Set());
  const [revieweeUser, setRevieweeUser] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSeed, setCelebrationSeed] = useState(0);

  const triggerCelebration = () => {
    setCelebrationSeed((s) => s + 1);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 4500);
  };

  const CelebrationOverlay = ({ seed }) => {
    const colors = ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa', '#fb7185'];
    const particles = Array.from({ length: 44 }).map((_, i) => {
      const side = i % 2 === 0 ? 'left' : 'right';
      const t = Math.abs(Math.sin((seed + 1) * (i + 3)));
      const top = Math.floor(5 + t * 85);
      const delay = (i % 12) * 0.03;
      const duration = 2.8 + (i % 10) * 0.12;
      const size = 6 + (i % 6);
      const color = colors[i % colors.length];
      const y = -20 - (i % 9) * 10;
      const x = side === 'left' ? 120 + (i % 8) * 14 : -120 - (i % 8) * 14;
      const rotate = (i % 2 === 0 ? 1 : -1) * (120 + (i % 10) * 18);
      return { id: `${seed}-${i}`, side, top, delay, duration, size, color, x, y, rotate };
    });

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden',
          animation: 'lc_celebration_fade 4.5s ease-out forwards'
        }}
      >
        <style>
          {`@keyframes lc_celebration_fade { 0%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
            @keyframes lc_popper { 0%{transform:translate3d(0,0,0) rotate(0deg); opacity:1} 100%{transform:translate3d(var(--x), var(--y), 0) rotate(var(--r)); opacity:0} }`}
        </style>

        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              position: 'absolute',
              top: `${p.top}%`,
              left: p.side === 'left' ? '0%' : '100%',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              borderRadius: '3px',
              transform: 'translateX(-50%)',
              opacity: 0,
              animation: `lc_popper ${p.duration}s cubic-bezier(0.1, 0.9, 0.2, 1) ${p.delay}s forwards`,
              '--x': `${p.x}px`,
              '--y': `${p.y}px`,
              '--r': `${p.rotate}deg`
            }}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await announcementService.getAnnouncementById(id);
        if (response?.success) {
          setAnnouncement(response.announcement);
        } else {
          addToast(response?.message || 'Announcement not found', 'error');
        }
      } catch (error) {
        addToast(error?.message || 'Failed to fetch announcement', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnnouncement();
    }
  }, [id]);

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

  const getRideDateTime = (a) => {
    if (!a?.date || !a?.time) return null;
    const rideDate = new Date(a.date);
    if (Number.isNaN(rideDate.getTime())) return null;
    const timeStr = String(a.time || '').trim();
    if (!timeStr) return null;
    const [hhStr, mmStr] = timeStr.split(':');
    const hours = parseInt(hhStr, 10);
    const minutes = parseInt(mmStr, 10);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    const dt = new Date(rideDate);
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  };

  const handleJoin = async () => {
    if (!announcement?._id) return;

    if (announcement?.createdBy?._id === user?._id) {
      addToast('You cannot join your own announcement.', 'warning');
      return;
    }

    try {
      setJoining(true);
      const response = await announcementService.createJoinRequest(announcement._id);
      if (response?.success) {
        addToast(response.message || 'Payment successful. Request sent.');
        const refreshed = await announcementService.getAnnouncementById(announcement._id);
        if (refreshed?.success) {
          setAnnouncement(refreshed.announcement);
        }
      } else {
        addToast(response?.message || 'Failed to send join request', 'error');
      }
    } catch (error) {
      addToast(error?.message || 'Failed to send join request', 'error');
    } finally {
      setJoining(false);
    }
  };

  const userJoin = announcement?.joinedBy?.find((j) => j.user?.toString?.() === user?._id || j.user?._id === user?._id);
  const joinStatus = userJoin?.status;

  const currentUserId = user?._id;
  const ownerId = announcement?.createdBy?._id || announcement?.createdBy;
  const isOwner = Boolean(currentUserId && ownerId && ownerId.toString() === currentUserId.toString());
  const isAcceptedPassenger = Boolean(
    currentUserId &&
    (announcement?.joinedBy || []).some(j => (j.user?._id || j.user)?.toString?.() === currentUserId.toString() && j.status === 'accepted')
  );
  const eligibleUser = Boolean(isOwner || isAcceptedPassenger);

  const rideDateTime = getRideDateTime(announcement);
  const rideTimePassed = Boolean(rideDateTime && new Date() > rideDateTime);

  const getMyCompletionStatus = (a) => {
    try {
      const uid = user?._id;
      if (!a || !uid) return null;
      const list = Array.isArray(a.completionStatus) ? a.completionStatus : [];
      return list.find(cs => (cs?.user?._id || cs?.user)?.toString?.() === uid.toString()) || null;
    } catch {
      return null;
    }
  };

  const myStatus = getMyCompletionStatus(announcement);
  const myCompleted = Boolean(myStatus?.completed);
  const myReviewed = Boolean(myStatus?.reviewed);

  const eligibleReviewTargets = (() => {
    if (!announcement) return [];
    const accepted = (announcement.joinedBy || [])
      .filter(j => j?.status === 'accepted' && j?.user)
      .map(j => j.user)
      .filter(Boolean);

    const owner = announcement.createdBy;
    if (!currentUserId) return [];

    if (isOwner) {
      return accepted.filter(u => (u?._id || u)?.toString?.() !== currentUserId.toString());
    }

    return owner && (owner?._id || owner) ? [owner] : [];
  })();

  useEffect(() => {
    const loadMyReviews = async () => {
      try {
        if (!announcement?._id) {
          setReviewedRevieweeIds(new Set());
          return;
        }

        const response = await reviewService.getMyRideReviews(announcement._id);
        if (response?.success) {
          setReviewedRevieweeIds(new Set(response.revieweeIds || []));
        } else {
          setReviewedRevieweeIds(new Set());
        }
      } catch {
        setReviewedRevieweeIds(new Set());
      }
    };

    loadMyReviews();
  }, [announcement?._id]);

  const openReviewModal = (reviewee) => {
    if (!myCompleted) {
      addToast("You must complete the ride before leaving a review.", 'warning');
      return;
    }

    if (reviewee?._id && reviewedRevieweeIds.has(reviewee._id)) {
      addToast('You have already reviewed this user for this ride.', 'warning');
      return;
    }
    setRevieweeUser(reviewee);
    setReviewRating(0);
    setReviewFeedback('');
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    if (reviewSubmitting) return;
    setReviewModalOpen(false);
    setRevieweeUser(null);
    setReviewRating(0);
    setReviewFeedback('');
  };

  const submitReview = async () => {
    if (!announcement?._id || !revieweeUser?._id) return;
    if (!myCompleted) {
      addToast("You must complete the ride before leaving a review.", 'warning');
      return;
    }

    if (reviewedRevieweeIds.has(revieweeUser._id)) {
      addToast('You have already reviewed this user for this ride.', 'warning');
      return;
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      addToast('Please select a rating (1-5).', 'warning');
      return;
    }
    if (!String(reviewFeedback || '').trim()) {
      addToast('Feedback is required.', 'warning');
      return;
    }

    try {
      setReviewSubmitting(true);
      const response = await reviewService.createReview({
        rideId: announcement._id,
        revieweeId: revieweeUser._id,
        rating: reviewRating,
        feedback: reviewFeedback
      });

      if (response?.success) {
        const deleteRes = await announcementService.deleteAnnouncement(announcement._id);
        if (!deleteRes?.success) {
          addToast(deleteRes?.message || 'Review saved, but failed to delete announcement', 'error');
          return;
        }

        addToast('Trip completed. Announcement deleted successfully.', 'success');
        triggerCelebration();
        setReviewedRevieweeIds(prev => {
          const next = new Set(prev);
          next.add(revieweeUser._id);
          return next;
        });
        closeReviewModal();

        // Update current user's reviewed state locally for independent button disable
        setAnnouncement(prev => {
          if (!prev) return prev;
          const list = Array.isArray(prev.completionStatus) ? prev.completionStatus : [];
          const next = [...list];
          const idx = next.findIndex(cs => (cs?.user?._id || cs?.user)?.toString?.() === currentUserId?.toString?.());
          if (idx >= 0) next[idx] = { ...next[idx], completed: true, reviewed: true };
          else next.push({ user: currentUserId, completed: true, reviewed: true });
          return { ...prev, completionStatus: next };
        });

        setTimeout(() => {
          navigate('/analytics', { state: { scrollTo: 'reviews' } });
        }, 1200);
      } else {
        addToast(response?.message || 'Failed to submit review', 'error');
      }
    } catch (error) {
      addToast(error?.message || 'Failed to submit review', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleRideFinish = async () => {
    if (!announcement?._id) return;
    if (!eligibleUser) return;

    if (myReviewed) return;

    // If already completed but review pending, open review modal again
    if (myCompleted && !myReviewed) {
      if (eligibleReviewTargets.length > 0) {
        openReviewModal(eligibleReviewTargets[0]);
      } else {
        addToast('No one to review for this ride.', 'warning');
      }
      return;
    }

    // Remove time-based condition - allow ride completion if status !== 'completed'
    if (announcement.status === 'completed') {
      addToast("Ride has already been completed.", 'warning');
      return;
    }

    try {
      setFinishing(true);
      const response = await announcementService.finishRide(announcement._id);
      if (response?.success) {
        addToast(response.message || 'Ride marked as completed', 'success');

        const completionStatusFromApi = response?.completionStatus || null;
        setAnnouncement(prev => {
          if (!prev) return prev;
          if (!completionStatusFromApi) return prev;
          const list = Array.isArray(prev.completionStatus) ? prev.completionStatus : [];
          const next = [...list];
          const idx = next.findIndex(cs => (cs?.user?._id || cs?.user)?.toString?.() === currentUserId?.toString?.());
          if (idx >= 0) next[idx] = { ...next[idx], ...completionStatusFromApi };
          else next.push(completionStatusFromApi);
          return { ...prev, completionStatus: next };
        });

        if (eligibleReviewTargets.length > 0) {
          setRevieweeUser(eligibleReviewTargets[0]);
          setReviewModalOpen(true);
        } else {
          addToast('No one to review for this ride.', 'warning');
        }
      } else {
        addToast(response?.message || 'Failed to finish ride', 'error');
      }
    } catch (error) {
      addToast(error?.message || 'Failed to finish ride', 'error');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: '#64748b'
      }}>
        Loading ride details...
      </div>
    );
  }

  if (!announcement) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#64748b', marginBottom: '1rem' }}>Announcement not found</div>
          <button
            onClick={() => navigate('/announcements')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Back to Announcements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '2rem 0' }}>
      {showCelebration && <CelebrationOverlay seed={celebrationSeed} />}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '1.75rem' }}>Ride Details</h1>
            <button
              onClick={() => navigate('/announcements')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </div>

        <div style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>Traveler</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{announcement.createdBy?.name || 'Unknown'}</div>
            </div>
            <div style={{ minWidth: '200px' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>Price</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#000000' }}>₹{announcement.price || 0}</div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>From</div>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>{announcement.startLocation?.name || 'Not specified'}</div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>To</div>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>{announcement.destination?.name || 'Not specified'}</div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Date</div>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>{formatDate(announcement.date)}</div>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Time</div>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>{formatTime(announcement.time)}</div>
            </div>
          </div>

          {announcement.notes && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Notes</div>
              <div style={{ color: '#1e293b' }}>{announcement.notes}</div>
            </div>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {announcement.createdBy?._id === user?._id ? (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                This is your announcement
              </div>
            ) : joinStatus ? (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>
                {joinStatus === 'accepted' ? 'Request Accepted' : joinStatus === 'requested' ? 'Request Sent' : 'Request Status: ' + joinStatus}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoin}
                disabled={joining}
                style={{
                  padding: '0.85rem 1.25rem',
                  backgroundColor: joining ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: joining ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                {joining ? 'Sending...' : 'Join Ride'}
              </motion.button>
            )}

            {eligibleUser && (
              <motion.button
                whileHover={{ scale: !myReviewed && !finishing ? 1.02 : 1 }}
                whileTap={{ scale: !myReviewed && !finishing ? 0.98 : 1 }}
                onClick={handleRideFinish}
                disabled={finishing || myReviewed}
                style={{
                  padding: '0.85rem 1.25rem',
                  backgroundColor: myReviewed ? '#94a3b8' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  transition: 'transform 0.2s ease',
                  cursor: finishing || myReviewed ? 'not-allowed' : 'pointer',
                  fontWeight: 800
                }}
                type="button"
              >
                {myReviewed ? 'Review Submitted' : (myCompleted ? 'Leave Review' : (finishing ? 'Finishing...' : 'Complete Ride'))}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {reviewModalOpen && Boolean(revieweeUser?._id) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}
          onClick={closeReviewModal}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: 800 }}>
                Leave Review
              </h3>
              <button
                onClick={closeReviewModal}
                disabled={reviewSubmitting}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: reviewSubmitting ? 'not-allowed' : 'pointer',
                  color: '#64748b'
                }}
                type="button"
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.95rem' }}>
              Reviewing: <strong>{revieweeUser?.name || 'User'}</strong>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.5rem', color: '#1e293b', fontWeight: 700 }}>Rating</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    disabled={reviewSubmitting}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: star <= reviewRating ? '#F5C400' : '#ffffff',
                      cursor: reviewSubmitting ? 'not-allowed' : 'pointer',
                      fontSize: '1.2rem'
                    }}
                    type="button"
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.5rem', color: '#1e293b', fontWeight: 700 }}>Feedback</div>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                rows={4}
                disabled={reviewSubmitting}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {eligibleReviewTargets.length > 1 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.5rem', color: '#1e293b', fontWeight: 700 }}>Choose Person</div>
                <select
                  value={revieweeUser?._id || ''}
                  onChange={(e) => {
                    const next = eligibleReviewTargets.find(u => String(u?._id) === String(e.target.value));
                    if (next) setRevieweeUser(next);
                  }}
                  disabled={reviewSubmitting}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    outline: 'none'
                  }}
                >
                  {eligibleReviewTargets.map(u => (
                    <option key={u._id} value={u._id}>{u.name || 'User'}</option>
                  ))}
                </select>
              </div>
            )}

            <motion.button
              whileHover={{ scale: reviewSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: reviewSubmitting ? 1 : 0.98 }}
              onClick={submitReview}
              disabled={reviewSubmitting}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: reviewSubmitting ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 900,
                cursor: reviewSubmitting ? 'not-allowed' : 'pointer'
              }}
              type="button"
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default AnnouncementDetails;
