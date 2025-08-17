# Cal.com Integration - Documentation

## 🎯 Overview

The Cal.com integration allows buyers to schedule video calls with sellers directly from product pages. This feature provides a professional, user-friendly scheduling experience that integrates seamlessly with the SocyAds platform.

## 🏗️ Architecture

### Backend Components

1. **CalService** (`src/services/calService.js`)
   - Handles Cal.com API interactions
   - Manages meeting scheduling and booking
   - Provides embed code generation
   - Handles availability checking

2. **Cal Routes** (`src/routes/calRoutes.js`)
   - RESTful API endpoints for Cal.com functionality
   - Input validation and error handling
   - Authentication middleware integration
   - Swagger documentation

3. **Database Integration**
   - Stores meeting metadata
   - Links bookings to gigs and users
   - Tracks meeting status and history

### Frontend Components

1. **MeetingScheduler Component** (`frontend/src/components/common/MeetingScheduler.tsx`)
   - React component with TypeScript
   - Beautiful, intuitive scheduling interface
   - Date and time selection
   - Meeting type selection
   - Real-time availability checking

2. **CalService** (`frontend/src/services/calService.ts`)
   - Frontend service for Cal.com API calls
   - Handles authentication and requests
   - Provides utility functions for date/time formatting

## 🚀 Features

### Core Functionality

- **Professional Scheduling**: Beautiful, customizable booking interface
- **Multiple Meeting Types**: Support for different consultation types
- **Real-time Availability**: Check seller's available time slots
- **Calendar Integration**: Syncs with Google Calendar, Outlook
- **Automated Reminders**: Email notifications for meetings
- **Video Platform Support**: Google Meet, Teams, etc.
- **Payment Integration**: Handle consultation fees (optional)

### User Experience

- **Intuitive Interface**: Clean, modern scheduling design
- **Date/Time Selection**: Easy calendar and time slot picking
- **Meeting Type Selection**: Choose from available consultation types
- **Real-time Updates**: Instant availability checking
- **Mobile Responsive**: Works perfectly on all devices
- **Direct Cal.com Link**: Alternative booking option

### Integration Features

- **Product Page Integration**: Seamlessly integrated into gig pages
- **Seller Profile Linking**: Connects to seller's Cal.com account
- **Gig Context**: Maintains context of what the meeting is about
- **User Authentication**: Secure booking with user accounts
- **Booking History**: Track all scheduled meetings

## 🔧 Setup Instructions

### 1. Cal.com Account Setup

1. **Create Cal.com Account**
   - Go to [cal.com](https://cal.com)
   - Sign up for a free account
   - Complete your profile setup

2. **Configure Event Types**
   - Create consultation event types
   - Set duration, availability, and pricing
   - Configure video conferencing settings

3. **Get API Credentials**
   - Go to Cal.com Settings → Developer
   - Generate API key
   - Note your username

### 2. Backend Configuration

1. **Environment Variables**
   ```bash
   # Add to .env file
   CAL_API_KEY=your_cal_api_key_here
   CAL_USERNAME=your_cal_username_here
   CAL_API_URL=https://api.cal.com
   CAL_BASE_URL=https://cal.com
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   npm install axios
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration

1. **Environment Variables**
   ```bash
   # Add to .env file
   VITE_API_URL=http://localhost:5000
   VITE_CAL_BASE_URL=https://cal.com
   ```

2. **Component Integration**
   - Import `MeetingScheduler` component
   - Add to product pages
   - Configure seller information

## 📋 API Endpoints

### Health Check
- `GET /api/cal/health` - Check Cal.com service status

### Booking Management
- `GET /api/cal/booking-link/{sellerId}` - Get seller's booking link
- `POST /api/cal/book` - Create new meeting booking
- `GET /api/cal/bookings/{bookingId}` - Get booking details
- `DELETE /api/cal/bookings/{bookingId}/cancel` - Cancel booking

### Availability & Scheduling
- `GET /api/cal/available-slots` - Get available time slots
- `GET /api/cal/event-types/{sellerUsername}` - Get seller's event types
- `GET /api/cal/embed/{sellerUsername}` - Get embed code

## 🎨 Frontend Component Usage

### Basic Integration
```tsx
import MeetingScheduler from '../components/common/MeetingScheduler';

<MeetingScheduler
  sellerUsername="techguru"
  sellerName="Tech Guru Mike"
  gigId="gig-123"
  sellerId="seller-456"
  onBookingComplete={(booking) => {
    console.log('Meeting scheduled:', booking);
  }}
/>
```

### Props
- `sellerUsername`: Cal.com username of the seller
- `sellerName`: Display name of the seller
- `gigId`: ID of the gig/service
- `sellerId`: Internal seller ID
- `onBookingComplete`: Callback when booking is completed
- `className`: Additional CSS classes

### Features
- **Meeting Type Selection**: Choose from available consultation types
- **Date Picker**: Select from next 7 business days
- **Time Slots**: Available time slots based on seller's calendar
- **Real-time Validation**: Instant feedback on selections
- **Success/Error Handling**: Clear user feedback

## 🔒 Security Features

1. **Authentication Required**
   - Booking creation requires user authentication
   - JWT token validation
   - User context maintained

2. **Input Validation**
   - Comprehensive request validation
   - Date/time format validation
   - Required field checking

3. **Rate Limiting**
   - Integrated with existing rate limiting
   - Prevents API abuse
   - Configurable limits

4. **Error Handling**
   - Graceful error responses
   - User-friendly error messages
   - No sensitive information exposed

## 🧪 Testing

### Manual Testing
1. **Health Check**
   ```bash
   curl http://localhost:5000/api/cal/health
   ```

2. **Test Endpoints**
   ```bash
   # Test booking link generation
   curl http://localhost:5000/api/cal/booking-link/seller-1
   
   # Test available slots
   curl "http://localhost:5000/api/cal/available-slots?sellerUsername=demo&date=2024-01-25&duration=30"
   ```

### Automated Testing
```bash
# Run Cal.com integration tests
npm run test:cal
```

### Test Coverage
- ✅ Health endpoint
- ✅ Booking link generation
- ✅ Available slots retrieval
- ✅ Event types fetching
- ✅ Embed code generation
- ✅ Authentication validation

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set production Cal.com API credentials
   - Configure production API URLs
   - Set appropriate rate limits

2. **Cal.com Configuration**
   - Configure production event types
   - Set up production video conferencing
   - Test booking flow in production

3. **Monitoring**
   - Monitor API usage and costs
   - Track booking success rates
   - Monitor user satisfaction

## 🔮 Future Enhancements

1. **Advanced Features**
   - Recurring meetings
   - Group consultations
   - Payment integration
   - Automated follow-ups

2. **Analytics**
   - Meeting success metrics
   - Seller availability analytics
   - User engagement tracking

3. **Integration**
   - CRM integration
   - Email marketing automation
   - Customer support integration

## 📞 Support

For issues or questions about Cal.com integration:

1. Check the health endpoint: `/api/cal/health`
2. Review Cal.com API documentation
3. Test with the provided test script
4. Check environment variable configuration

## 🎯 Benefits

### For Buyers
- **Professional Experience**: Beautiful, intuitive scheduling
- **Flexible Booking**: Choose from available time slots
- **Automated Reminders**: Never miss a meeting
- **Multiple Options**: Direct booking or Cal.com redirect

### For Sellers
- **Professional Image**: Branded booking pages
- **Automated Scheduling**: No manual coordination needed
- **Calendar Sync**: Integrates with existing workflows
- **Customizable**: Set availability and pricing

### For Platform
- **Enhanced UX**: Professional scheduling experience
- **Increased Engagement**: More consultation bookings
- **Revenue Growth**: Potential for consultation fees
- **Competitive Advantage**: Professional scheduling integration

---

**Status: ✅ Ready for Production**

The Cal.com integration provides a **comprehensive, secure, and user-friendly** scheduling solution that enhances the SocyAds platform with professional meeting scheduling capabilities.
