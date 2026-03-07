import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import { FaShieldAlt, FaUserLock, FaDatabase, FaEye, FaCookie, FaGlobe, FaEnvelope, FaPhone, FaArrowLeft } from 'react-icons/fa';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: FaShieldAlt },
    { id: 'collection', title: 'Data Collection', icon: FaDatabase },
    { id: 'usage', title: 'Data Usage', icon: FaUserLock },
    { id: 'sharing', title: 'Data Sharing', icon: FaGlobe },
    { id: 'cookies', title: 'Cookies & Tracking', icon: FaCookie },
    { id: 'rights', title: 'Your Rights', icon: FaEye },
    { id: 'contact', title: 'Contact Us', icon: FaEnvelope }
  ];

  const content = {
    overview: {
      title: 'Privacy Policy Overview',
      content: [
        'LinkCab is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, share, and protect your data when you use our ride-sharing platform.',
        'By using LinkCab, you agree to the collection and use of information in accordance with this policy. If you disagree with any part of this policy, please do not use our service.',
        'This policy was last updated on [Current Date] and may be subject to changes. We will notify users of any significant changes via email or in-app notifications.'
      ]
    },
    collection: {
      title: 'Information We Collect',
      content: [
        'Personal Information: Name, phone number, email address, profile photo, and government-issued ID (for verification purposes).',
        'Location Data: Current location, preferred travel routes, and frequently visited places for matching purposes.',
        'Travel Preferences: Comfort levels, seat sharing preferences, preferred co-traveler types, and travel schedules.',
        'Payment Information: Payment method details processed securely through third-party payment processors.',
        'Communication Data: Messages between users, ride announcements, and notifications.',
        'Device Information: IP address, device type, browser information, and app usage statistics.',
        'User-Generated Content: Reviews, ratings, feedback, and public profile information.'
      ]
    },
    usage: {
      title: 'How We Use Your Information',
      content: [
        'Service Provision: To facilitate ride matching, coordinate travel arrangements, and provide customer support.',
        'Safety & Security: To verify user identities, prevent fraud, and ensure safe travel experiences.',
        'Personalization: To recommend relevant rides, improve matching algorithms, and enhance user experience.',
        'Communication: To send important notifications, trip updates, and customer service responses.',
        'Analytics: To analyze usage patterns, improve our services, and develop new features.',
        'Legal Compliance: To comply with applicable laws, regulations, and legal requests.',
        'Marketing: To send promotional communications (with your consent) about our services and partners.'
      ]
    },
    sharing: {
      title: 'Data Sharing Practices',
      content: [
        'Other Users: Share profile information, reviews, and necessary contact details for ride coordination.',
        'Service Providers: Share data with payment processors, verification services, and analytics providers.',
        'Legal Authorities: Disclose information when required by law, court order, or government request.',
        'Business Partners: Share anonymized or aggregated data with trusted partners for service improvement.',
        'Safety Purposes: Share relevant information with emergency services when required for user safety.',
        'We do not sell your personal information to third parties for marketing purposes.'
      ]
    },
    cookies: {
      title: 'Cookies and Tracking Technologies',
      content: [
        'Essential Cookies: Required for basic functionality and security features of the platform.',
        'Performance Cookies: Help us understand how our platform is being used and improve performance.',
        'Functional Cookies: Remember your preferences and provide personalized features.',
        'Marketing Cookies: Used to deliver relevant advertisements and promotional content.',
        'You can control cookie settings through your browser or app preferences.',
        'Disabling certain cookies may affect your ability to use some features of our platform.'
      ]
    },
    rights: {
      title: 'Your Privacy Rights',
      content: [
        'Access: Request access to your personal information and data we hold about you.',
        'Correction: Update or correct inaccurate personal information in your profile.',
        'Deletion: Request deletion of your account and associated personal data.',
        'Portability: Request a copy of your data in a machine-readable format.',
        'Restriction: Limit how we process your personal information.',
        'Objection: Object to certain types of data processing, particularly for marketing purposes.',
        'To exercise these rights, contact us at privacy@linkcab.com or through the app settings.'
      ]
    },
    contact: {
      title: 'Contact Information',
      content: [
        'For privacy-related questions, concerns, or requests, please contact us:',
        'Email: privacy@linkcab.com',
        'Phone: +91-XXXXXXXXXX',
        'Address: LinkCab Privacy Team, [Company Address], [City], [State], [PIN Code]',
        'We typically respond to privacy inquiries within 7 business days.',
        'For urgent privacy matters, mark your email as "URGENT: Privacy Inquiry".'
      ]
    }
  };

  const currentContent = content[activeSection];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: COLORS.background,
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '2rem',
          gap: '1rem'
        }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              color: COLORS.text,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <FaArrowLeft /> Back to Profile
          </motion.button>
          
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: COLORS.primary,
            margin: 0
          }}>
            Privacy Policy
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '1.5rem',
              height: 'fit-content',
              position: 'sticky',
              top: '2rem'
            }}
          >
            <h3 style={{ 
              color: COLORS.text, 
              fontSize: '1.2rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              Quick Navigation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <motion.button
                    key={section.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      backgroundColor: activeSection === section.id ? COLORS.primary : 'transparent',
                      border: activeSection === section.id ? 'none' : `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      color: activeSection === section.id ? COLORS.background : COLORS.text,
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'left'
                    }}
                  >
                    <Icon style={{ fontSize: '1rem' }} />
                    {section.title}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              padding: '2rem'
            }}
          >
            <div style={{ 
              borderBottom: `2px solid ${COLORS.primary}`,
              paddingBottom: '1rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{ 
                color: COLORS.text, 
                fontSize: '1.8rem',
                fontWeight: '600',
                margin: 0
              }}>
                {currentContent.title}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {currentContent.content.map((paragraph, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                >
                  <p style={{
                    color: COLORS.textSecondary,
                    fontSize: '1.05rem',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {paragraph}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Additional Info Cards */}
            {activeSection === 'contact' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px'
                }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Quick Contact Options
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaEnvelope style={{ color: COLORS.primary }} />
                    <span style={{ color: COLORS.textSecondary }}>privacy@linkcab.com</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FaPhone style={{ color: COLORS.primary }} />
                    <span style={{ color: COLORS.textSecondary }}>+91-XXXXXXXXXX</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            marginTop: '3rem',
            padding: '2rem',
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <p style={{ 
            color: COLORS.textMuted, 
            fontSize: '0.9rem',
            margin: 0
          }}>
            © 2024 LinkCab. All rights reserved. This Privacy Policy is part of our commitment to transparency and user privacy.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
