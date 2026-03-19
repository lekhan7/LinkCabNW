import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { COLORS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { FaCamera } from 'react-icons/fa';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const fileInputRef = useRef(null);
  
  const { signup, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          profilePhoto: 'Only JPG, PNG, and WEBP files are allowed'
        }));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          profilePhoto: 'File size must be less than 5MB'
        }));
        return;
      }

      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      
      // Clear photo error
      if (errors.profilePhoto) {
        setErrors(prev => ({
          ...prev,
          profilePhoto: ''
        }));
      }
    }
  };

  const removePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }
    
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('phoneNumber', formData.phoneNumber);
    submitData.append('password', formData.password);
    submitData.append('profilePhoto', profilePhoto);
    
    const result = await signup(submitData);
    
    if (result.success) {
      // Show success toast message
      success('Registration successful! Double verification needed. Please login with your credentials.');
      
      // Redirect to login page
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.background }}>
      <style>
        {`@keyframes lcFadeUp {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes lcFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @media (max-width: 900px) {
            .lc-signup-grid { grid-template-columns: 1fr !important; }
            .lc-brand { min-height: 280px !important; }
            .lc-formWrap { padding: 1.25rem !important; }
          }
          @media (max-width: 520px) {
            .lc-card { padding: 1.4rem !important; }
          }`}
      </style>

      <div
        className="lc-signup-grid"
        style={{
          minHeight: '100vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <div
          className="lc-brand"
          style={{
            position: 'relative',
            minHeight: '100vh',
            backgroundImage: 'url(/poster2.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              animation: 'lcFadeIn 650ms ease both',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2.5rem',
              textAlign: 'center',
              color: '#FFFFFF',
            }}
          >
            <div style={{ maxWidth: '520px', animation: 'lcFadeUp 700ms ease both' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <img
                  src="/logo.png"
                  alt="LinkCab"
                  style={{ 
                    width: '110px', 
                    height: '110px', 
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '3px solid #F5C400'
                  }}
                />
              </div>

              <div style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '0.75rem' }}>
                Create Your Account
              </div>

              <div style={{ fontSize: '1.15rem', fontWeight: 700, opacity: 0.95, marginBottom: '0.55rem' }}>
                Smart rides. Trusted co-passengers.
              </div>

              <div style={{ fontSize: '1rem', opacity: 0.9 }}>
                Sign up and start your journey with LinkCab.
              </div>
            </div>
          </div>
        </div>

        <div
          className="lc-formWrap"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lc-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: COLORS.surface,
              borderRadius: '18px',
              padding: '2rem',
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 14px 45px rgba(0,0,0,0.12)',
              maxHeight: 'calc(100vh - 4rem)',
              overflowY: 'auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.35rem' }}>
              <img
                src="/logo.png"
                alt="LinkCab"
                style={{ 
                  width: '65px', 
                  height: '65px', 
                  objectFit: 'cover',
                  borderRadius: '50%',
                  border: '2px solid #F55C400',
                  marginBottom: '0.75rem' 
                }}
              />
              <div style={{ color: COLORS.text, fontSize: '1.65rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                Sign Up
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: '0.95rem' }}>
                Create an account to join rides and connect
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: COLORS.text,
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '0.85rem 0.9rem',
                    backgroundColor: COLORS.background,
                    border: `1px solid ${errors.name ? COLORS.error : COLORS.border}`,
                    borderRadius: '12px',
                    color: COLORS.text,
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.name ? COLORS.error : COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.name && (
                  <p
                    style={{
                      color: COLORS.error,
                      fontSize: '0.8rem',
                      marginTop: '0.35rem',
                      marginBottom: 0,
                    }}
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: COLORS.text,
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Profile Photo *
                </label>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.5rem 0',
                  }}
                >
                  {photoPreview ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        style={{
                          width: '118px',
                          height: '118px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `3px solid ${COLORS.border}`,
                          boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          backgroundColor: COLORS.error,
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '118px',
                        height: '118px',
                        borderRadius: '50%',
                        backgroundColor: COLORS.background,
                        border: `2px dashed ${errors.profilePhoto ? COLORS.error : COLORS.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = COLORS.primary;
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.10)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = errors.profilePhoto ? COLORS.error : COLORS.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <FaCamera style={{ color: COLORS.textSecondary, fontSize: '2rem' }} />
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '0.6rem 1rem',
                      backgroundColor: COLORS.background,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.text,
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = COLORS.primary;
                      e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.10)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = COLORS.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </button>

                  <p
                    style={{
                      color: COLORS.textMuted,
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      margin: 0,
                    }}
                  >
                    JPG, PNG, or WEBP (Max 5MB)
                  </p>
                </div>

                {errors.profilePhoto && (
                  <p
                    style={{
                      color: COLORS.error,
                      fontSize: '0.8rem',
                      marginTop: '0.5rem',
                      textAlign: 'center',
                      marginBottom: 0,
                    }}
                  >
                    {errors.profilePhoto}
                  </p>
                )}
              </div>


              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: COLORS.text,
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+91XXXXXXXXXX"
                  style={{
                    width: '100%',
                    padding: '0.85rem 0.9rem',
                    backgroundColor: COLORS.background,
                    border: `1px solid ${errors.phoneNumber ? COLORS.error : COLORS.border}`,
                    borderRadius: '12px',
                    color: COLORS.text,
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.phoneNumber ? COLORS.error : COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.phoneNumber && (
                  <p
                    style={{
                      color: COLORS.error,
                      fontSize: '0.8rem',
                      marginTop: '0.35rem',
                      marginBottom: 0,
                    }}
                  >
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: COLORS.text,
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  style={{
                    width: '100%',
                    padding: '0.85rem 0.9rem',
                    backgroundColor: COLORS.background,
                    border: `1px solid ${errors.password ? COLORS.error : COLORS.border}`,
                    borderRadius: '12px',
                    color: COLORS.text,
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? COLORS.error : COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.password && (
                  <p
                    style={{
                      color: COLORS.error,
                      fontSize: '0.8rem',
                      marginTop: '0.35rem',
                      marginBottom: 0,
                    }}
                  >
                    {errors.password}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label
                  style={{
                    display: 'block',
                    color: COLORS.text,
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%',
                    padding: '0.85rem 0.9rem',
                    backgroundColor: COLORS.background,
                    border: `1px solid ${errors.confirmPassword ? COLORS.error : COLORS.border}`,
                    borderRadius: '12px',
                    color: COLORS.text,
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.primary;
                    e.target.style.boxShadow = '0 0 0 4px rgba(245, 196, 0, 0.18)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.confirmPassword ? COLORS.error : COLORS.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.confirmPassword && (
                  <p
                    style={{
                      color: COLORS.error,
                      fontSize: '0.8rem',
                      marginTop: '0.35rem',
                      marginBottom: 0,
                    }}
                  >
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {error && (
                <div
                  style={{
                    backgroundColor: `${COLORS.error}20`,
                    border: `1px solid ${COLORS.error}`,
                    borderRadius: '12px',
                    padding: '0.85rem',
                    marginBottom: '1rem',
                    color: COLORS.error,
                    fontSize: '0.9rem',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '0.95rem',
                  backgroundColor: isLoading ? COLORS.textMuted : COLORS.primary,
                  color: COLORS.background,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: '1rem',
                  transform: 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = COLORS.primaryDark;
                    e.target.style.transform = 'translateY(-2px) scale(1.01)';
                    e.target.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.target.style.backgroundColor = COLORS.primary;
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '1rem 0 1.25rem 0',
              }}
            >
              <div style={{ height: 1, backgroundColor: COLORS.border, flex: 1 }} />
              <div style={{ color: COLORS.textMuted, fontSize: '0.85rem', fontWeight: 700 }}>OR</div>
              <div style={{ height: 1, backgroundColor: COLORS.border, flex: 1 }} />
            </div>

            <div
              style={{
                textAlign: 'center',
                color: COLORS.textSecondary,
                fontSize: '0.95rem',
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: COLORS.primary,
                  textDecoration: 'none',
                  fontWeight: '800',
                }}
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
