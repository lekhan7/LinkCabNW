import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import FeedbackModal from '../components/FeedbackModal';
import { 
  FaPhoneAlt, 
  FaAmbulance, 
  FaShieldAlt, 
  FaExclamationTriangle, 
  FaHeadset, 
  FaClock, 
  FaMapMarkerAlt, 
  FaUserShield, 
  FaArrowLeft, 
  FaSms, 
  FaWhatsapp, 
  FaEnvelope,
  FaCar,
  FaUser,
  FaCreditCard,
  FaTools,
  FaStar,
  FaComments,
  FaHandshake,
  FaWheelchair,
  FaLanguage,
  FaHeartbeat,
  FaRoute,
  FaFileAlt,
  FaQuestionCircle,
  FaLightbulb,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaBell,
  FaVolumeUp,
  FaVideo,
  FaDownload,
  FaShareAlt,
  FaCopy,
  FaExternalLinkAlt
} from 'react-icons/fa';

const EmergencySupport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('immediate');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    // Check if URL has #feedback hash and show feedback modal
    if (location.hash === '#feedback') {
      setShowFeedbackModal(true);
      setActiveSection('feedback');
    }
  }, [location.hash]);

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Map frontend data to backend format
      const backendData = {
        rating: feedbackData.rating,
        feedback_type: feedbackData.type,
        subject: `${feedbackData.type.charAt(0).toUpperCase() + feedbackData.type.slice(1)} Feedback`,
        message: feedbackData.comments,
        priority: 'medium'
      };

      // Send feedback to backend
      const response = await fetch('https://linkcab-0t9d.onrender.com/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(backendData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit feedback');
      }

      console.log('Feedback submitted successfully:', result.data);
      alert('Thank you for your feedback! We appreciate your input.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.message || 'Failed to submit feedback. Please try again.');
      throw error;
    }
  };

  const sections = [
    { id: 'immediate', title: 'Emergency Button', icon: FaExclamationTriangle },
    { id: 'emergency', title: 'Emergency Services', icon: FaAmbulance },
    { id: 'support', title: 'Customer Support', icon: FaHeadset },
    { id: 'issues', title: 'Common Issues', icon: FaTools },
    { id: 'guidelines', title: 'Safety Guidelines', icon: FaShieldAlt },
    { id: 'reporting', title: 'Incident Reporting', icon: FaFileAlt },
    { id: 'refund', title: 'Refund Policy', icon: FaCreditCard },
    { id: 'assistance', title: 'Special Assistance', icon: FaWheelchair },
    { id: 'feedback', title: 'Feedback', icon: FaComments },
    { id: 'contacts', title: 'Emergency Contacts', icon: FaPhoneAlt },
    { id: 'resources', title: 'Help Resources', icon: FaQuestionCircle }
  ];

  const content = {
    immediate: {
      title: 'In-App Emergency Button',
      content: [
        'The Emergency Button is prominently displayed during active rides for immediate access to safety features.',
        'When activated, it automatically shares your real-time location with emergency contacts and notifies the LinkCab safety team.',
        'The system records incident details automatically and can connect you to local emergency services if needed.',
        'This feature ensures you can get help quickly in any emergency situation during your ride.'
      ],
      emergencyTypes: [
        { type: 'Medical Emergency', icon: FaHeartbeat, description: 'For medical emergencies requiring immediate attention' },
        { type: 'Accident/Incident', icon: FaCar, description: 'For vehicle accidents or road incidents' },
        { type: 'Safety Concern', icon: FaShieldAlt, description: 'For personal safety threats or harassment' },
        { type: 'Vehicle Breakdown', icon: FaTools, description: 'For mechanical failures or breakdowns' }
      ],
      features: [
        { icon: FaMapMarkerAlt, title: 'Real-time Location Sharing', description: 'Automatically shares live location with emergency contacts' },
        { icon: FaBell, title: 'Safety Team Notification', description: 'Instantly alerts LinkCab safety team' },
        { icon: FaFileAlt, title: 'Incident Recording', description: 'Automatically records incident details for evidence' },
        { icon: FaPhoneAlt, title: 'Emergency Services Connection', description: 'Connects to local emergency services when needed' }
      ]
    },
    emergency: {
      title: 'Emergency Response Protocol',
      content: [
        'Follow these steps when you need to activate emergency response during your ride.',
        'The system is designed to provide immediate assistance while ensuring your safety throughout the process.',
        'Each emergency type triggers specific response protocols tailored to the situation.'
      ],
      protocol: [
        { step: 1, action: 'Tap Emergency Button', description: 'Locate and tap the Emergency Button in your active ride screen' },
        { step: 2, action: 'Select Emergency Type', description: 'Choose from Medical Emergency, Accident/Incident, Safety Concern, or Vehicle Breakdown' },
        { step: 3, action: 'Confirm Emergency', description: 'Confirm the emergency to activate the response system' },
        { step: 4, action: 'Follow Instructions', description: 'Follow on-screen instructions for your safety and wait for assistance' }
      ],
      automaticFeatures: [
        { icon: FaShareAlt, title: 'Trip Sharing', description: 'Automatically shares trip details with emergency contacts' },
        { icon: FaMapMarkerAlt, title: 'GPS Tracking', description: 'Real-time location monitoring for safety team' },
        { icon: FaVolumeUp, title: 'Driver Alerts', description: 'Notifies driver of emergency activation' },
        { icon: FaVideo, title: 'Audio Recording', description: 'Optional recording for evidence collection' }
      ]
    },
    support: {
      title: 'Customer Support Channels',
      content: [
        'LinkCab offers multiple support channels to assist you with any issues or concerns.',
        'Our support team is available 24/7 for urgent matters and during business hours for general inquiries.',
        'Choose the most convenient channel based on your issue urgency and preference.'
      ],
      channels: [
        {
          title: 'In-App Support',
          availability: '24/7',
          responseTime: 'Within 2 hours for urgent issues',
          features: ['Live chat with support agents', 'Submit support tickets', 'Track ticket status', 'FAQ and self-help resources'],
          icon: FaComments
        },
        {
          title: 'Phone Support',
          numbers: [
            { label: 'Emergency Hotline', number: '+91-XXX-XXX-XXXX', availability: '24/7' },
            { label: 'Customer Service', number: '+91-XXX-XXX-XXXX', availability: '8 AM - 10 PM IST' },
            { label: 'Driver Support', number: '+91-XXX-XXX-XXXX', availability: '24/7' }
          ],
          icon: FaPhoneAlt
        },
        {
          title: 'Email Support',
          emails: [
            { label: 'General Inquiries', email: 'support@linkcab.in' },
            { label: 'Emergency Issues', email: 'emergency@linkcab.in' },
            { label: 'Driver Support', email: 'drivers@linkcab.in' },
            { label: 'Business Partnerships', email: 'business@linkcab.in' }
          ],
          icon: FaEnvelope
        },
        {
          title: 'Social Media',
          platforms: [
            { platform: 'Twitter/X', handle: '@LinkCabSupport' },
            { platform: 'Facebook', handle: 'facebook.com/LinkCabSupport' },
            { platform: 'WhatsApp', number: '+91-XXX-XXX-XXXX' },
            { platform: 'Instagram', handle: '@LinkCabOfficial' }
          ],
          icon: FaShareAlt
        }
      ]
    },
    issues: {
      title: 'Common Issues & Solutions',
      content: [
        'Find quick solutions to common problems you might encounter while using LinkCab.',
        'These troubleshooting steps can help resolve most issues without needing to contact support.',
        'For persistent problems, don\'t hesitate to reach out to our support team.'
      ],
      categories: [
        {
          category: 'Ride-Related Issues',
          icon: FaCar,
          issues: [
            {
              title: 'Driver Not Arriving',
              steps: [
                'Wait 5 minutes after scheduled pickup time',
                'Contact Driver through in-app messaging',
                'Report Issue if no response within 2 minutes',
                'Request New Driver or cancel for refund'
              ]
            },
            {
              title: 'Wrong Route Taken',
              steps: [
                'Communicate with driver immediately',
                'Use In-App Navigation to show correct route',
                'Report Route Issue after ride completion',
                'Request Fare Adjustment if applicable'
              ]
            },
            {
              title: 'Payment Issues',
              steps: [
                'Check Payment Method in wallet settings',
                'Verify Transaction in ride history',
                'Contact Support with ride details',
                'Allow 24-48 hours for resolution'
              ]
            }
          ]
        },
        {
          category: 'Account & Technical Issues',
          icon: FaTools,
          issues: [
            {
              title: 'Login Problems',
              steps: [
                'Reset Password using "Forgot Password" option',
                'Check Internet Connection and app updates',
                'Clear App Cache if login fails repeatedly',
                'Contact Support with error screenshots'
              ]
            },
            {
              title: 'App Crashes/Freezes',
              steps: [
                'Update App to latest version',
                'Restart Device and clear cache',
                'Check Storage Space on device',
                'Reinstall App as last resort'
              ]
            },
            {
              title: 'Location Issues',
              steps: [
                'Enable Location Services in device settings',
                'Grant App Permissions for precise location',
                'Check GPS Signal strength',
                'Move to Open Area if indoors'
              ]
            }
          ]
        }
      ]
    },
    guidelines: {
      title: 'Safety Guidelines',
      content: [
        'Follow these comprehensive safety guidelines to ensure a secure and pleasant experience with LinkCab.',
        'These best practices are based on industry standards and real-world experience in shared transportation.',
        'Your safety is our priority - always trust your instincts and report any concerns.'
      ],
      phases: [
        {
          phase: 'Before the Ride',
          icon: FaClock,
          guidelines: [
            'Verify Driver: Check photo, name, and vehicle details',
            'Share Trip Details: Send to trusted contacts',
            'Wait in Safe Location: Well-lit, public areas',
            'Have Backup Plan: Alternative transportation ready'
          ]
        },
        {
          phase: 'During the Ride',
          icon: FaRoute,
          guidelines: [
            'Sit Behind Driver: Safer seating position',
            'Share Live Location: Keep contacts informed',
            'Stay Alert: Avoid sleep or distractions',
            'Trust Your Instincts: Report suspicious behavior'
          ]
        },
        {
          phase: 'After the Ride',
          icon: FaCheckCircle,
          guidelines: [
            'Check Belongings: Ensure nothing left behind',
            'Rate Experience: Help improve service quality',
            'Report Issues: Promptly report problems',
            'Keep Receipts: For payment disputes'
          ]
        }
      ]
    },
    reporting: {
      title: 'Incident Reporting',
      content: [
        'Report any incidents promptly to ensure appropriate action and maintain community safety.',
        'Our incident reporting system is designed to handle various types of issues efficiently.',
        'All reports are investigated thoroughly and treated with confidentiality.'
      ],
      reportTypes: [
        { type: 'Safety Incidents', description: 'Harassment, assault, threats', icon: FaShieldAlt, priority: 'Critical' },
        { type: 'Vehicle Issues', description: 'Breakdowns, accidents, damage', icon: FaCar, priority: 'High' },
        { type: 'Service Problems', description: 'Discrimination, route issues, overcharging', icon: FaTimesCircle, priority: 'Medium' },
        { type: 'Lost Items', description: 'Belongings left in vehicles', icon: FaFileAlt, priority: 'Low' }
      ],
      process: [
        { step: 1, action: 'Access Report', description: 'Access Incident Report in app within 24 hours' },
        { step: 2, action: 'Provide Details', description: 'Provide Details: Date, time, location, description' },
        { step: 3, action: 'Upload Evidence', description: 'Upload Evidence: Photos, screenshots, recordings' },
        { step: 4, action: 'Submit & Track', description: 'Submit Report and receive confirmation number' }
      ],
      followUp: [
        { action: 'Police Reports', description: 'Serious incidents require police filing' },
        { action: 'Medical Attention', description: 'Seek immediate medical help if needed' },
        { action: 'Witness Statements', description: 'Collect contact information if available' },
        { action: 'Documentation', description: 'Keep all related documents' }
      ]
    },
    refund: {
      title: 'Refund & Compensation Policy',
      content: [
        'LinkCab provides fair refund and compensation policies for various service issues.',
        'Our goal is to ensure customer satisfaction while maintaining service quality.',
        'Refunds are processed according to the nature and severity of the issue.'
      ],
      eligibility: [
        { condition: 'Driver Cancellation', refund: 'Full refund if driver cancels', icon: FaTimesCircle },
        { condition: 'No-Show Driver', refund: 'Full refund after 10 minutes', icon: FaClock },
        { condition: 'Service Failure', refund: 'Partial/full refund based on issue', icon: FaTools },
        { condition: 'Technical Issues', refund: 'Refund for app-caused problems', icon: FaExclamationTriangle }
      ],
      process: [
        { step: 1, action: 'Submit Request', description: 'Submit Request within 7 days of incident' },
        { step: 2, action: 'Provide Evidence', description: 'Provide Evidence: Screenshots, ride details' },
        { step: 3, action: 'Review Period', description: 'Review Period: 2-3 business days' },
        { step: 4, action: 'Processing Time', description: 'Processing Time: 5-7 business days to account' }
      ],
      compensationTypes: [
        { type: 'Ride Credits', description: 'For service failures' },
        { type: 'Discount Coupons', description: 'For customer inconvenience' },
        { type: 'Wallet Balance', description: 'Immediate refund to LinkCab wallet' },
        { type: 'Original Payment', description: 'Refund to original payment method' }
      ]
    },
    assistance: {
      title: 'Special Assistance',
      content: [
        'LinkCab is committed to providing accessible transportation for all users.',
        'We offer various special assistance programs to accommodate different needs.',
        'Contact us in advance to arrange special accommodations for your journey.'
      ],
      categories: [
        {
          title: 'Accessibility Support',
          icon: FaWheelchair,
          services: [
            'Wheelchair Access: Request accessible vehicles',
            'Visual Assistance: Screen reader compatible app',
            'Hearing Support: Text-based communication options',
            'Elderly Assistance: Special support for senior citizens'
          ]
        },
        {
          title: 'Language Support',
          icon: FaLanguage,
          services: [
            'Multi-Language App: English, Hindi, and regional languages',
            'Voice Support: Customer service in multiple languages',
            'Translation Services: For non-English speakers',
            'Local Support: Regional customer service centers'
          ]
        },
        {
          title: 'Special Situations',
          icon: FaHeartbeat,
          services: [
            'Medical Emergencies: Priority assistance and ambulance coordination',
            'Child Safety: Special protocols for unaccompanied minors',
            'Tourist Support: Travel assistance for visitors',
            'Night Travel: Enhanced safety measures after 10 PM'
          ]
        }
      ]
    },
    feedback: {
      title: 'Feedback & Improvement',
      content: [
        'Your feedback helps us improve our services and maintain high standards.',
        'We value all customer input and use it to enhance the LinkCab experience.',
        'Multiple channels are available for sharing your thoughts and suggestions.'
      ],
      feedbackTypes: [
        { type: 'Ride Ratings', description: '1-5 star rating system', icon: FaStar },
        { type: 'Written Reviews', description: 'Detailed feedback option', icon: FaFileAlt },
        { type: 'Driver Compliments', description: 'Recognition for excellent service', icon: FaHandshake },
        { type: 'Service Suggestions', description: 'Feature requests and improvements', icon: FaLightbulb }
      ],
      complaintProcess: [
        { step: 'Acknowledgment', description: 'Immediate confirmation of complaint receipt' },
        { step: 'Investigation', description: 'Thorough review of incident details' },
        { step: 'Resolution', description: 'Fair solutions within reasonable timeframe' },
        { step: 'Follow-Up', description: 'Customer satisfaction confirmation' }
      ]
    },
    contacts: {
      title: 'Emergency Contacts Directory',
      content: [
        'Keep these emergency numbers readily available for quick access during emergencies.',
        'Save important numbers in your phone for immediate use when needed.',
        'Different emergency services handle specific types of situations.'
      ],
      categories: [
        {
          title: 'India Emergency Numbers',
          contacts: [
            { service: 'Police', number: '100' },
            { service: 'Ambulance', number: '102' },
            { service: 'Fire Brigade', number: '101' },
            { service: 'Women Helpline', number: '1091' },
            { service: 'Child Helpline', number: '1098' }
          ]
        },
        {
          title: 'Transportation Emergency',
          contacts: [
            { service: 'Road Accident', number: '1033 (Highway Patrol)' },
            { service: 'Traffic Police', number: '103' },
            { service: 'Vehicle Breakdown', number: '+91-XXX-XXX-XXXX (LinkCab)' },
            { service: 'Insurance Claims', number: '+91-XXX-XXX-XXXX' }
          ]
        },
        {
          title: 'Medical Emergency',
          contacts: [
            { service: 'General Medical', number: '102 or 108' },
            { service: 'Poison Control', number: '1066' },
            { service: 'Blood Bank', number: '1910' },
            { service: 'Mental Health', number: '1860' }
          ]
        }
      ]
    },
    resources: {
      title: 'Help Resources',
      content: [
        'Access comprehensive self-help resources and educational materials.',
        'These resources are designed to help you make the most of LinkCab services.',
        'Regular updates ensure you have the latest information and guidelines.'
      ],
      categories: [
        {
          title: 'Self-Service Options',
          icon: FaQuestionCircle,
          resources: [
            'FAQ Section: Comprehensive help articles',
            'Video Tutorials: Step-by-step guides',
            'Troubleshooting Guides: Common issue solutions',
            'Community Forum: User discussions and tips'
          ]
        },
        {
          title: 'Educational Resources',
          icon: FaLightbulb,
          resources: [
            'Safety Tips: Best practices for ridesharing',
            'App Usage Guides: Feature explanations',
            'Policy Information: Terms and privacy details',
            'Local Regulations: Transportation laws by city'
          ]
        }
      ],
      responseTimes: [
        { priority: 'Critical Emergency', response: 'Immediate response (under 5 minutes)' },
        { priority: 'Urgent Issues', response: '30 minutes response time' },
        { priority: 'High Priority', response: '2 hours response time' },
        { priority: 'Standard Issues', response: '24 hours response time' }
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
            color: COLORS.error,
            margin: 0
          }}>
            Emergency & Support
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
              Emergency Options
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
                      backgroundColor: activeSection === section.id ? COLORS.error : 'transparent',
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
              borderBottom: `2px solid ${COLORS.error}`,
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

            {/* Emergency Types */}
            {activeSection === 'immediate' && currentContent.emergencyTypes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Emergency Types
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {currentContent.emergencyTypes.map((type, index) => {
                    const Icon = type.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '8px',
                          textAlign: 'center'
                        }}
                      >
                        <Icon style={{ 
                          color: COLORS.error, 
                          fontSize: '2rem',
                          marginBottom: '1rem'
                        }} />
                        <h5 style={{ 
                          color: COLORS.text, 
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          margin: '0 0 0.5rem 0'
                        }}>
                          {type.type}
                        </h5>
                        <p style={{ 
                          color: COLORS.textSecondary, 
                          fontSize: '0.9rem',
                          margin: 0
                        }}>
                          {type.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Emergency Features */}
            {activeSection === 'immediate' && currentContent.features && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Automatic Safety Features
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {currentContent.features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '8px'
                        }}
                      >
                        <Icon style={{ 
                          color: COLORS.primary, 
                          fontSize: '1.5rem'
                        }} />
                        <div>
                          <h5 style={{ 
                            color: COLORS.text, 
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            margin: '0 0 0.25rem 0'
                          }}>
                            {feature.title}
                          </h5>
                          <p style={{ 
                            color: COLORS.textSecondary, 
                            fontSize: '0.95rem',
                            margin: 0
                          }}>
                            {feature.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Emergency Protocol */}
            {activeSection === 'emergency' && currentContent.protocol && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Response Protocol Steps
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {currentContent.protocol.map((step, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: COLORS.primary,
                        color: COLORS.background,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {step.step}
                      </div>
                      <div>
                        <h5 style={{ 
                          color: COLORS.text, 
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {step.action}
                        </h5>
                        <p style={{ 
                          color: COLORS.textSecondary, 
                          fontSize: '0.95rem',
                          margin: 0
                        }}>
                          {step.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Support Channels */}
            {activeSection === 'support' && currentContent.channels && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Available Support Channels
                </h4>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {currentContent.channels.map((channel, index) => {
                    const Icon = channel.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <Icon style={{ 
                            color: COLORS.primary, 
                            fontSize: '1.5rem'
                          }} />
                          <h5 style={{ 
                            color: COLORS.text, 
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            margin: 0
                          }}>
                            {channel.title}
                          </h5>
                        </div>
                        
                        {channel.availability && (
                          <div style={{ marginBottom: '1rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: COLORS.success + '20',
                              color: COLORS.success,
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {channel.availability}
                            </span>
                            {channel.responseTime && (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: COLORS.info + '20',
                                color: COLORS.info,
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                marginLeft: '0.5rem'
                              }}>
                                {channel.responseTime}
                              </span>
                            )}
                          </div>
                        )}

                        {channel.features && (
                          <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {channel.features.map((feature, idx) => (
                              <div key={idx} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem' 
                              }}>
                                <FaCheckCircle style={{ color: COLORS.success, fontSize: '0.8rem' }} />
                                <span style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {channel.numbers && (
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {channel.numbers.map((number, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                backgroundColor: COLORS.surface,
                                borderRadius: '6px'
                              }}>
                                <div>
                                  <div style={{ fontWeight: '600', color: COLORS.text, fontSize: '0.9rem' }}>
                                    {number.label}
                                  </div>
                                  <div style={{ color: COLORS.textMuted, fontSize: '0.8rem' }}>
                                    {number.availability}
                                  </div>
                                </div>
                                <div style={{
                                  padding: '0.25rem 0.75rem',
                                  backgroundColor: COLORS.primary,
                                  color: COLORS.background,
                                  borderRadius: '4px',
                                  fontSize: '0.9rem',
                                  fontWeight: '600'
                                }}>
                                  {number.number}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {channel.emails && (
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {channel.emails.map((email, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                backgroundColor: COLORS.surface,
                                borderRadius: '6px'
                              }}>
                                <span style={{ fontWeight: '600', color: COLORS.text, fontSize: '0.9rem' }}>
                                  {email.label}
                                </span>
                                <span style={{ color: COLORS.primary, fontSize: '0.9rem' }}>
                                  {email.email}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {channel.platforms && (
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {channel.platforms.map((platform, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                backgroundColor: COLORS.surface,
                                borderRadius: '6px'
                              }}>
                                <span style={{ fontWeight: '600', color: COLORS.text, fontSize: '0.9rem' }}>
                                  {platform.platform}
                                </span>
                                <span style={{ color: COLORS.primary, fontSize: '0.9rem' }}>
                                  {platform.handle || platform.number}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Common Issues Categories */}
            {activeSection === 'issues' && currentContent.categories && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Issue Categories
                </h4>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {currentContent.categories.map((category, index) => {
                    const Icon = category.icon;
                    return (
                      <motion.div
                        key={index}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                          <Icon style={{ 
                            color: COLORS.primary, 
                            fontSize: '1.5rem'
                          }} />
                          <h5 style={{ 
                            color: COLORS.text, 
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            margin: 0
                          }}>
                            {category.category}
                          </h5>
                        </div>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                          {category.issues.map((issue, idx) => (
                            <div key={idx}>
                              <h6 style={{ 
                                color: COLORS.text, 
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                marginBottom: '0.75rem'
                              }}>
                                {issue.title}
                              </h6>
                              <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {issue.steps.map((step, stepIdx) => (
                                  <div key={stepIdx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start', 
                                    gap: '0.75rem' 
                                  }}>
                                    <div style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: COLORS.primary,
                                      color: COLORS.background,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      flexShrink: 0,
                                      marginTop: '0.1rem'
                                    }}>
                                      {stepIdx + 1}
                                    </div>
                                    <span style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
                                      {step}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Safety Guidelines Phases */}
            {activeSection === 'guidelines' && currentContent.phases && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Safety Phases
                </h4>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {currentContent.phases.map((phase, index) => {
                    const Icon = phase.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: COLORS.background,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <Icon style={{ 
                            color: COLORS.primary, 
                            fontSize: '1.5rem'
                          }} />
                          <h5 style={{ 
                            color: COLORS.text, 
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            margin: 0
                          }}>
                            {phase.phase}
                          </h5>
                        </div>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                          {phase.guidelines.map((guideline, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '0.75rem' 
                            }}>
                              <FaCheckCircle style={{ 
                                color: COLORS.success, 
                                fontSize: '1rem',
                                marginTop: '0.1rem',
                                flexShrink: 0
                              }} />
                              <span style={{ color: COLORS.textSecondary, fontSize: '0.95rem' }}>
                                {guideline}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Contact Directory */}
            {activeSection === 'contacts' && currentContent.categories && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Emergency Contact Categories
                </h4>
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {currentContent.categories.map((category, index) => (
                    <motion.div
                      key={index}
                      style={{
                        padding: '1.5rem',
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px'
                      }}
                    >
                      <h5 style={{ 
                        color: COLORS.text, 
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        marginBottom: '1rem'
                      }}>
                        {category.title}
                      </h5>
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {category.contacts.map((contact, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02 }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '1rem',
                              backgroundColor: COLORS.surface,
                              borderRadius: '8px'
                            }}
                          >
                            <div>
                              <div style={{ 
                                fontWeight: '600', 
                                color: COLORS.text, 
                                fontSize: '1rem' 
                              }}>
                                {contact.service}
                              </div>
                            </div>
                            <div style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: COLORS.error,
                              color: COLORS.background,
                              borderRadius: '6px',
                              fontSize: '1.1rem',
                              fontWeight: 'bold'
                            }}>
                              {contact.number}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Response Times */}
            {activeSection === 'resources' && currentContent.responseTimes && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ marginTop: '2rem' }}
              >
                <h4 style={{ 
                  color: COLORS.text, 
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Support Response Times
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {currentContent.responseTimes.map((time, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: COLORS.background,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px'
                      }}
                    >
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: COLORS.text, 
                          fontSize: '1rem' 
                        }}>
                          {time.priority}
                        </div>
                      </div>
                      <div style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: time.priority.includes('Critical') ? COLORS.error + '20' :
                                       time.priority.includes('Urgent') ? COLORS.warning + '20' :
                                       time.priority.includes('High') ? COLORS.info + '20' :
                                       COLORS.success + '20',
                        color: time.priority.includes('Critical') ? COLORS.error :
                               time.priority.includes('Urgent') ? COLORS.warning :
                               time.priority.includes('High') ? COLORS.info :
                               COLORS.success,
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        {time.response}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Emergency Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{
            marginTop: '3rem',
            padding: '2rem',
            backgroundColor: COLORS.error + '10',
            border: `2px solid ${COLORS.error}`,
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <FaExclamationTriangle style={{ color: COLORS.error, fontSize: '2rem' }} />
            <h3 style={{ 
              color: COLORS.error, 
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0
            }}>
              Emergency Hotline
            </h3>
          </div>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: COLORS.error,
            marginBottom: '1rem'
          }}>
            112
          </div>
          <p style={{ 
            color: COLORS.textSecondary, 
            fontSize: '1.1rem',
            margin: 0
          }}>
            For any life-threatening emergency, call 112 immediately - available 24/7
          </p>
        </motion.div>
      </motion.div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          // Remove hash from URL
          window.history.replaceState(null, null, window.location.pathname);
        }}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default EmergencySupport;
