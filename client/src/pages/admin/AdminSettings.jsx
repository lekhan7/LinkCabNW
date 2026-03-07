import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { COLORS } from '../../utils/constants';

const AdminSettings = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowNewUsers: true,
    maxRidesPerDay: 10,
    autoApproveRides: false,
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAdminProfile(userData);
      }
    } catch (error) {
      console.error('Failed to fetch admin profile');
      console.error('Admin profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // In a real implementation, you would save these to a settings table
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings');
      console.error('Settings save error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: `4px solid ${COLORS.primary}20`,
              borderTop: `4px solid ${COLORS.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: COLORS.text }}>Loading settings...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '2rem' }}>
          Admin Settings
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
        }}>
          {/* Admin Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1.5rem' }}>
              Admin Profile
            </h2>
            {adminProfile && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Username:</label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem', color: COLORS.text }}>
                    {adminProfile.username}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Email:</label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem', color: COLORS.text }}>
                    {adminProfile.email}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Role:</label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem', color: COLORS.text }}>
                    {adminProfile.role}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>Member Since:</label>
                  <div style={{ padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '0.5rem', color: COLORS.text }}>
                    {new Date(adminProfile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E5E7EB',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1.5rem' }}>
              System Settings
            </h2>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '500', color: COLORS.text, marginBottom: '0.25rem' }}>
                    Maintenance Mode
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                    Disable user access to the platform for maintenance
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: systemSettings.maintenanceMode ? COLORS.primary : '#E5E7EB',
                    transition: '.4s',
                    borderRadius: '24px',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: systemSettings.maintenanceMode ? '27px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.4s',
                      borderRadius: '50%',
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '500', color: COLORS.text, marginBottom: '0.25rem' }}>
                    Allow New Users
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                    Enable or disable new user registrations
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={systemSettings.allowNewUsers}
                    onChange={(e) => handleSettingChange('allowNewUsers', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: systemSettings.allowNewUsers ? COLORS.primary : '#E5E7EB',
                    transition: '.4s',
                    borderRadius: '24px',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: systemSettings.allowNewUsers ? '27px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.4s',
                      borderRadius: '50%',
                    }} />
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '500', color: COLORS.text, marginBottom: '0.25rem' }}>
                    Auto-approve Rides
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
                    Automatically approve new ride announcements
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={systemSettings.autoApproveRides}
                    onChange={(e) => handleSettingChange('autoApproveRides', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: systemSettings.autoApproveRides ? COLORS.primary : '#E5E7EB',
                    transition: '.4s',
                    borderRadius: '24px',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '16px',
                      width: '16px',
                      left: systemSettings.autoApproveRides ? '27px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '.4s',
                      borderRadius: '50%',
                    }} />
                  </span>
                </label>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '500', color: COLORS.text, marginBottom: '0.25rem' }}>
                  Max Rides Per Day
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                  Maximum number of rides a user can create per day
                </p>
                <input
                  type="number"
                  value={systemSettings.maxRidesPerDay}
                  onChange={(e) => handleSettingChange('maxRidesPerDay', parseInt(e.target.value))}
                  min="1"
                  max="50"
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    width: '150px',
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            style={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            <button
              onClick={handleSaveSettings}
              style={{
                padding: '0.875rem 2rem',
                backgroundColor: COLORS.primary,
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = COLORS.accent;
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = COLORS.primary;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Save Settings
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
