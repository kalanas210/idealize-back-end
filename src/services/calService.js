const axios = require('axios');

/**
 * Cal.com Service
 * Handles meeting scheduling between buyers and sellers
 */
class CalService {
  constructor() {
    this.baseURL = process.env.CAL_API_URL || 'https://api.cal.com';
    this.apiKey = process.env.CAL_API_KEY;
    this.username = process.env.CAL_USERNAME;
  }

  /**
   * Check if Cal.com is configured
   */
  isConfigured() {
    return !!(this.apiKey && this.username);
  }

  /**
   * Create a booking link for a seller
   */
  async createBookingLink(sellerData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cal.com is not configured');
      }

      // Create a custom booking link for the seller
      const bookingLink = `${process.env.CAL_BASE_URL || 'https://cal.com'}/${this.username}`;
      
      return {
        success: true,
        bookingLink,
        sellerName: sellerData.name,
        sellerUsername: this.username
      };
    } catch (error) {
      console.error('Cal.com booking link creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available time slots for a seller
   */
  async getAvailableSlots(sellerUsername, date, duration = 30) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cal.com is not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/v2/availability/${sellerUsername}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            dateFrom: date,
            dateTo: date,
            duration
          }
        }
      );

      return {
        success: true,
        availableSlots: response.data.availableSlots || []
      };
    } catch (error) {
      console.error('Failed to get available slots:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a meeting booking
   */
  async createBooking(bookingData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cal.com is not configured');
      }

      const response = await axios.post(
        `${this.baseURL}/v2/bookings`,
        {
          eventTypeId: bookingData.eventTypeId,
          start: bookingData.startTime,
          end: bookingData.endTime,
          attendees: [
            {
              email: bookingData.buyerEmail,
              name: bookingData.buyerName
            }
          ],
          metadata: {
            gigId: bookingData.gigId,
            buyerId: bookingData.buyerId,
            sellerId: bookingData.sellerId
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        booking: response.data,
        meetingUrl: response.data.meetingUrl,
        calendarEvent: response.data.calendarEvent
      };
    } catch (error) {
      console.error('Failed to create booking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cal.com is not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/v2/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        booking: response.data
      };
    } catch (error) {
      console.error('Failed to get booking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId, reason = '') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cal.com is not configured');
      }

      const response = await axios.delete(
        `${this.baseURL}/v2/bookings/${bookingId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          data: {
            reason
          }
        }
      );

      return {
        success: true,
        message: 'Booking cancelled successfully'
      };
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get seller's event types
   */
  async getEventTypes(sellerUsername) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Cal.com is not configured');
      }

      const response = await axios.get(
        `${this.baseURL}/v2/event-types`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            username: sellerUsername
          }
        }
      );

      return {
        success: true,
        eventTypes: response.data.eventTypes || []
      };
    } catch (error) {
      console.error('Failed to get event types:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate embed code for product pages
   */
  generateEmbedCode(sellerUsername, eventTypeId = null) {
    if (!sellerUsername) {
      return null;
    }

    const baseUrl = process.env.CAL_BASE_URL || 'https://cal.com';
    const embedUrl = eventTypeId 
      ? `${baseUrl}/${sellerUsername}/${eventTypeId}`
      : `${baseUrl}/${sellerUsername}`;

    return {
      iframe: `<iframe src="${embedUrl}" width="100%" height="700px" frameborder="0"></iframe>`,
      directLink: embedUrl,
      embedUrl: `${embedUrl}?embed=true`
    };
  }
}

module.exports = CalService;
