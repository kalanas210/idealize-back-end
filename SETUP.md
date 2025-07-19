# SocyAds Backend Setup Guide

This guide will help you set up the SocyAds backend API for the SellerDashboard and other platform features.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment example file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=socyads_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here_make_it_long_and_secure
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_make_it_long_and_secure

# Session Configuration
SESSION_SECRET=your_session_secret_key_here_make_it_long_and_secure

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
ENABLE_GOOGLE_AUTH=true

# Clerk Configuration (for frontend integration)
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

### 3. Database Setup

#### Option A: Automated Setup (Recommended)

Run the setup script to automatically create the database and schema:

```bash
npm run setup
```

This script will:
- ✅ Check database connection
- ✅ Create the database if it doesn't exist
- ✅ Initialize all tables and functions
- ✅ Insert sample data
- ✅ Verify the setup

#### Option B: Manual Setup

If you prefer manual setup:

1. **Create Database:**
   ```sql
   CREATE DATABASE socyads_db;
   ```

2. **Run Schema:**
   ```bash
   psql -d socyads_db -f database-schema.sql
   psql -d socyads_db -f migrate_seller_fields.sql
   ```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:5000/api/docs`
- **Health Check**: `http://localhost:5000/health`

## 🔐 Authentication

The API uses JWT authentication with Clerk integration. For testing, you can use:

- **Email**: `test@example.com`
- **Password**: `password`

## 🎯 SellerDashboard Endpoints

The SellerDashboard has dedicated endpoints under `/api/seller/dashboard/`:

### Overview & Statistics
- `GET /api/seller/dashboard/overview` - Get seller overview statistics
- `GET /api/seller/dashboard/earnings` - Get earnings data for charts
- `GET /api/seller/dashboard/performance` - Get performance metrics

### Orders Management
- `GET /api/seller/dashboard/orders` - Get seller orders with filtering
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/deliver` - Submit delivery

### Gigs Management
- `GET /api/seller/dashboard/gigs` - Get seller gigs with analytics
- `POST /api/gigs` - Create new gig
- `PUT /api/gigs/:id` - Update gig
- `DELETE /api/gigs/:id` - Delete gig

### Reviews & Analytics
- `GET /api/seller/dashboard/reviews` - Get review statistics
- `GET /api/seller/dashboard/analytics` - Get analytics data for charts
- `GET /api/seller/dashboard/activity` - Get recent activity

### Transactions
- `GET /api/seller/dashboard/transactions` - Get transaction history

## 🗄️ Database Schema

The database includes the following main tables:

- **users** - User accounts and profiles
- **gigs** - Service listings
- **orders** - Purchase transactions
- **reviews** - User reviews and ratings
- **messages** - User communications
- **categories** - Service categories
- **social_accounts** - Linked social media accounts
- **uploads** - File metadata

## 🔧 Development

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL configuration
│   │   └── passport.js      # OAuth configuration
│   ├── middleware/
│   │   ├── auth.js          # Authentication middleware
│   │   ├── errorHandler.js  # Global error handler
│   │   └── notFound.js      # 404 handler
│   ├── routes/
│   │   ├── authRoutes.js    # Authentication endpoints
│   │   ├── gigRoutes.js     # Gig management
│   │   ├── orderRoutes.js   # Order processing
│   │   ├── reviewRoutes.js  # Review system
│   │   ├── userRoutes.js    # User management
│   │   ├── messageRoutes.js # Messaging system
│   │   ├── adminRoutes.js   # Admin panel
│   │   ├── uploadRoutes.js  # File uploads
│   │   └── sellerDashboardRoutes.js # Seller dashboard
│   ├── services/
│   │   └── analyticsService.js # Analytics service
│   ├── utils/
│   │   ├── jwt.js           # JWT utilities
│   │   ├── validation.js    # Validation rules
│   │   └── response.js      # Response helpers
│   └── server.js            # Main application
├── scripts/
│   └── setup.js             # Database setup script
├── database-schema.sql      # Main database schema
├── migrate_seller_fields.sql # Seller fields migration
└── env.example              # Environment variables template
```

### Adding New Features

1. **Create Route**: Add new endpoints in `src/routes/`
2. **Add Validation**: Define validation rules in `src/utils/validation.js`
3. **Update Schema**: Modify `database-schema.sql` if needed
4. **Add Documentation**: Include Swagger comments in routes
5. **Test**: Use the API documentation to test endpoints

### Database Integration

Currently, the API uses mock data for development. To integrate with the actual database:

1. Uncomment the database queries in route files
2. Replace mock data with actual query results
3. Test with real data

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for enhanced protection
- **Input Validation**: Comprehensive request validation
- **File Upload Security**: File type and size validation

## 🚦 Health Check

Check API health status:
- `GET /health` - Returns server health and status

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run setup` - Initialize database and schema
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
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | - |
| `CLERK_SECRET_KEY` | Clerk secret key | - |

## 🔑 Social Authentication Setup

### Google OAuth Setup

1. **Create Google OAuth Application:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Client:**
   - Application type: "Web application"
   - Name: "SocyAds"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`

3. **Environment Configuration:**
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ENABLE_GOOGLE_AUTH=true
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill existing process on port 5000

3. **JWT Token Issues**
   - Verify JWT secrets are set in `.env`
   - Check token expiration settings

4. **File Upload Issues**
   - Ensure `src/uploads/` directory exists
   - Check file size limits
   - Verify file type restrictions

### Logs

Check server logs for detailed error information:
```bash
npm run dev
```

## 🔮 Future Enhancements

- [ ] WebSocket integration for real-time messaging
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notification system
- [ ] Advanced analytics and reporting
- [ ] Automated testing suite
- [ ] Docker containerization
- [ ] CI/CD pipeline setup

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add appropriate JSDoc comments for new functions
3. Include Swagger documentation for new endpoints
4. Use the established error handling patterns
5. Follow the validation and response utilities

## 📄 License

This project is licensed under the ISC License.

---

For questions or support, please contact the development team. 