#!/usr/bin/env node

import { connectDB, disconnectDB } from '../src/config/database.js';

import dotenv from 'dotenv';
import logger from '../src/utils/logger.js';
import readline from 'readline';
import { rebuildIndexes } from '../src/config/indexes.js';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: envFile });

/**
 * Ask for confirmation
 */
const askConfirmation = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(
      'WARNING: This will drop and recreate all indexes. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
};

/**
 * Rebuild indexes script
 */
const rebuildDatabaseIndexes = async () => {
  try {
    logger.info('='.repeat(50));
    logger.info('Database Indexes Rebuild Script');
    logger.info('='.repeat(50));
    
    // Ask for confirmation
    const confirmed = await askConfirmation();
    
    if (!confirmed) {
      logger.info('Operation cancelled by user');
      process.exit(0);
    }
    
    // Connect to database
    await connectDB();
    
    // Rebuild all indexes
    await rebuildIndexes();
    
    logger.info('='.repeat(50));
    logger.info('Database indexes rebuilt successfully!');
    logger.info('='.repeat(50));
    
    // Disconnect from database
    await disconnectDB();
    
    process.exit(0);
  } catch (error) {
    logger.error('Index rebuild failed:', error);
    process.exit(1);
  }
};

// Run the script
rebuildDatabaseIndexes();
