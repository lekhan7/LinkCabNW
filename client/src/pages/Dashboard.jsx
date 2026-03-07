import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { recentActivitiesAPI } from '../services/api';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaBullhorn, FaCheckCircle, FaRoute, FaUserFriends } from 'react-icons/fa';
import { FaUserShield, FaBell } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const welcomeShownRef = useRef(false);

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show welcome message only once when component mounts and user is available
    if (user && !welcomeShownRef.current) {
      success(`Welcome, ${user.name}!`);
      welcomeShownRef.current = true;
    }
  }, [user, success]);

  useEffect(() => {
    fetchRecentActivities();
  }, [user]);

  const fetchRecentActivities = async () => {
    try {
      if (!user) return;
      
      const data = await recentActivitiesAPI.getRecentActivities();
      setRecentActivities(data.activities || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const welcomeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F8F8 100%)',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(245, 196, 0, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <style>
          {`@media (max-width: 1024px) {
            .lc-hero { grid-template-columns: 1fr !important; gap: 2rem !important; }
            .lc-hero-img { order: -1; }
            .lc-section-pad { padding: 1.5rem !important; }
          }
          @media (max-width: 900px) {
            .lc-hero { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
            .lc-hero-img { order: -1; }
            .lc-section-pad { padding: 1.25rem !important; }
          }
          @media (max-width: 768px) {
            .lc-hero-title { font-size: 2.5rem !important; }
            .lc-hero-sub { font-size: 1.1rem !important; }
            .lc-section-pad { padding: 1rem !important; }
            .lc-cards-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          }
          @media (max-width: 520px) {
            .lc-hero-title { font-size: 2.25rem !important; }
            .lc-hero-sub { font-size: 1.05rem !important; }
            .lc-section-pad { padding: 0.75rem !important; }
            .lc-card { padding: 1.25rem !important; }
          }
          @media (max-width: 400px) {
            .lc-hero-title { font-size: 1.75rem !important; }
            .lc-hero-sub { font-size: 0.95rem !important; }
            .lc-section-pad { padding: 0.5rem !important; }
            .lc-card { padding: 1rem !important; }
          }`}
        </style>

        <motion.div
          variants={welcomeVariants}
          initial="hidden"
          animate="visible"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            marginBottom: '3.5rem'
          }}
        >
          <div
            className="lc-hero"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.05fr 0.95fr',
              gap: '2.5rem',
              alignItems: 'center'
            }}
          >
            <div>
              <motion.h1
                className="lc-hero-title"
                style={{
                  color: COLORS.text,
                  fontSize: '3.25rem',
                  fontWeight: 800,
                  margin: 0,
                  marginBottom: '0.85rem',
                  lineHeight: 1.12
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {user?.name ? `Welcome ${user.name}` : 'Welcome to LinkCab'}
              </motion.h1>

              <motion.div
                className="lc-hero-sub"
                style={{
                  color: COLORS.textSecondary,
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem'
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Smart Rides. Trusted Co-Passengers. Safe Journeys.
              </motion.div>

              <motion.p
                style={{
                  color: COLORS.textMuted,
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  margin: 0,
                  maxWidth: '560px'
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                LinkCab helps you find compatible co-passengers, connect with confidence, and travel together safely.
                Verified users, smart notifications, and transparent reviews make every journey smoother.
              </motion.p>

              <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/announcements')}
                  style={{
                    padding: '0.95rem 1.25rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                    color: COLORS.background,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 10px 26px rgba(245, 196, 0, 0.25)'
                  }}
                  type="button"
                >
                  Explore Rides
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/create-announcement')}
                  style={{
                    padding: '0.95rem 1.25rem',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: 'rgba(248, 248, 248, 0.85)',
                    color: COLORS.text,
                    fontWeight: 800,
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)'
                  }}
                  type="button"
                >
                  Create Ride
                </motion.button>
              </div>
            </div>

            <div className="lc-hero-img" style={{ display: 'flex', justifyContent: 'center' }}>
              <motion.img
                src="/poster1.jpeg"
                alt="LinkCab poster"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  height: 'auto',
                  borderRadius: '18px',
                  boxShadow: '0 18px 50px rgba(0, 0, 0, 0.12)',
                  border: `1px solid ${COLORS.border}`
                }}
              />
            </div>
          </div>
        </motion.div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3.5rem' }}>
          <div
            className="lc-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem'
            }}
          >
            <Card hoverable style={{ minHeight: '160px' }}>
              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div style={{ fontSize: '2rem', color: COLORS.info }}><FaUserShield /></div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.35rem' }}>
                    Secure Ride Matching
                  </div>
                  <div style={{ color: COLORS.textSecondary, lineHeight: 1.55 }}>
                    Match with trusted co-passengers using verified profiles, clear ride info, and transparent joining.
                  </div>
                </div>
              </div>
            </Card>

            <Card hoverable style={{ minHeight: '160px' }}>
              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div style={{ fontSize: '2rem', color: COLORS.warning }}><FaBell /></div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.35rem' }}>
                    Smart Notifications
                  </div>
                  <div style={{ color: COLORS.textSecondary, lineHeight: 1.55 }}>
                    Stay updated with real-time alerts for requests, accepts, reviews, and ride activity.
                  </div>
                </div>
              </div>
            </Card>

            <Card hoverable style={{ minHeight: '160px' }}>
              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div style={{ fontSize: '2rem', color: COLORS.success }}><FaCheckCircle /></div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.35rem' }}>
                    Verified Co-Passengers
                  </div>
                  <div style={{ color: COLORS.textSecondary, lineHeight: 1.55 }}>
                    Ride with confidence through profile verification and community-driven reviews.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div
          className="lc-section-pad"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            marginBottom: '3.5rem',
            borderRadius: '22px',
            overflow: 'hidden',
            border: `1px solid ${COLORS.border}`,
            backgroundImage: 'url(/poster2.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            padding: '2.25rem'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)'
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ color: COLORS.background, fontSize: '2rem', fontWeight: 900, marginBottom: '0.6rem' }}>
              Travel Together. Save More. Ride Smarter.
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/announcements')}
              style={{
                padding: '0.95rem 1.35rem',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: COLORS.background,
                fontWeight: 900,
                cursor: 'pointer'
              }}
              type="button"
            >
              Start Your Journey
            </motion.button>
          </div>
        </div>

        <div className="lc-section-pad" style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: COLORS.text, textAlign: 'center', marginBottom: '1.25rem' }}>
            About Us
          </div>
          <Card className="lc-card" style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ color: COLORS.textSecondary, lineHeight: 1.75, marginBottom: '1.5rem' }}>
              We connect co-passengers to make travel safer, smarter, and more affordable. LinkCab is community-driven:
              verified profiles, clear ride details, and honest reviews help you ride with confidence.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.9rem'
              }}
            >
              <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
                <div style={{ fontWeight: 900, color: COLORS.text }}>100+</div>
                <div style={{ color: COLORS.textMuted }}>Rides Completed</div>
              </div>
              <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
                <div style={{ fontWeight: 900, color: COLORS.text }}>500+</div>
                <div style={{ color: COLORS.textMuted }}>Active Users</div>
              </div>
              <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
                <div style={{ fontWeight: 900, color: COLORS.text }}>4.8</div>
                <div style={{ color: COLORS.textMuted }}>Average Rating</div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '3.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: '1.5rem',
              alignItems: 'center'
            }}
            className="lc-hero"
          >
            <Card>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.85rem' }}>
                Why Choose Us
              </div>
              <div style={{ color: COLORS.textSecondary, lineHeight: 1.75 }}>
                Safety comes first with verified users and a transparent review system. Smart analytics help you track your journeys,
                while notifications keep you updated at every step—so you can focus on enjoying the ride.
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.55rem', color: COLORS.textMuted }}>
                <div>• Safety-focused matching and trusted participants</div>
                <div>• Verified profiles and community reviews</div>
                <div>• Smart analytics and trip insights</div>
                <div>• Real-time request and review notifications</div>
              </div>
            </Card>
            <Card hoverable style={{ padding: '1rem' }}>
              <motion.img
                src="/poster1.jpeg"
                alt="Travel"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '16px',
                  boxShadow: '0 14px 34px rgba(0, 0, 0, 0.12)',
                  border: `1px solid ${COLORS.border}`
                }}
              />
            </Card>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '4rem' }}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: COLORS.text, marginBottom: '0.5rem' }}>
              Ready to Ride?
            </div>
            <div style={{ color: COLORS.textSecondary, marginBottom: '1.25rem' }}>
              Join the community and start your journey today.
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/announcements')}
              style={{
                padding: '0.95rem 1.4rem',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
                color: COLORS.background,
                fontWeight: 900,
                cursor: 'pointer'
              }}
              type="button"
            >
              Get Started
            </motion.button>
          </Card>
        </div>

        
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <h2
            style={{
              color: COLORS.text,
              fontSize: '1.5rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            Recent Activities
          </h2>
          <div
            style={{
              backgroundColor: 'rgba(248, 248, 248, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(245, 196, 0, 0.2)',
              borderRadius: '16px',
              overflow: 'hidden',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: COLORS.textSecondary }}>Loading recent activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: COLORS.textSecondary }}>No recent activities found</p>
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: index < recentActivities.length - 1 ? '1px solid rgba(245, 196, 0, 0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(245, 196, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.5rem',
                    }}
                  >
                    {getActivityIcon(activity.type, activity.icon)}
                  </span>
                  <div
                    style={{
                      flex: 1,
                    }}
                  >
                    <p
                      style={{
                        color: COLORS.text,
                        fontSize: '1rem',
                        fontWeight: '500',
                        margin: '0 0 0.25rem 0',
                      }}
                    >
                      {activity.title}
                    </p>
                    <p
                      style={{
                        color: COLORS.textSecondary,
                        fontSize: '0.85rem',
                        margin: 0,
                      }}
                    >
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: `${getStatusColor(activity.status)}20`,
                      color: getStatusColor(activity.status),
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                    }}
                  >
                    {formatStatus(activity.status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const getActivityIcon = (type, icon) => {
  switch (type) {
    case 'announcement':
      return <FaBullhorn />;
    case 'chat':
      return <FaComments />;
    case 'connection':
      return <FaUserFriends />;
    case 'trip_joined':
      return <FaRoute />;
    default:
      return <FaCheckCircle />;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const formatStatus = (status) => {
  switch (status) {
    case 'open':
      return 'Active';
    case 'closed':
      return 'Completed';
    case 'accepted':
      return 'Accepted';
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'active':
      return 'Active';
    default:
      return status;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'accepted':
    case 'closed':
      return COLORS.success;
    case 'active':
    case 'open':
      return COLORS.info;
    case 'pending':
      return COLORS.warning;
    default:
      return COLORS.textSecondary;
  }
};

export default Dashboard;
