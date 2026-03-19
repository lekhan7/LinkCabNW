const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { upload } = require('../middleware/signupUpload');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Supabase
const storeOTP = async (phoneNumber, otp) => {
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Delete any existing OTPs for this phone number
    await supabase
      .from('otps')
      .delete()
      .eq('phone_number', phoneNumber);
    
    // Insert new OTP
    const { error } = await supabase
      .from('otps')
      .insert({
        phone_number: phoneNumber,
        otp: otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error storing OTP:', error);
    return { success: false, message: 'Failed to store OTP' };
  }
};

// User signup - handle both JSON and FormData
router.post('/signup', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    // Handle case where req.body is undefined
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing. Please ensure Content-Type is application/json or multipart/form-data'
      });
    }
    
    // Extract data from FormData or JSON
    const { name, phoneNumber, password } = req.body;

    console.log('Signup attempt:', { name, phoneNumber, password: '***' });

    if (!name || !phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, phone number, and password'
      });
    }

    // Check if user already exists (by phone)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data with actual database schema
    const userData = {
      name,
      phone_number: phoneNumber,
      password: hashedPassword,
      role: 'user' // Use default role from schema
    };

    // Add profile photo if uploaded
    if (req.file) {
      userData.profile_picture = `/uploads/${req.file.filename}`;
    }

    // Create new user
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (insertError) {
      console.error('User creation error:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    // Generate OTP for verification
    const otp = generateOTP();
    
    // Store OTP
    const storeResult = await storeOTP(phoneNumber, otp);
    if (!storeResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OTP'
      });
    }

    // In development, show OTP in console
    console.log(`🔔 OTP for ${phoneNumber}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your phone number with the OTP sent.',
      data: {
        requiresOTP: true,
        userId: user.id,
        phoneNumber: phoneNumber,
        otp: otp, // Always return OTP for development
        message: `Your OTP is: ${otp}`
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    console.log('Login attempt:', { phoneNumber, password: '***' });

    if (!phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and password are required'
      });
    }

    // Find user by phone number in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !user) {
      console.log('User not found for phone:', phoneNumber);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare password (using bcrypt for hashed passwords)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', phoneNumber);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    const storeResult = await storeOTP(phoneNumber, otp);
    if (!storeResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OTP'
      });
    }

    // In development, show OTP in console
    console.log(`🔔 OTP for ${phoneNumber}: ${otp}`);
    
    return res.json({
      success: true,
      message: 'Login successful. Please verify your phone number with the OTP sent.',
      data: {
        requiresOTP: true,
        userId: user.id,
        phoneNumber: phoneNumber,
        otp: otp, // Always return OTP for development
        message: `Your OTP is: ${otp}`
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('Verify OTP request body:', req.body);
    const { phoneNumber, otp, userId } = req.body;

    console.log('OTP verification attempt:', { phoneNumber, otp, userId });

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Check OTP in Supabase
    console.log('Checking OTP for phone:', phoneNumber, 'OTP:', otp);
    
    const { data: otpData, error } = await supabase
      .from('otps')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('OTP query result:', { data: otpData, error });

    if (error || !otpData) {
      console.log('OTP validation failed:', error?.message || 'OTP not found');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        debug: error?.message
      });
    }

    // Mark OTP as verified
    await supabase
      .from('otps')
      .update({ verified: true })
      .eq('id', otpData.id);

    // Update user's phone verification status
    await supabase
      .from('users')
      .update({ is_phone_verified: true })
      .eq('id', userId);

    // Get updated user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        phone_number: user.phone_number,
        code_number: user.code_number,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          code_number: user.code_number,
          phone_number: user.phone_number,
          role: user.role,
          is_phone_verified: true,
          profile_picture: user.profile_picture,
          average_rating: user.average_rating,
          completed_trips: user.completed_trips,
          total_trips: user.total_trips,
          is_online: user.is_online,
          is_premium: user.is_premium,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token: token
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    
    // Store OTP
    const storeResult = await storeOTP(phoneNumber, otp);
    if (!storeResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OTP'
      });
    }

    // In development, show OTP in console
    console.log(`🔔 RESEND OTP for ${phoneNumber}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        otp: otp,
        message: `Your new OTP is: ${otp}`
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        phone_number: user.phone_number,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;
