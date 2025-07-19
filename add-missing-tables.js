#!/usr/bin/env node

/**
 * Add Missing Tables Script
 * Adds missing tables that weren't created during initial setup
 */

const { pool } = require('./src/config/database');

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
 * Check if table exists
 */
async function tableExists(tableName) {
  try {
    const result = await executeQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    `, [tableName]);
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Add missing tables
 */
async function addMissingTables() {
  try {
    log.header('🔧 Adding Missing Tables');

    // Check and add saved_influencers table
    if (!(await tableExists('saved_influencers'))) {
      log.info('Creating saved_influencers table...');
      await executeQuery(`
        CREATE TABLE saved_influencers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
          influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(buyer_id, influencer_id)
        );
      `);
      log.success('saved_influencers table created successfully');
    } else {
      log.info('saved_influencers table already exists');
    }

    // Check and add gig_packages table
    if (!(await tableExists('gig_packages'))) {
      log.info('Creating gig_packages table...');
      await executeQuery(`
        CREATE TYPE package_tier AS ENUM ('basic', 'standard', 'premium');
        
        CREATE TABLE gig_packages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
          tier package_tier NOT NULL,
          title VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL CHECK (price >= 5),
          delivery_time INTEGER NOT NULL CHECK (delivery_time >= 1 AND delivery_time <= 30),
          revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
          features TEXT[] NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(gig_id, tier)
        );
      `);
      log.success('gig_packages table created successfully');
    } else {
      log.info('gig_packages table already exists');
    }

    // Add missing columns to gigs table
    log.info('Checking for missing columns in gigs table...');
    
    // Check if view_count column exists
    const viewCountExists = await executeQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'gigs' AND column_name = 'view_count'
    `);
    
    if (viewCountExists.rows.length === 0) {
      log.info('Adding view_count column to gigs table...');
      await executeQuery(`
        ALTER TABLE gigs 
        ADD COLUMN view_count INTEGER DEFAULT 0,
        ADD COLUMN engagement_rate DECIMAL(5,2) DEFAULT 0.00;
      `);
      log.success('Added view_count and engagement_rate columns to gigs table');
    } else {
      log.info('view_count column already exists in gigs table');
    }

    log.success('All missing tables and columns have been added!');
    return true;

  } catch (error) {
    log.error(`Failed to add missing tables: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await addMissingTables();
    log.header('🎉 Missing Tables Added Successfully!');
    log.info('You can now test the BuyerDashboard endpoints');
  } catch (error) {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { addMissingTables }; 