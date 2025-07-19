#!/usr/bin/env node

/**
 * SocyAds Backend Setup Script
 * This script helps initialize the database and create necessary tables
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

/**
 * Read SQL file content
 */
function readSQLFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log.error(`Failed to read SQL file: ${filename}`);
    throw error;
  }
}

/**
 * Execute SQL query
 */
async function executeQuery(query, params = []) {
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    log.error(`Query execution failed: ${error.message}`);
    throw error;
  }
}

/**
 * Check database connection
 */
async function checkConnection() {
  try {
    log.info('Checking database connection...');
    const result = await executeQuery('SELECT NOW() as current_time, version() as version');
    log.success(`Connected to PostgreSQL: ${result.rows[0].version}`);
    log.info(`Current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    log.error('Database connection failed');
    log.error('Please check your database configuration in .env file');
    return false;
  }
}

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  try {
    log.info('Checking if database exists...');
    
    // Connect to postgres database to create our database
    const postgresPool = new (require('pg').Pool)({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    });

    const dbName = process.env.DB_NAME || 'socyads_db';
    
    // Check if database exists
    const checkResult = await postgresPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      log.info(`Creating database: ${dbName}`);
      await postgresPool.query(`CREATE DATABASE "${dbName}"`);
      log.success(`Database '${dbName}' created successfully`);
    } else {
      log.info(`Database '${dbName}' already exists`);
    }

    await postgresPool.end();
    return true;
  } catch (error) {
    log.error(`Failed to create database: ${error.message}`);
    return false;
  }
}

/**
 * Initialize database schema
 */
async function initializeSchema() {
  try {
    log.info('Initializing database schema...');
    
    // Check if tables already exist
    const tableCheck = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length > 0) {
      log.warning('Database tables already exist. Skipping schema creation.');
      log.info('If you want to recreate the schema, please drop the database first.');
      return true;
    }
    
    // Read and execute main schema
    const schemaSQL = readSQLFile('database-schema.sql');
    await executeQuery(schemaSQL);
    log.success('Main schema created successfully');

    // Read and execute migration
    const migrationSQL = readSQLFile('migrate_seller_fields.sql');
    await executeQuery(migrationSQL);
    log.success('Migration applied successfully');

    return true;
  } catch (error) {
    log.error(`Failed to initialize schema: ${error.message}`);
    return false;
  }
}

/**
 * Insert sample data
 */
async function insertSampleData() {
  try {
    log.info('Inserting sample data...');

    // Check if sample data already exists
    const existingDataCheck = await executeQuery('SELECT COUNT(*) FROM categories');
    if (parseInt(existingDataCheck.rows[0].count) > 0) {
      log.warning('Sample data already exists. Skipping data insertion.');
      return true;
    }

    // Insert sample categories
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Tech product reviews and content' },
      { name: 'Fitness & Health', slug: 'fitness', description: 'Fitness and health content creation' },
      { name: 'Beauty & Fashion', slug: 'beauty', description: 'Beauty and fashion content' },
      { name: 'Gaming', slug: 'gaming', description: 'Gaming content and reviews' },
      { name: 'Business', slug: 'business', description: 'Business and entrepreneurship content' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Entertainment and lifestyle content' },
      { name: 'Education', slug: 'education', description: 'Educational content creation' },
      { name: 'Food & Cooking', slug: 'food', description: 'Food and cooking content' },
      { name: 'Travel', slug: 'travel', description: 'Travel content and reviews' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'General lifestyle content' }
    ];

    for (const category of categories) {
      await executeQuery(
        'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
        [category.name, category.slug, category.description]
      );
    }
    log.success('Sample categories inserted');

    // Insert sample users
    const sampleUsers = [
      {
        name: 'TechGuru Mike',
        email: 'mike@techguru.com',
        username: 'techguruofficial',
        role: 'seller',
        verified: true,
        bio: 'Professional tech reviewer and content creator with 5+ years of experience',
        location: 'San Francisco, CA',
        skills: ['Video Production', 'Tech Reviews', 'Content Creation'],
        languages: ['English', 'Spanish']
      },
      {
        name: 'Fitness Coach Sarah',
        email: 'sarah@fitnesscoach.com',
        username: 'fitnesscoachsarah',
        role: 'seller',
        verified: true,
        bio: 'Certified fitness trainer and wellness content creator',
        location: 'Los Angeles, CA',
        skills: ['Fitness Training', 'Video Production', 'Nutrition'],
        languages: ['English']
      }
    ];

    for (const user of sampleUsers) {
      await executeQuery(
        `INSERT INTO users (name, email, username, role, verified, bio, location, skills, languages, member_since)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (email) DO NOTHING`,
        [
          user.name,
          user.email,
          user.username,
          user.role,
          user.verified,
          user.bio,
          user.location,
          JSON.stringify(user.skills),
          JSON.stringify(user.languages),
          new Date().getFullYear().toString()
        ]
      );
    }
    log.success('Sample users inserted');

    return true;
  } catch (error) {
    log.error(`Failed to insert sample data: ${error.message}`);
    return false;
  }
}

/**
 * Verify setup
 */
async function verifySetup() {
  try {
    log.info('Verifying setup...');

    // Check tables
    const tables = ['users', 'gigs', 'orders', 'reviews', 'categories', 'messages'];
    for (const table of tables) {
      const result = await executeQuery(`SELECT COUNT(*) FROM ${table}`);
      log.info(`${table}: ${result.rows[0].count} records`);
    }

    // Check functions
    const functions = await executeQuery(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);
    log.info(`Functions created: ${functions.rows.length}`);

    log.success('Setup verification completed');
    return true;
  } catch (error) {
    log.error(`Setup verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  log.header('🚀 SocyAds Backend Setup');
  
  try {
    // Check connection
    if (!(await checkConnection())) {
      process.exit(1);
    }

    // Create database
    if (!(await createDatabase())) {
      process.exit(1);
    }

    // Initialize schema
    if (!(await initializeSchema())) {
      process.exit(1);
    }

    // Insert sample data
    if (!(await insertSampleData())) {
      process.exit(1);
    }

    // Verify setup
    if (!(await verifySetup())) {
      process.exit(1);
    }

    log.header('🎉 Setup Completed Successfully!');
    log.success('Your SocyAds backend is ready to use');
    log.info('Next steps:');
    log.info('1. Copy env.example to .env and configure your environment variables');
    log.info('2. Run: npm run dev');
    log.info('3. Access API documentation at: http://localhost:5000/api/docs');

  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main }; 