const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class UserService {
  // Create a new user
  static async create(userData) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          password: hashedPassword
        })
        .select()
        .single();

      if (error) throw error;
      
      // Remove password from response
      const { password, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by email (using code_number as email alternative)
  static async findByEmail(email) {
    try {
      // Since users table doesn't have email field, we'll search by code_number or phone_number
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`code_number.eq.${email},phone_number.eq.${email}`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Find user by phone number
  static async findByPhoneNumber(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Error finding user by phone: ${error.message}`);
    }
  }

  // Find user by ID (with password for authentication)
  static async findByIdWithPassword(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const { password, ...userWithoutPassword } = data;
        return userWithoutPassword;
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Update user
  static async updateById(id, updateData) {
    try {
      // Hash password if it's being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const { password, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Delete user
  static async deleteById(id) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Get all users (for admin)
  static async findAll(filters = {}) {
    try {
      let query = supabase.from('users').select('*');

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }
      if (filters.isOnline !== undefined) {
        query = query.eq('is_online', filters.isOnline);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Remove passwords from all users
      return data.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Count users
  static async count(filters = {}) {
    try {
      let query = supabase.from('users').select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }
      if (filters.createdAfter) {
        query = query.gte('created_at', filters.createdAfter);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count;
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Update user statistics
  static async updateStats(userId, stats) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(stats)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error updating user stats: ${error.message}`);
    }
  }

  // Verify OTP
  static async verifyOTP(phoneNumber, otp) {
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
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('otps')
        .update({ verified: true })
        .eq('id', data.id);

      if (updateError) throw updateError;

      // Update user phone verification status
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ is_phone_verified: true })
        .eq('phone_number', phoneNumber);

      if (userUpdateError) throw userUpdateError;

      // Get updated user data
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (fetchError) throw fetchError;

      // Generate JWT token for verified user
      const { generateToken } = require('../utils/generateToken');
      const token = generateToken(updatedUser.id);

      return {
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            code_number: updatedUser.code_number,
            phone_number: updatedUser.phone_number,
            role: updatedUser.role,
            verified: updatedUser.verified,
            is_phone_verified: updatedUser.is_phone_verified,
            profile_picture: updatedUser.profile_picture,
            average_rating: updatedUser.average_rating,
            completed_trips: updatedUser.completed_trips,
            total_trips: updatedUser.total_trips,
            is_online: updatedUser.is_online,
            is_premium: updatedUser.is_premium,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at
          },
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error verifying OTP: ${error.message}`
      };
    }
  }

  // Resend OTP
  static async resendOTP(phoneNumber) {
    try {
      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (userError || !user) {
        return {
          success: false,
          message: 'User with this phone number not found'
        };
      }

      // Generate new OTP
      const { generateOTP, sendOTP, storeOTP } = require('../utils/otpService');
      const newOTP = generateOTP();

      // Store OTP in database
      const storeResult = await storeOTP(phoneNumber, newOTP);
      if (!storeResult.success) {
        return storeResult;
      }

      // Send OTP
      const sendResult = await sendOTP(phoneNumber, newOTP);
      if (!sendResult.success) {
        return sendResult;
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        data: { 
          phone_number: phoneNumber,
          otp: process.env.NODE_ENV === 'development' ? newOTP : null
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Error resending OTP: ${error.message}`
      };
    }
  }
}

module.exports = UserService;
