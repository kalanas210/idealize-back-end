# Zoom API Integration Guide

## Overview

This guide explains how to set up and use the Zoom API integration for video meeting scheduling in the SocyAds platform.

## Features

- ✅ **Schedule Zoom Meetings** - Create video calls between buyers and sellers
- ✅ **Meeting Management** - View, update, and cancel meetings
- ✅ **Database Storage** - Store meeting details locally
- ✅ **Email Notifications** - Send meeting invitations (ready for integration)
- ✅ **Real-time Status** - Track meeting status (scheduled, started, completed, etc.)
- ✅ **Security** - JWT authentication and meeting access control

## Setup Instructions

### 1. Zoom App Configuration

1. **Create a Zoom App**:
   - Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
   - Sign in with your Zoom account
   - Click "Develop" → "Build App"
   - Choose "Server-to-Server OAuth" app type

2. **Configure App Settings**:
   - App Name: `SocyAds Video Meetings`
   - App Type: `Server-to-Server OAuth`
   - App Category: `Business Solutions`

3. **Get Credentials**:
   - Copy your `Account ID`
   - Copy your `Client ID`
   - Copy your `Client Secret`

### 2. Environment Variables

Add these to your `.env` file:

```env
# Zoom API Configuration
ZOOM_ACCOUNT_ID=your_zoom_account_id_here
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
```

### 3. Database Setup

The Zoom integration requires a new table. Run the setup script:

```bash
npm run setup
```

This will create the `zoom_meetings` table with all necessary indexes.

## API Endpoints

### Schedule a Meeting

```http
POST /api/zoom/meetings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "startTime": "2024-01-20T14:00:00Z",
  "duration": 30,
  "topic": "SocyAds Consultation - Tech Review",
  "timezone": "America/New_York",
  "sellerId": "uuid-of-seller",
  "gigId": "uuid-of-gig"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "123456789",
    "joinUrl": "https://zoom.us/j/123456789?pwd=abc123",
    "startUrl": "https://zoom.us/s/123456789?zak=xyz789",
    "topic": "SocyAds Consultation - Tech Review",
    "startTime": "2024-01-20T14:00:00Z",
    "duration": 30,
    "password": "abc123",
    "id": "uuid-of-meeting-record"
  },
  "message": "Meeting scheduled successfully"
}
```

### Get User's Meetings

```http
GET /api/zoom/meetings?page=1&limit=10&role=buyer
Authorization: Bearer <jwt_token>
```

### Get Meeting Details

```http
GET /api/zoom/meetings/{meetingId}
Authorization: Bearer <jwt_token>
```

### Update Meeting

```http
PATCH /api/zoom/meetings/{meetingId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "topic": "Updated Meeting Topic",
  "start_time": "2024-01-21T15:00:00Z",
  "duration": 45
}
```

### Cancel Meeting

```http
DELETE /api/zoom/meetings/{meetingId}
Authorization: Bearer <jwt_token>
```

### Join Meeting

```http
POST /api/zoom/meetings/{meetingId}/join
Authorization: Bearer <jwt_token>
```

## Frontend Integration

### 1. Import Zoom Service

```typescript
import { zoomService, type MeetingScheduleRequest } from '../services/zoomService';
```

### 2. Schedule a Meeting

```typescript
const scheduleMeeting = async () => {
  try {
    const meetingData: MeetingScheduleRequest = {
      startTime: new Date('2024-01-20T14:00:00Z').toISOString(),
      duration: 30,
      topic: 'SocyAds Consultation',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      sellerId: 'seller-uuid',
      gigId: 'gig-uuid'
    };

    const meeting = await zoomService.scheduleMeeting(meetingData);
    console.log('Meeting scheduled:', meeting);
  } catch (error) {
    console.error('Failed to schedule meeting:', error);
  }
};
```

### 3. Get User's Meetings

```typescript
const getMeetings = async () => {
  try {
    const meetings = await zoomService.getMeetings(1, 10, 'buyer');
    console.log('User meetings:', meetings);
  } catch (error) {
    console.error('Failed to get meetings:', error);
  }
};
```

### 4. Join a Meeting

```typescript
const joinMeeting = async (meetingId: string) => {
  try {
    const { joinUrl, password } = await zoomService.joinMeeting(meetingId);
    window.open(joinUrl, '_blank');
  } catch (error) {
    console.error('Failed to join meeting:', error);
  }
};
```

## Database Schema

### zoom_meetings Table

```sql
CREATE TABLE zoom_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(100) UNIQUE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL CHECK (duration >= 15 AND duration <= 480),
    join_url TEXT NOT NULL,
    start_url TEXT NOT NULL,
    password VARCHAR(20) NOT NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'started', 'completed', 'cancelled', 'joined')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Meeting Status Flow

1. **scheduled** - Meeting created and scheduled
2. **started** - Meeting has begun (can be set manually or via webhook)
3. **joined** - Participant has joined the meeting
4. **completed** - Meeting has ended
5. **cancelled** - Meeting was cancelled

## Security Features

- **JWT Authentication** - All endpoints require valid JWT tokens
- **Meeting Access Control** - Users can only access their own meetings
- **Input Validation** - Comprehensive validation for all meeting data
- **Rate Limiting** - API rate limiting to prevent abuse
- **Secure Passwords** - Random meeting passwords generated automatically

## Error Handling

The integration includes comprehensive error handling:

```typescript
try {
  const meeting = await zoomService.scheduleMeeting(meetingData);
} catch (error) {
  if (error.message.includes('Start time must be in the future')) {
    // Handle validation error
  } else if (error.message.includes('Failed to authenticate with Zoom API')) {
    // Handle Zoom API authentication error
  } else {
    // Handle general error
  }
}
```

## Email Integration (Future Enhancement)

The system is prepared for email integration. To enable email notifications:

1. **Configure Email Service** (SendGrid, AWS SES, etc.)
2. **Update `sendMeetingInvitation` method** in `zoomService.js`
3. **Add email templates** for meeting invitations

Example email integration:

```javascript
// In zoomService.js
async sendMeetingInvitation(meetingData, buyerEmail, sellerEmail) {
  const emailService = new EmailService();
  
  await emailService.sendTemplate('meeting-invitation', {
    to: [buyerEmail, sellerEmail],
    data: {
      meetingId: meetingData.meetingId,
      topic: meetingData.topic,
      startTime: meetingData.startTime,
      joinUrl: meetingData.joinUrl,
      password: meetingData.password
    }
  });
}
```

## Testing

### Test Zoom Integration

```bash
# Test meeting scheduling
curl -X POST http://localhost:5000/api/zoom/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2024-01-20T14:00:00Z",
    "duration": 30,
    "topic": "Test Meeting",
    "sellerId": "seller-uuid",
    "gigId": "gig-uuid"
  }'
```

### Test Meeting Retrieval

```bash
# Get user's meetings
curl -X GET "http://localhost:5000/api/zoom/meetings?role=buyer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Zoom API Authentication Error**
   - Verify your Zoom credentials in `.env`
   - Check that your Zoom app is properly configured
   - Ensure your Zoom account has the necessary permissions

2. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Run `npm run setup` to create required tables

3. **JWT Token Issues**
   - Ensure user is authenticated
   - Check token expiration
   - Verify token format

4. **Meeting Scheduling Validation**
   - Start time must be in the future
   - Duration must be between 15-480 minutes
   - All required fields must be provided

### Debug Mode

Enable debug logging by setting:

```env
LOG_LEVEL=debug
```

This will show detailed Zoom API request/response logs.

## Best Practices

1. **Always validate meeting data** before sending to Zoom API
2. **Handle timezone conversion** properly
3. **Implement proper error handling** for all API calls
4. **Use environment variables** for all sensitive data
5. **Test thoroughly** in development before production
6. **Monitor API usage** to stay within Zoom limits
7. **Implement retry logic** for failed API calls
8. **Cache access tokens** to reduce API calls

## Rate Limits

Zoom API has rate limits:
- **Create Meeting**: 100 requests per day
- **Get Meetings**: 1000 requests per day
- **Update/Delete**: 100 requests per day

Monitor your usage to avoid hitting limits.

## Support

For issues with:
- **Zoom API**: Contact Zoom Developer Support
- **Integration**: Check the troubleshooting section above
- **Database**: Verify PostgreSQL configuration
- **Authentication**: Check JWT token configuration

---

**Note**: This integration provides a solid foundation for video meeting functionality. The system is designed to be scalable and can be extended with additional features like meeting recordings, analytics, and more advanced scheduling options. 