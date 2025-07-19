const axios = require('axios');
const { pool } = require('../config/database');

class ZoomService {
  constructor() {
    this.baseURL = 'https://api.zoom.us/v2';
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get Zoom access token
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Get new token
      const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
          grant_type: 'account_credentials',
          account_id: this.accountId
        },
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error getting Zoom access token:', error.message);
      throw new Error('Failed to authenticate with Zoom API');
    }
  }

  /**
   * Create a Zoom meeting
   */
  async createMeeting(meetingData) {
    try {
      const token = await this.getAccessToken();
      
      const meetingPayload = {
        topic: meetingData.topic || 'SocyAds Video Consultation',
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime,
        duration: meetingData.duration || 30,
        timezone: meetingData.timezone || 'UTC',
        password: this.generateMeetingPassword(),
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0,
          audio: 'both',
          auto_recording: 'none'
        }
      };

      const response = await axios.post(`${this.baseURL}/users/me/meetings`, meetingPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        meetingId: response.data.id,
        joinUrl: response.data.join_url,
        startUrl: response.data.start_url,
        password: response.data.password,
        topic: response.data.topic,
        startTime: response.data.start_time,
        duration: response.data.duration
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting meeting details:', error.response?.data || error.message);
      throw new Error('Failed to get meeting details');
    }
  }

  /**
   * Update meeting
   */
  async updateMeeting(meetingId, updateData) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.patch(`${this.baseURL}/meetings/${meetingId}`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating meeting:', error.response?.data || error.message);
      throw new Error('Failed to update meeting');
    }
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(meetingId) {
    try {
      const token = await this.getAccessToken();
      
      await axios.delete(`${this.baseURL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting meeting:', error.response?.data || error.message);
      throw new Error('Failed to delete meeting');
    }
  }

  /**
   * Get user's meetings
   */
  async getUserMeetings(userId, pageSize = 30, nextPageToken = null) {
    try {
      const token = await this.getAccessToken();
      
      const params = {
        page_size: pageSize
      };
      
      if (nextPageToken) {
        params.next_page_token = nextPageToken;
      }

      const response = await axios.get(`${this.baseURL}/users/${userId}/meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user meetings:', error.response?.data || error.message);
      throw new Error('Failed to get user meetings');
    }
  }

  /**
   * Generate a random meeting password
   */
  generateMeetingPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Save meeting to database
   */
  async saveMeetingToDatabase(meetingData) {
    try {
      // TODO: Replace with actual database query when DB is ready
      /*
      const query = `
        INSERT INTO zoom_meetings (
          meeting_id, 
          topic, 
          start_time, 
          duration, 
          join_url, 
          start_url, 
          password,
          buyer_id,
          seller_id,
          gig_id,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `;

      const values = [
        meetingData.meetingId,
        meetingData.topic,
        meetingData.startTime,
        meetingData.duration,
        meetingData.joinUrl,
        meetingData.startUrl,
        meetingData.password,
        meetingData.buyerId,
        meetingData.sellerId,
        meetingData.gigId,
        'scheduled'
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
      */

      // Mock response for development
      const mockMeeting = {
        id: '1',
        meeting_id: meetingData.meetingId,
        topic: meetingData.topic,
        start_time: meetingData.startTime,
        duration: meetingData.duration,
        join_url: meetingData.joinUrl,
        start_url: meetingData.startUrl,
        password: meetingData.password,
        buyer_id: meetingData.buyerId,
        seller_id: meetingData.sellerId,
        gig_id: meetingData.gigId,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Mock meeting saved:', mockMeeting);
      return mockMeeting;
    } catch (error) {
      console.error('Error saving meeting to database:', error);
      throw new Error('Failed to save meeting to database');
    }
  }

  /**
   * Get meetings from database
   */
  async getMeetingsFromDatabase(userId, role = 'buyer', page = 1, limit = 10) {
    try {
      // TODO: Replace with actual database query when DB is ready
      /*
      const offset = (page - 1) * limit;
      const whereClause = role === 'buyer' ? 'buyer_id = $1' : 'seller_id = $1';
      
      const query = `
        SELECT 
          zm.*,
          u1.name as buyer_name,
          u1.email as buyer_email,
          u2.name as seller_name,
          u2.email as seller_email,
          g.title as gig_title
        FROM zoom_meetings zm
        LEFT JOIN users u1 ON zm.buyer_id = u1.id
        LEFT JOIN users u2 ON zm.seller_id = u2.id
        LEFT JOIN gigs g ON zm.gig_id = g.id
        WHERE ${whereClause}
        ORDER BY zm.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
      */

      // Mock data for development
      const mockMeetings = [
        {
          id: '1',
          meeting_id: '123456789',
          topic: 'SocyAds Consultation - Tech Review',
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          duration: 30,
          join_url: 'https://zoom.us/j/123456789?pwd=ABC123',
          start_url: 'https://zoom.us/s/123456789?zak=xyz',
          password: 'ABC123',
          buyer_id: userId,
          seller_id: '550e8400-e29b-41d4-a716-446655440001',
          gig_id: '550e8400-e29b-41d4-a716-446655440002',
          status: 'scheduled',
          buyer_name: 'Test Buyer',
          buyer_email: 'buyer@example.com',
          seller_name: 'Tech Guru Mike',
          seller_email: 'mike@techguru.com',
          gig_title: 'Professional Tech Review Video',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return mockMeetings;
    } catch (error) {
      console.error('Error getting meetings from database:', error);
      throw new Error('Failed to get meetings from database');
    }
  }

  /**
   * Update meeting status in database
   */
  async updateMeetingStatus(meetingId, status) {
    try {
      // TODO: Replace with actual database query when DB is ready
      /*
      const query = `
        UPDATE zoom_meetings 
        SET status = $1, updated_at = NOW()
        WHERE meeting_id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [status, meetingId]);
      return result.rows[0];
      */

      // Mock response for development
      const mockMeeting = {
        id: '1',
        meeting_id: meetingId,
        status: status,
        updated_at: new Date().toISOString()
      };

      console.log(`Mock meeting status updated: ${meetingId} -> ${status}`);
      return mockMeeting;
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw new Error('Failed to update meeting status');
    }
  }

  /**
   * Send meeting invitation emails
   */
  async sendMeetingInvitation(meetingData, buyerEmail, sellerEmail) {
    try {
      // This would integrate with your email service
      // For now, we'll just log the invitation details
      console.log('Meeting invitation details:', {
        meetingId: meetingData.meetingId,
        topic: meetingData.topic,
        startTime: meetingData.startTime,
        joinUrl: meetingData.joinUrl,
        password: meetingData.password,
        buyerEmail,
        sellerEmail
      });

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      return true;
    } catch (error) {
      console.error('Error sending meeting invitation:', error);
      throw new Error('Failed to send meeting invitation');
    }
  }
}

module.exports = new ZoomService(); 