const nodemailer = require('nodemailer');
const { supabase } = require('../config/supabase');

// Mock SMS service for development
const sendOTP = async (phoneNumber, otp) => {
  try {
    // In development, log the OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'OTP sent successfully (development mode)' };
    }

    // In production, integrate with actual SMS service
    // Example: Twilio, MessageBird, etc.
    
    // For now, we'll use email as a fallback
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.TEST_EMAIL || 'test@example.com',
      subject: 'LinkCab OTP Verification',
      text: `Your OTP for LinkCab is: ${otp}. It will expire in 5 minutes.`
    };

    await transporter.sendMail(mailOptions);
    
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP' };
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Supabase
const storeOTP = async (phoneNumber, otp) => {
  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
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

// Verify OTP from Supabase
const verifyOTP = async (phoneNumber, otp) => {
  try {
    const { data, error } = await supabase
      .from('otps')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid or expired OTP' };
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otps')
      .update({ verified: true })
      .eq('id', data.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, message: 'Failed to verify OTP' };
  }
};

// Clean up expired OTPs
const cleanupExpiredOTPs = async () => {
  try {
    const { error } = await supabase
      .from('otps')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
    return { success: false };
  }
};

module.exports = {
  sendOTP,
  generateOTP,
  storeOTP,
  verifyOTP,
  cleanupExpiredOTPs
};
