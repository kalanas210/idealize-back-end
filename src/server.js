const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const configurePassport = require('./config/passport');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const socialAuthRoutes = require('./routes/socialAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const influencerRoutes = require('./routes/influencerRoutes');
const gigRoutes = require('./routes/gigRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const sellerDashboardRoutes = require('./routes/sellerDashboardRoutes');
const buyerDashboardRoutes = require('./routes/buyerDashboardRoutes');
const zoomRoutes = require('./routes/zoomRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || 'http://localhost:3000')
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));

// Initialize passport and configure it
const passport = configurePassport(app);
app.set('passport', passport);

// Serve static files from uploads directory
app.use('/uploads', express.static('src/uploads'));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: process.env.SWAGGER_TITLE || 'SocyAds API',
      version: process.env.SWAGGER_VERSION || '1.0.0',
      description: process.env.SWAGGER_DESCRIPTION || 'API for Social Media Advertising Platform',
      contact: {
        name: 'SocyAds Development Team',
        email: 'dev@socyads.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(swaggerOptions);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SocyAds API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SocyAds API is running successfully',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', socialAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/seller', sellerDashboardRoutes);
app.use('/api/buyer', buyerDashboardRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/ai', aiRoutes);

// Welcome message for root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SocyAds API',
    version: '1.0.0',
    documentation: `${process.env.API_BASE_URL || `http://localhost:${PORT}`}/api/docs`,
    endpoints: {
      auth: '/api/auth',
      'social-auth': '/api/auth/google',
      users: '/api/users',
      influencers: '/api/influencers',
      gigs: '/api/gigs',
      orders: '/api/orders',
      reviews: '/api/reviews',
      messages: '/api/messages',
      admin: '/api/admin',
      upload: '/api/upload',
      'seller-dashboard': '/api/seller/dashboard',
      'buyer-dashboard': '/api/buyer/dashboard',
      'zoom-meetings': '/api/zoom/meetings',
      'ai-ask': '/api/ai/ask'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SocyAds API Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 