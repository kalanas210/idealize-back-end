# Ask with AI Feature - Documentation

## 🎯 Overview

The "Ask with AI" feature allows users to describe their campaign needs in natural language and receive intelligent recommendations for the best content creators from the SocyAds platform. The AI analyzes user queries and matches them with relevant creators based on factors like audience demographics, content niche, location, and engagement rates.

## 🏗️ Architecture

### Backend Components

1. **AI Service** (`src/services/aiService.js`)
   - Handles OpenAI API interactions
   - Processes user queries and generates recommendations
   - Manages creator data retrieval from database
   - Provides fallback mock data for development

2. **AI Routes** (`src/routes/aiRoutes.js`)
   - RESTful API endpoints for AI functionality
   - Input validation and error handling
   - Health check endpoint for service monitoring

3. **Database Integration**
   - Uses existing `users` table with `seller` role
   - Joins with `social_accounts` table for platform data
   - Fallback to mock data when database is not available

### Frontend Components

1. **AskWithAI Component** (`frontend/src/components/home/AskWithAI.tsx`)
   - React component with TypeScript
   - Form handling and validation
   - Real-time response display
   - Error handling and loading states

2. **Integration**
   - Added to homepage after Hero section
   - Responsive design with Tailwind CSS
   - Consistent styling with existing components

## 🚀 Features

### Core Functionality

- **Natural Language Processing**: Users can describe campaigns in plain English
- **Intelligent Matching**: AI analyzes creator profiles and matches them to campaign needs
- **Top 3 Recommendations**: Returns the best 3 creators with detailed explanations
- **Real-time Processing**: Instant AI-powered recommendations
- **Fallback Support**: Works with mock data when OpenAI is not configured

### User Experience

- **Simple Interface**: Clean, intuitive form design
- **Example Queries**: Pre-filled examples to help users get started
- **Loading States**: Visual feedback during AI processing
- **Error Handling**: Clear error messages and recovery options
- **Responsive Design**: Works on all device sizes

### Security & Validation

- **Input Validation**: Query length and character restrictions
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Graceful degradation for service failures
- **Environment Variables**: Secure API key management

## 📊 Data Flow

```
User Input → Frontend Validation → Backend API → AI Service → OpenAI API → 
Response Processing → Database/Mock Data → Recommendation Generation → 
Frontend Display
```

## 🔧 Setup Instructions

### 1. Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install openai
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add OpenAI API key
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Database Setup** (Optional)
   - The feature works with mock data by default
   - For production, ensure `users` and `social_accounts` tables exist
   - Add seller users with social account information

### 2. Frontend Setup

1. **Component Integration**
   - The `AskWithAI` component is already integrated into the homepage
   - No additional setup required

2. **API Configuration**
   - Frontend connects to `http://localhost:5000/api/ai/ask`
   - Update URL for production deployment

### 3. Testing

```bash
# Test AI functionality
npm run test:ai

# Test specific components
node test-ai-feature.js
```

## 📋 API Endpoints

### POST `/api/ai/ask`

**Request:**
```json
{
  "userQuery": "I want to promote cricket shoes to 18-30 year-old men in Sri Lanka"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI recommendations generated successfully",
  "data": {
    "query": "I want to promote cricket shoes to 18-30 year-old men in Sri Lanka",
    "recommendations": "## Top 3 Creator Recommendations\n\n### 1. CricketPro Raj - YouTube\n**Why this creator is perfect for your campaign:**\nCricketPro Raj specializes in cricket content and equipment reviews, making them ideal for promoting cricket shoes to cricket enthusiasts.\n\n**Key strengths:**\n- Cricket-focused content and audience\n- Equipment review expertise\n- Large following in cricket community",
    "creatorsAnalyzed": 6
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### GET `/api/ai/health`

**Response:**
```json
{
  "success": true,
  "message": "AI service is healthy",
  "data": {
    "openaiConfigured": true,
    "databaseConnected": true,
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

## 🎨 Frontend Component

### Props
- None (self-contained component)

### State
- `query`: User input text
- `isLoading`: Loading state during API calls
- `response`: AI response data
- `error`: Error message if any

### Features
- **Form Validation**: Ensures query meets requirements
- **Loading States**: Visual feedback during processing
- **Error Handling**: Displays user-friendly error messages
- **Response Formatting**: Converts markdown to JSX
- **Example Queries**: Clickable examples for quick testing

## 🔒 Security Considerations

1. **API Key Protection**
   - OpenAI API key stored in environment variables
   - Never exposed in client-side code
   - Server-side validation and processing

2. **Input Validation**
   - Query length limits (10-500 characters)
   - Character restrictions to prevent injection
   - Server-side validation with express-validator

3. **Rate Limiting**
   - Integrated with existing rate limiting middleware
   - Prevents API abuse and excessive OpenAI usage

4. **Error Handling**
   - Graceful degradation when services are unavailable
   - User-friendly error messages
   - No sensitive information exposed in errors

## 🧪 Testing

### Manual Testing

1. **Health Check**
   ```bash
   curl http://localhost:5000/api/ai/health
   ```

2. **AI Query**
   ```bash
   curl -X POST http://localhost:5000/api/ai/ask \
     -H "Content-Type: application/json" \
     -d '{"userQuery": "I want to promote cricket shoes to 18-30 year-old men in Sri Lanka"}'
   ```

3. **Validation Testing**
   ```bash
   # Test empty query
   curl -X POST http://localhost:5000/api/ai/ask \
     -H "Content-Type: application/json" \
     -d '{"userQuery": ""}'
   ```

### Automated Testing

```bash
# Run AI feature tests
npm run test:ai
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `OPENAI_API_KEY` in production environment
   - Configure `NODE_ENV=production`
   - Update API URLs for production domain

2. **Database**
   - Ensure production database is properly configured
   - Add real creator data to `users` and `social_accounts` tables
   - Test database connectivity

3. **Monitoring**
   - Monitor OpenAI API usage and costs
   - Set up error tracking for AI service failures
   - Monitor response times and user satisfaction

4. **Scaling**
   - Consider caching for frequently requested queries
   - Implement request queuing for high traffic
   - Monitor OpenAI rate limits

## 🔮 Future Enhancements

1. **Advanced Matching**
   - Machine learning models for better creator matching
   - Historical performance data integration
   - Campaign success prediction

2. **User Experience**
   - Query suggestions and autocomplete
   - Saved queries and recommendations
   - Direct creator contact integration

3. **Analytics**
   - Query analytics and insights
   - Creator performance tracking
   - Campaign success metrics

4. **Multi-language Support**
   - Support for multiple languages in queries
   - Localized creator recommendations
   - Cultural context awareness

## 📞 Support

For issues or questions about the AI feature:

1. Check the health endpoint: `/api/ai/health`
2. Review error logs in the backend console
3. Verify OpenAI API key configuration
4. Test with the provided test script

---

**Status: ✅ Ready for Production** 