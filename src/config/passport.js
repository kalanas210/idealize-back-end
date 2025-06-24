const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./database');

// Load environment variables
require('dotenv').config();

// Helper function to check if OAuth is enabled
const isOAuthEnabled = (provider) => {
  const enabledFlag = process.env[`ENABLE_${provider}_AUTH`]?.toLowerCase();
  return enabledFlag === 'true';
};

// Configure passport
const configurePassport = (app) => {
  // Passport session setup
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      // TODO: Replace with actual database query
      /*
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      done(null, result.rows[0]);
      */
      done(null, { id }); // Mock user object
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (isOAuthEnabled('GOOGLE')) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('⚠️ Google OAuth credentials missing but OAuth is enabled. Check your .env file.');
    } else {
      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // TODO: Replace with actual database query
          /*
          const result = await pool.query(
            `INSERT INTO users (google_id, email, name, avatar)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
             SET email = $2, name = $3, avatar = $4
             RETURNING *`,
            [
              profile.id,
              profile.emails[0].value,
              profile.displayName,
              profile.photos[0].value
            ]
          );
          done(null, result.rows[0]);
          */
          
          // Mock user object
          const user = {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos[0].value
          };
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }));
    }
  } else {
    console.log('ℹ️ Google OAuth is disabled. Set ENABLE_GOOGLE_AUTH=true in .env to enable.');
  }

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Return configured passport instance
  return passport;
};

module.exports = configurePassport; 