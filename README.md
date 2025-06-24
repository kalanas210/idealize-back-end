# SocyAds Backend API

A comprehensive Node.js Express backend for the SocyAds social media advertising platform, featuring JWT authentication, PostgreSQL database integration, and comprehensive Swagger API documentation.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Database**: PostgreSQL with connection pooling
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **File Uploads**: Multer-based file handling with validation
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Express-validator for request validation
- **Development Tools**: Nodemon for auto-restart during development

## 📁 Project Structure

```
src/
├── config/
│   └── database.js          # PostgreSQL configuration
├── controllers/             # Route controllers (reserved for future use)
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Global error handler
│   └── notFound.js         # 404 handler
├── models/                 # Database models (reserved for future use)
├── routes/
│   ├── authRoutes.js       # Authentication endpoints
│   ├── userRoutes.js       # User management
│   ├── gigRoutes.js        # Gig/service management
│   ├── orderRoutes.js      # Order processing
│   ├── reviewRoutes.js     # Review system
│   ├── messageRoutes.js    # Messaging system
│   ├── influencerRoutes.js # Influencer profiles
│   ├── adminRoutes.js      # Admin panel
│   └── uploadRoutes.js     # File uploads
├── utils/
│   ├── jwt.js             # JWT utilities
│   ├── validation.js      # Validation rules
│   └── response.js        # Standard response helpers
├── uploads/               # File upload directory
└── server.js             # Main application entry point
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

3. **Configure Database:**
   Update the database credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=socyads_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

4. **Create Database:**
   ```sql
   CREATE DATABASE socyads_db;
   ```

5. **Start Development Server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
- **Swagger UI**: `http://localhost:5000/api/docs`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Test Credentials (Development)
- **Email**: `test@example.com`
- **Password**: `password`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Social Authentication
- `GET /api/auth/google` - Initiate Google OAuth authentication
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/google/link` - Link Google account to existing user
- `POST /api/auth/google/unlink` - Unlink Google account from user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users` - Get all users (admin only)

### Gigs
- `GET /api/gigs` - Get all gigs with filtering
- `GET /api/gigs/:id` - Get gig details
- `POST /api/gigs` - Create new gig (seller only)
- `PUT /api/gigs/:id` - Update gig (seller only)
- `DELETE /api/gigs/:id` - Delete gig (seller only)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/deliver` - Submit delivery

### Reviews
- `GET /api/reviews/gig/:gigId` - Get gig reviews
- `POST /api/reviews` - Create review
- `POST /api/reviews/:id/helpful` - Mark review as helpful
- `GET /api/reviews/user/:userId` - Get user reviews
- `GET /api/reviews/seller/:sellerId/stats` - Get seller review stats

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Send message

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files

### Admin
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Manage users
- `GET /api/admin/gigs` - Manage gigs

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for enhanced protection
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: File type and size validation

## 🗄️ Database Integration

The application is designed to work with PostgreSQL. Database queries are currently commented out with `TODO` placeholders, allowing the database team to implement the actual schema and queries.

### Key Database Tables (To be implemented):
- `users` - User accounts and profiles
- `gigs` - Service listings
- `orders` - Purchase transactions
- `reviews` - User reviews and ratings
- `messages` - User communications
- `uploads` - File metadata

## 🛡️ Error Handling

The API provides consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  },
  "timestamp": "2024-01-20T10:30:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

## 📝 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ /* array of items */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 🚦 Health Check

Check API health status:
- `GET /health` - Returns server health and status

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (to be implemented)

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `socyads_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `SESSION_SECRET` | Session secret for Passport | - |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | - |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | `/api/auth/google/callback` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

## 🔑 Social Authentication Setup

The API supports Google OAuth 2.0 authentication alongside traditional email/password login.

### Google OAuth Setup

1. **Create Google OAuth Application:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Client:**
   - Application type: "Web application"
   - Name: "SocyAds"
   - Authorized JavaScript origins: `http://localhost:3000` (frontend URL)
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`

3. **Environment Configuration:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   SESSION_SECRET=your-session-secret-key
   ```

### Social Authentication Flow

1. **Frontend initiates OAuth:**
   ```javascript
   window.location.href = 'http://localhost:5000/api/auth/google';
   ```

2. **User completes Google authentication**

3. **Callback returns JWT tokens:**
   ```json
   {
     "success": true,
     "message": "Google authentication successful",
     "data": {
       "user": {
         "id": "uuid",
         "email": "user@gmail.com",
         "username": "user",
         "full_name": "User Name",
         "role": "buyer",
         "avatar_url": "https://...",
         "is_verified": true
       },
       "accessToken": "jwt-access-token",
       "refreshToken": "jwt-refresh-token"
     }
   }
   ```

### Linking Social Accounts

Users can link their Google account to existing accounts:

```javascript
// Link Google account to authenticated user
fetch('/api/auth/google/link', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    googleToken: 'google-access-token'
  })
});
```

### Database Integration

The social authentication system requires the following database fields in the `users` table:

```sql
-- Social login fields
google_id VARCHAR(255) UNIQUE,
facebook_id VARCHAR(255) UNIQUE,
twitter_id VARCHAR(255) UNIQUE,
auth_provider VARCHAR(50) DEFAULT 'local',
password_hash VARCHAR(255) -- Made nullable for social login users
```

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add appropriate JSDoc comments for new functions
3. Include Swagger documentation for new endpoints
4. Use the established error handling patterns
5. Follow the validation and response utilities

## 📄 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- Database queries are currently mocked - requires database team implementation
- Email service not configured
- Payment integration pending
- Real-time messaging requires WebSocket implementation

## 🔮 Future Enhancements

- WebSocket integration for real-time messaging
- Payment gateway integration (Stripe/PayPal)
- Email notification system
- Advanced analytics and reporting
- Automated testing suite
- Docker containerization
- CI/CD pipeline setup

---

For questions or support, please contact the development team. 