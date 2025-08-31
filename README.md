# Socyads Backend

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0%2B-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18%2B-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

A comprehensive backend API for the Socyads influencer marketplace platform, built with Node.js, Express.js, and MongoDB. This platform connects businesses with social media influencers across various platforms including YouTube, Instagram, TikTok, Facebook, Twitter, and LinkedIn.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, authentication, and profile management for buyers and sellers
- **Gig Management**: Create, browse, and manage influencer service offerings
- **Order System**: Complete order lifecycle from placement to completion
- **Review System**: Comprehensive rating and review system for services
- **File Upload**: Secure image and video upload with ImageKit integration
- **Search & Discovery**: Advanced gig search with filtering and sorting
- **Dashboard Analytics**: Comprehensive dashboards for buyers and sellers

### Platform Features
- **Multi-Platform Support**: YouTube, Instagram, TikTok, Facebook, Twitter, LinkedIn
- **Package Tiers**: Basic, Standard, and Premium service packages
- **Real-time Messaging**: Order communication system
- **Calendar Integration**: Cal.com integration for consultations
- **AI Recommendations**: AI-powered creator discovery and matching
- **Admin Panel**: Complete admin dashboard for platform management

### Security & Performance
- **Authentication**: Dual authentication system (JWT + Clerk)
- **Rate Limiting**: Request rate limiting for API protection
- **Data Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Centralized error handling with detailed logging
- **Security Headers**: Helmet.js for security headers
- **CORS Configuration**: Configurable CORS for frontend integration

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & Clerk Integration
- **File Storage**: ImageKit
- **Email**: Nodemailer
- **Validation**: Custom validation middleware
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: Nodemon for hot reloading

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **MongoDB** (version 6.0 or higher)
- **npm** or **yarn** package manager

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/socyads
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/socyads

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Clerk Authentication (Optional)
CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key
CLERK_SECRET_KEY=sk_test_your-clerk-secret-key

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=public_your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=private_your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Password Hashing
BCRYPT_ROUNDS=12

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/socyads-backend.git
cd socyads-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env  # or use your preferred editor
```

### 4. Database Setup
Make sure MongoDB is running locally or provide a MongoDB Atlas connection string in your `.env` file.

### 5. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your specified PORT).

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer your-jwt-token
```

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - User login
- `POST /test-login` - Test login (development only)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `POST /logout` - User logout
- `POST /verify-token` - Verify JWT token
- `POST /request-password-reset` - Request password reset
- `POST /reset-password` - Reset password
- `POST /clerk-webhook` - Clerk webhook handler

#### Users (`/api/users`)
- `GET /profile` - Get current user profile
- `GET /:id` - Get user by ID
- `PUT /profile` - Update user profile
- `POST /become-seller` - Upgrade to seller account
- `GET /seller-application-status` - Get seller application status
- `GET /` - Get all users (admin only)

#### Gigs (`/api/gigs`)
- `GET /` - Get all active gigs (with filtering)
- `GET /:id` - Get gig by ID
- `POST /` - Create new gig (seller only)
- `PUT /:id` - Update gig (seller only)
- `DELETE /:id` - Delete gig (seller only)
- `GET /seller/:sellerId` - Get gigs by seller
- `GET /featured` - Get featured gigs
- `GET /search` - Search gigs

#### Orders (`/api/orders`)
- `GET /` - Get user's orders
- `POST /` - Create new order
- `GET /:id` - Get order by ID
- `PATCH /:id/status` - Update order status

#### Reviews (`/api/reviews`)
- `GET /gig/:gigId` - Get reviews for a gig
- `POST /` - Create review
- `POST /:id/helpful` - Mark review as helpful

#### File Upload (`/api/upload`)
- `GET /auth` - Get ImageKit authentication parameters
- `POST /single` - Upload single file
- `POST /multiple` - Upload multiple files

#### Dashboard (`/api/dashboard`)
- `GET /buyer` - Buyer dashboard data
- `GET /seller` - Seller dashboard data (seller only)

#### Admin (`/api/admin`)
- `GET /dashboard` - Admin dashboard stats
- `GET /users` - Get all users (admin only)
- `GET /gigs` - Get all gigs (admin only)
- `GET /seller-applications` - Get seller applications
- `POST /seller-applications/:userId/approve` - Approve seller
- `POST /seller-applications/:userId/reject` - Reject seller

#### AI Features (`/api/ai`)
- `POST /recommend-creators` - Get AI creator recommendations
- `POST /analyze-content` - Analyze content with AI

#### Calendar (`/api/cal`)
- `GET /event-types/:username` - Get event types for seller
- `GET /available-slots/:username` - Get available time slots
- `POST /bookings` - Create booking

### Response Format

All API responses follow this standard format:

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {} // Additional error details (development only)
  }
}
```

## 🗃️ Database Models

### User Model
- **Basic Info**: email, username, password, firstName, lastName
- **Profile**: avatar, bio, location, preferences
- **Roles**: buyer, seller, admin
- **Seller Profile**: professional title, experience, skills, portfolio, social accounts
- **Buyer Profile**: company, industry, spending stats
- **Verification**: email, identity, phone verification status

### Gig Model
- **Basic Info**: title, description, category, tags
- **Media**: images, video, thumbnails
- **Packages**: Basic, Standard, Premium with pricing and features
- **Requirements**: buyer requirements for order
- **Stats**: views, clicks, orders, ratings, earnings
- **Status**: draft, pending, active, paused, rejected

### Order Model
- **Parties**: buyer, seller references
- **Gig Info**: gig reference, package selection
- **Pricing**: subtotal, fees, total amount
- **Status**: pending, accepted, in_progress, delivered, completed, etc.
- **Communication**: messages, attachments
- **Deliverables**: files, content, completion proof
- **Revisions**: revision requests and responses

### Review Model
- **Ratings**: overall, communication, service quality, delivery time
- **Content**: title, comment, images
- **Engagement**: helpful votes, seller responses
- **Moderation**: flagging system, admin review

## 🔒 Security Features

- **JWT Authentication** with configurable expiration
- **Password Hashing** using bcryptjs with configurable rounds
- **Rate Limiting** to prevent API abuse
- **Input Validation** and sanitization
- **CORS Configuration** for cross-origin requests
- **Security Headers** via Helmet.js
- **File Upload Validation** with type and size restrictions
- **Error Handling** without sensitive data exposure

## 🚦 Health Check

The API includes a health check endpoint:

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "message": "Socyads API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## 📝 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests (not implemented yet)
npm test
```

### Code Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # MongoDB connection
│   └── imagekit.js  # ImageKit configuration
├── controllers/     # Route controllers
│   └── authController.js
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication middleware
│   ├── errorHandler.js  # Error handling
│   ├── notFound.js  # 404 handler
│   └── validation.js    # Input validation
├── models/          # Mongoose models
│   ├── User.js
│   ├── Gig.js
│   ├── Order.js
│   ├── Review.js
│   └── index.js
├── routes/          # API routes
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── gigRoutes.js
│   ├── orderRoutes.js
│   ├── reviewRoutes.js
│   ├── uploadRoutes.js
│   ├── adminRoutes.js
│   ├── dashboardRoutes.js
│   ├── aiRoutes.js
│   └── calRoutes.js
├── services/        # Business logic services
└── utils/           # Utility functions
```

## 🧪 Testing

Testing setup is included but not yet implemented. To add tests:

1. Install testing dependencies:
```bash
npm install --save-dev jest supertest
```

2. Update the test script in `package.json`
3. Create test files in a `tests/` directory

## 🚀 Deployment

### Environment Variables for Production
Make sure to set these environment variables in your production environment:

- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET`
- Configure production MongoDB URI
- Set up ImageKit for file storage
- Configure Clerk for authentication (if using)

### Docker Deployment (Optional)
You can containerize this application:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Platform Deployment Examples

#### Heroku
```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code structure and patterns
- Add appropriate error handling
- Include input validation for new endpoints
- Update documentation for new features
- Test your changes thoroughly

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you have any questions or run into issues:

1. Check the [Issues](https://github.com/yourusername/socyads-backend/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🔮 Roadmap

- [ ] Implement comprehensive testing suite
- [ ] Add real-time notifications with WebSockets
- [ ] Integrate payment processing (Stripe/PayPal)
- [ ] Add advanced analytics and reporting
- [ ] Implement caching with Redis
- [ ] Add API rate limiting per user
- [ ] Implement real AI/ML recommendations
- [ ] Add multi-language support
- [ ] Implement advanced search with Elasticsearch

---

**Made with ❤️ for the influencer marketing community**
#   i d e a l i z e - b a c k - e n d  
 