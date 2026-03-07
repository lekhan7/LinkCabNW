import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';
import { FaFileContract, FaUserCheck, FaCar, FaCreditCard, FaShieldAlt, FaGavel, FaComments, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('agreement');

  const sections = [
    { id: 'agreement', title: 'Agreement to Terms', icon: FaFileContract },
    { id: 'service', title: 'Service Description', icon: FaCar },
    { id: 'accounts', title: 'User Accounts', icon: FaUserCheck },
    { id: 'passenger', title: 'Passenger Terms', icon: FaUserCheck },
    { id: 'driver', title: 'Driver Terms', icon: FaCar },
    { id: 'fares', title: 'Fares and Payments', icon: FaCreditCard },
    { id: 'cancellations', title: 'Cancellations', icon: FaComments },
    { id: 'ratings', title: 'Ratings and Reviews', icon: FaComments },
    { id: 'safety', title: 'Safety and Security', icon: FaShieldAlt },
    { id: 'intellectual', title: 'Intellectual Property', icon: FaGavel },
    { id: 'privacy', title: 'Privacy and Data', icon: FaShieldAlt },
    { id: 'liability', title: 'Limitation of Liability', icon: FaGavel },
    { id: 'indemnification', title: 'Indemnification', icon: FaGavel },
    { id: 'disputes', title: 'Dispute Resolution', icon: FaComments },
    { id: 'modifications', title: 'Service Modifications', icon: FaComments },
    { id: 'general', title: 'General Provisions', icon: FaGavel },
    { id: 'contact', title: 'Contact Information', icon: FaComments }
  ];

  const content = {
    agreement: {
      title: '1. Agreement to Terms',
      content: [
        'By downloading, installing, or using the LinkCab mobile application ("Service"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree to these Terms, do not use our Service.',
        'These Terms constitute a legally binding agreement between you ("User" or "Passenger/Driver") and LinkCab ("Company," "We," "Us").',
        'Last Updated: February 13, 2026',
        'Effective Date: February 13, 2026'
      ]
    },
    service: {
      title: '2. Service Description',
      content: [
        'LinkCab is a mobile ridesharing platform that connects passengers with drivers for transportation services. We do not provide transportation services directly but facilitate connections between independent drivers and passengers.',
        '',
        '2.1 Services Include',
        '• Ride Matching: Connect passengers with available drivers',
        '• Route Planning: Calculate optimal routes and estimated fares',
        '• Payment Processing: Handle secure payment transactions',
        '• Rating System: Allow users to rate and review experiences',
        '• Communication: Facilitate contact between users',
        '',
        '2.2 Service Availability',
        '• Services are available where drivers are present',
        '• No guarantee of immediate ride availability',
        '• Service may be interrupted for maintenance or technical issues'
      ]
    },
    accounts: {
      title: '3. User Accounts',
      content: [
        '3.1 Registration',
        '• Must be at least 18 years old to create an account',
        '• Provide accurate, complete, and current information',
        '• Create a secure password and maintain account security',
        '• One account per person permitted',
        '',
        '3.2 Account Responsibilities',
        '• You are responsible for all activities under your account',
        '• Notify us immediately of unauthorized account use',
        '• Keep contact information current and accurate',
        '• Do not share account credentials with others',
        '',
        '3.3 Account Termination',
        '• We may suspend or terminate accounts for violations',
        '• You may delete your account at any time',
        '• Termination does not affect accrued obligations'
      ]
    },
    passenger: {
      title: '4. Passenger Terms',
      content: [
        '4.1 Booking Rides',
        '• Provide accurate pickup and drop-off locations',
        '• Be ready at pickup location at scheduled time',
        '• Cancel rides promptly if plans change',
        '• Pay applicable fares and fees',
        '',
        '4.2 Passenger Conduct',
        '• Treat drivers and vehicles with respect',
        '• Follow driver\'s reasonable safety instructions',
        '• Do not damage driver\'s vehicle',
        '• No smoking, vaping, or illegal substances',
        '• Wear seatbelts at all times',
        '',
        '4.3 Passenger Responsibilities',
        '• Verify driver and vehicle details before entering',
        '• Follow local laws regarding seatbelts and child seats',
        '• Do not ask drivers to break traffic laws',
        '• Report safety concerns immediately'
      ]
    },
    driver: {
      title: '5. Driver Terms',
      content: [
        '5.1 Driver Requirements',
        '• Must be at least 21 years old with valid license',
        '• Vehicle must be registered, insured, and roadworthy',
        '• Pass background verification process',
        '• Maintain professional appearance and conduct',
        '• Have smartphone with data plan and GPS',
        '',
        '5.2 Driver Obligations',
        '• Accept ride requests fairly without discrimination',
        '• Follow GPS routes or passenger preferences',
        '• Maintain vehicle cleanliness and safety',
        '• Provide safe and courteous transportation',
        '• Comply with all traffic laws and regulations',
        '',
        '5.3 Driver Conduct',
        '• No discrimination based on race, gender, religion, etc.',
        '• No harassment or inappropriate behavior',
        '• No smoking or strong perfumes in vehicle',
        '• Maintain appropriate conversation boundaries',
        '• Respect passenger privacy and confidentiality'
      ]
    },
    fares: {
      title: '6. Fares and Payments',
      content: [
        '6.1 Fare Calculation',
        '• Fares calculated based on distance, time, and demand',
        '• Base rates, per-minute, and per-kilometer charges apply',
        '• Surge pricing may apply during high demand periods',
        '• Tolls, parking, and other fees may be added',
        '',
        '6.2 Payment Processing',
        '• All payments processed through secure payment system',
        '• Fares charged to payment method on file',
        '• Drivers receive payments minus service fees',
        '• Refunds processed according to refund policy',
        '',
        '6.3 Service Fees',
        '• LinkCab charges commission on completed rides',
        '• No hidden fees - all charges disclosed upfront',
        '• Cancellation fees may apply for late cancellations',
        '• No-show fees may apply for passenger no-shows'
      ]
    },
    cancellations: {
      title: '7. Cancellations and Refunds',
      content: [
        '7.1 Passenger Cancellations',
        '• Free cancellation within 2 minutes of booking',
        '• Cancellation fee applies after 2 minutes',
        '• No-show fee applies if driver waits beyond grace period',
        '• Multiple cancellations may affect account status',
        '',
        '7.2 Driver Cancellations',
        '• Drivers may cancel for safety or legitimate reasons',
        '• Excessive cancellations may affect driver rating',
        '• Repeated cancellations may result in account review',
        '• Compensation may be provided for driver cancellations',
        '',
        '7.3 Refund Policy',
        '• Refunds considered on case-by-case basis',
        '• Service failures may qualify for full/partial refunds',
        '• Documentation required for refund requests',
        '• Refunds processed within 7-10 business days'
      ]
    },
    ratings: {
      title: '8. Ratings and Reviews',
      content: [
        '8.1 Rating System',
        '• Both passengers and drivers can rate each ride (1-5 stars)',
        '• Ratings help maintain service quality',
        '• Multiple low ratings may trigger account review',
        '• High ratings may provide benefits and privileges',
        '',
        '8.2 Review Guidelines',
        '• Provide honest, factual feedback',
        '• No offensive language or personal attacks',
        '• Report serious issues through proper channels',
        '• Reviews cannot be edited once submitted'
      ]
    },
    safety: {
      title: '9. Safety and Security',
      content: [
        '9.1 Safety Features',
        '• GPS tracking during active rides',
        '• Emergency button for immediate assistance',
        '• Share trip details with contacts',
        '• Driver and vehicle verification systems',
        '',
        '9.2 User Safety Responsibilities',
        '• Verify driver and vehicle before entering',
        '• Share trip details with trusted contacts',
        '• Use in-app emergency features when needed',
        '• Report safety incidents immediately',
        '',
        '9.3 Prohibited Activities',
        '• Weapons or dangerous items in vehicles',
        '• Illegal activities during rides',
        '• Harassment, discrimination, or violence',
        '• Property damage or theft',
        '• Fraudulent activities or scams'
      ]
    },
    intellectual: {
      title: '10. Intellectual Property',
      content: [
        '10.1 Company Property',
        '• LinkCab name, logo, and trademarks are our property',
        '• App design, features, and content are protected',
        '• No unauthorized use of our intellectual property',
        '• All rights not expressly granted are reserved',
        '',
        '10.2 User Content',
        '• You retain rights to content you create',
        '• You grant us license to use your content for service improvement',
        '• Do not post copyrighted material without permission',
        '• We may remove inappropriate content at our discretion'
      ]
    },
    privacy: {
      title: '11. Privacy and Data',
      content: [
        '11.1 Data Collection',
        '• We collect information as described in Privacy Policy',
        '• Location data used for ride matching and safety',
        '• Personal information protected according to Privacy Policy',
        '• Data shared only as necessary for service provision',
        '',
        '11.2 Data Usage',
        '• Analytics used to improve service quality',
        '• Location data processed for route optimization',
        '• Personal data never sold to third parties',
        '• Data retention follows legal requirements'
      ]
    },
    liability: {
      title: '12. Limitation of Liability',
      content: [
        '12.1 Service Limitations',
        '• We are not a transportation company',
        '• We do not employ drivers or own vehicles',
        '• We are not responsible for driver actions',
        '• We provide technology platform only',
        '',
        '12.2 Disclaimer of Warranties',
        '• Service provided "as is" without warranties',
        '• No guarantee of uninterrupted service',
        '• No guarantee of driver availability',
        '• No guarantee of fare accuracy or route efficiency',
        '',
        '12.3 Limitation of Damages',
        '• Our liability limited to service fees paid',
        '• Not liable for indirect or consequential damages',
        '• Not liable for driver negligence or misconduct',
        '• Not liable for vehicle accidents or injuries'
      ]
    },
    indemnification: {
      title: '13. Indemnification',
      content: [
        'You agree to indemnify and hold harmless LinkCab from:',
        '• Claims arising from your use of the service',
        '• Violations of these Terms by you',
        '• Harm to others caused by your actions',
        '• Legal costs and attorney fees related to such claims'
      ]
    },
    disputes: {
      title: '14. Dispute Resolution',
      content: [
        '14.1 Internal Resolution',
        '• Contact customer support for dispute resolution',
        '• Provide detailed information about the issue',
        '• Allow reasonable time for investigation',
        '• Cooperate with our resolution process',
        '',
        '14.2 Legal Disputes',
        '• Governed by laws of India',
        '• Jurisdiction of appropriate Indian courts',
        '• Arbitration may be required for certain disputes',
        '• Class action waivers may apply'
      ]
    },
    modifications: {
      title: '15. Service Modifications',
      content: [
        '15.1 Changes to Service',
        '• We may modify, suspend, or discontinue features',
        '• New features may be added over time',
        '• Pricing may change with reasonable notice',
        '• Service availability may vary by location',
        '',
        '15.2 Changes to Terms',
        '• We may update these Terms periodically',
        '• Users notified of significant changes',
        '• Continued use constitutes acceptance of changes',
        '• Material changes require explicit consent'
      ]
    },
    general: {
      title: '16. General Provisions',
      content: [
        '16.1 Entire Agreement',
        '• These Terms constitute the entire agreement',
        '• Supersede all prior agreements or understandings',
        '• No verbal or implied modifications permitted',
        '',
        '16.2 Severability',
        '• If any provision is invalid, remaining terms remain enforceable',
        '• Invalid provisions replaced with similar enforceable terms',
        '• Overall intent of Terms preserved',
        '',
        '16.3 Waiver',
        '• Failure to enforce any provision does not waive it',
        '• Waivers must be in writing to be effective',
        '• No waiver of any right or remedy',
        '',
        '16.4 Assignment',
        '• You may not assign rights without our consent',
        '• We may assign rights to third parties',
        '• Third-party beneficiaries may have enforcement rights'
      ]
    },
    contact: {
      title: '17. Contact Information',
      content: [
        'For questions about these Terms & Conditions:',
        'Email: legal@linkcab.in',
        'Website: www.linkcab.in',
        'App: Through in-app help and support section',
        'Phone: [Your Support Phone Number]',
        '',
        'By using LinkCab, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.',
        'These Terms & Conditions are governed by and construed in accordance with the laws of India.'
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
            Terms and Conditions
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
                  {paragraph.startsWith('•') ? (
                    <p style={{
                      color: COLORS.textSecondary,
                      fontSize: '1.05rem',
                      lineHeight: '1.6',
                      margin: '0 0 0 1rem',
                      paddingLeft: '0.5rem'
                    }}>
                      {paragraph}
                    </p>
                  ) : paragraph === '' ? (
                    <div style={{ height: '0.5rem' }} />
                  ) : (
                    <p style={{
                      color: COLORS.textSecondary,
                      fontSize: '1.05rem',
                      lineHeight: '1.6',
                      margin: 0,
                      fontWeight: paragraph.match(/^\d+\.\d+/) ? '600' : 'normal'
                    }}>
                      {paragraph}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Important Notice Card */}
            {activeSection === 'safety' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#FFF3CD',
                  border: `1px solid ${COLORS.warning}`,
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <FaExclamationTriangle style={{ 
                    color: COLORS.warning, 
                    fontSize: '1.5rem',
                    marginTop: '0.25rem'
                  }} />
                  <div>
                    <h4 style={{ 
                      color: COLORS.text, 
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      Important Safety Notice
                    </h4>
                    <p style={{
                      color: COLORS.textSecondary,
                      fontSize: '0.95rem',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      Your safety is our priority. Always verify driver and vehicle details, share trip information with trusted contacts, and use emergency features when needed. Report any safety concerns immediately.
                    </p>
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
            margin: '0 0 0.5rem 0'
          }}>
            © 2026 LinkCab. All rights reserved. By using our services, you agree to these Terms and Conditions.
          </p>
          <p style={{ 
            color: COLORS.textMuted, 
            fontSize: '0.85rem',
            margin: 0
          }}>
            Last Updated: February 13, 2026 | Effective Date: February 13, 2026
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
