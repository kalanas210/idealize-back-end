#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates all necessary tables and initial data for SocyAds platform
 */

const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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
 * Read and execute SQL file
 */
async function executeSQLFile(filePath) {
  try {
    log.info(`Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    log.info(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          log.info(`Executing statement ${i + 1}/${statements.length}`);
          await query(statement);
          log.success(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Some statements might fail (like CREATE EXTENSION IF NOT EXISTS)
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            log.warning(`Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            log.error(`Statement ${i + 1} failed: ${error.message}`);
            throw error;
          }
        }
      }
    }
    
    log.success('SQL file executed successfully!');
  } catch (error) {
    log.error(`Failed to execute SQL file: ${error.message}`);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    log.info('Testing database connection...');
    const result = await query('SELECT NOW() as current_time');
    log.success(`Database connected successfully! Current time: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Insert sample data
 */
async function insertSampleData() {
  try {
    log.info('Inserting sample data...');
    
    // Insert sample categories
    const categories = [
      'Technology', 'Fitness & Health', 'Beauty & Fashion', 'Gaming', 
      'Business', 'Entertainment', 'Education', 'Food & Cooking', 
      'Travel', 'Lifestyle'
    ];
    
    for (const category of categories) {
      try {
        await query('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
          category,
          category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          `${category} content creation and promotion services`
        ]);
      } catch (error) {
        // Category table might not exist yet, skip
        log.warning(`Skipping category insertion: ${error.message}`);
        break;
      }
    }
    
    log.success('Sample data inserted successfully!');
  } catch (error) {
    log.warning(`Sample data insertion failed: ${error.message}`);
  }
}

/**
 * Main initialization function
 */
async function initializeDatabase() {
  try {
    log.header('🚀 SocyAds Database Initialization');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      log.error('Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Execute schema file
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    if (!fs.existsSync(schemaPath)) {
      log.error(`Schema file not found: ${schemaPath}`);
      process.exit(1);
    }
    
    await executeSQLFile(schemaPath);
    
    // Insert sample data
    await insertSampleData();
    
    log.header('🎉 Database Initialization Complete!');
    log.success('All tables created successfully');
    log.success('Database is ready for use');
    
    log.header('📋 Next Steps');
    log.info('1. Restart your backend server');
    log.info('2. Test seller registration');
    log.info('3. Test gig creation');
    log.info('4. Verify all endpoints work with real database');
    
  } catch (error) {
    log.error(`Database initialization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().catch(error => {
    log.error(`Initialization script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };
