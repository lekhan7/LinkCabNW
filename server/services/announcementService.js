const { supabase } = require('../config/supabase');

class AnnouncementService {
  // Create a new announcement
  static async create(announcementData) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData)
        .select(`
          *,
          created_by:users(id, name, email, phone_number)
        `);

      if (error) throw error;
      return data[0]; // Return first item since we're not using .single()
    } catch (error) {
      throw new Error(`Error creating announcement: ${error.message}`);
    }
  }

  // Find announcement by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          created_by:users(id, name, email, phone_number)
        `)
        .eq('id', id);

      if (error) throw error;
      return data[0]; // Return first item
    } catch (error) {
      throw new Error(`Error finding announcement by ID: ${error.message}`);
    }
  }

  // Get all announcements with filters
  static async findAll(filters = {}) {
    try {
      console.log('🔍 AnnouncementService.findAll called with filters:', filters);
      
      let query = supabase
        .from('announcements')
        .select(`
          *,
          created_by:users(id, name, email, phone_number),
          joinedBy:announcement_participants(
            *,
            user:users(id, name, email, phone_number)
          )
        `);

      // Apply filters
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.date) {
        query = query.eq('date', filters.date);
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.vehicleType) {
        query = query.eq('vehicle_type', filters.vehicleType);
      }
      if (filters.rideCompleted !== undefined) {
        query = query.eq('ride_completed', filters.rideCompleted);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }
      
      console.log(`✅ AnnouncementService found ${data?.length || 0} announcements`);
      return data;
    } catch (error) {
      console.error('❌ AnnouncementService.findAll error:', error);
      throw new Error(`Error fetching announcements: ${error.message}`);
    }
  }

  // Update announcement
  static async updateById(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          created_by:users(id, name, email, phone_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error updating announcement: ${error.message}`);
    }
  }

  // Delete announcement
  static async deleteById(id) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Error deleting announcement: ${error.message}`);
    }
  }

  // Join announcement (add participant)
  static async addParticipant(announcementId, userId) {
    try {
      const { data, error } = await supabase
        .from('announcement_participants')
        .insert({
          announcement_id: announcementId,
          user_id: userId,
          status: 'requested'
        })
        .select(`
          *,
          user:users(id, name, email, phone_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error adding participant: ${error.message}`);
    }
  }

  // Update participant status
  static async updateParticipantStatus(announcementId, userId, status) {
    try {
      const { data, error } = await supabase
        .from('announcement_participants')
        .update({ status })
        .eq('announcement_id', announcementId)
        .eq('user_id', userId)
        .select(`
          *,
          user:users(id, name, email, phone_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error updating participant status: ${error.message}`);
    }
  }

  // Update participant status by participant ID
  static async updateParticipantStatusById(participantId, status) {
    try {
      // Try normal update first
      const { data, error } = await supabase
        .from('announcement_participants')
        .update({ status })
        .eq('id', participantId);

      if (error) {
        // If trigger error, use delete and re-insert approach
        if (error.message.includes('updated_at')) {
          console.log('🔄 Using delete and re-insert approach for participant update');
          
          // Get current participant data
          const { data: currentParticipant, error: fetchError } = await supabase
            .from('announcement_participants')
            .select('*')
            .eq('id', participantId)
            .single();
          
          if (fetchError) {
            throw new Error(`Could not fetch participant: ${fetchError.message}`);
          }
          
          // Delete current record
          await supabase
            .from('announcement_participants')
            .delete()
            .eq('id', participantId);
          
          // Re-insert with new status
          const { data: newParticipant, error: insertError } = await supabase
            .from('announcement_participants')
            .insert({
              announcement_id: currentParticipant.announcement_id,
              user_id: currentParticipant.user_id,
              status: status,
              joined_at: currentParticipant.joined_at,
              paid: currentParticipant.paid,
              chat_id: currentParticipant.chat_id
            })
            .select(`
              id,
              announcement_id,
              user_id,
              status,
              joined_at,
              user:users(id, name, email, phone_number)
            `)
            .single();
          
          if (insertError) {
            throw new Error(`Re-insert failed: ${insertError.message}`);
          }
          
          return newParticipant;
        } else {
          throw error;
        }
      }
      
      // Fetch the updated participant with user details
      const { data: participant, error: fetchError } = await supabase
        .from('announcement_participants')
        .select(`
          id,
          announcement_id,
          user_id,
          status,
          joined_at,
          user:users(id, name, email, phone_number)
        `)
        .eq('id', participantId)
        .single();

      if (fetchError) throw fetchError;
      return participant;
    } catch (error) {
      throw new Error(`Error updating participant status by ID: ${error.message}`);
    }
  }

  // Remove participant
  static async removeParticipant(announcementId, userId) {
    try {
      const { error } = await supabase
        .from('announcement_participants')
        .delete()
        .eq('announcement_id', announcementId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Error removing participant: ${error.message}`);
    }
  }

  // Get announcements by user (created or participated)
  static async findByUser(userId, type = 'all') {
    try {
      if (type === 'created') {
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            created_by:users(id, name, email, phone_number),
            joinedBy:announcement_participants(
              *,
              user:users(id, name, email, phone_number)
            )
          `)
          .eq('created_by', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      } else if (type === 'participated') {
        const { data, error } = await supabase
          .from('announcement_participants')
          .select(`
            *,
            announcement:announcements(
              *,
              created_by:users(id, name, email, phone_number),
              joinedBy:announcement_participants(
                *,
                user:users(id, name, email, phone_number)
              )
            )
          `)
          .eq('user_id', userId)
          .order('joined_at', { ascending: false });

        if (error) throw error;
        return data.map(p => p.announcement);
      } else {
        // All announcements related to user
        const [created, participated] = await Promise.all([
          this.findByUser(userId, 'created'),
          this.findByUser(userId, 'participated')
        ]);

        // Combine and remove duplicates
        const allAnnouncements = [...created, ...participated];
        const uniqueAnnouncements = allAnnouncements.filter((announcement, index, self) =>
          index === self.findIndex(a => a.id === announcement.id)
        );

        return uniqueAnnouncements.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      }
    } catch (error) {
      throw new Error(`Error finding user announcements: ${error.message}`);
    }
  }

  // Count announcements
  static async count(filters = {}) {
    try {
      let query = supabase.from('announcements').select('*', { count: 'exact', head: true });

      // Apply filters
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.rideCompleted !== undefined) {
        query = query.eq('ride_completed', filters.rideCompleted);
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count;
    } catch (error) {
      throw new Error(`Error counting announcements: ${error.message}`);
    }
  }

  // Get available seats for announcement
  static async getAvailableSeats(announcementId) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('passenger_capacity')
        .eq('id', announcementId)
        .single();

      if (error) throw error;

      const { count: participantCount } = await supabase
        .from('announcement_participants')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', announcementId)
        .eq('status', 'accepted');

      return data.passenger_capacity - (participantCount || 0);
    } catch (error) {
      throw new Error(`Error getting available seats: ${error.message}`);
    }
  }

  // Mark announcement as completed
  static async markAsCompleted(announcementId) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          ride_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', announcementId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Error marking announcement as completed: ${error.message}`);
    }
  }
}

module.exports = AnnouncementService;
