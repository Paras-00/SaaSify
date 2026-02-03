import Client from '../modules/models/Client.js';
import Domain from '../modules/models/Domain.js';
import Invoice from '../modules/models/Invoice.js';
import Order from '../modules/models/Order.js';
import Product from '../modules/models/Product.js';
import Server from '../modules/models/Server.js';
import Service from '../modules/models/Service.js';
import Transaction from '../modules/models/Transaction.js';
import User from '../modules/models/User.js';
import logger from '../utils/logger.js';

/**
 * Create all database indexes
 * This ensures optimal query performance
 */
export const createIndexes = async () => {
  try {
    logger.info('Creating database indexes...');

    // Create indexes for User model
    await User.createIndexes();
    logger.info('User indexes created');

    // Create indexes for Client model
    await Client.createIndexes();
    logger.info('Client indexes created');

    // Create indexes for Domain model
    await Domain.createIndexes();
    logger.info('Domain indexes created');

    // Create indexes for Product model
    await Product.createIndexes();
    logger.info('Product indexes created');

    // Create indexes for Order model
    await Order.createIndexes();
    logger.info('Order indexes created');

    // Create indexes for Service model
    await Service.createIndexes();
    logger.info('Service indexes created');

    // Create indexes for Invoice model
    await Invoice.createIndexes();
    logger.info('Invoice indexes created');

    // Create indexes for Transaction model
    await Transaction.createIndexes();
    logger.info('Transaction indexes created');

    // Create indexes for Server model
    await Server.createIndexes();
    logger.info('Server indexes created');

    logger.info('All database indexes created successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
    throw error;
  }
};

/**
 * Drop all indexes (use with caution!)
 */
export const dropIndexes = async () => {
  try {
    logger.warn('Dropping all database indexes...');

    await User.collection.dropIndexes();
    await Client.collection.dropIndexes();
    await Domain.collection.dropIndexes();
    await Product.collection.dropIndexes();
    await Order.collection.dropIndexes();
    await Service.collection.dropIndexes();
    await Invoice.collection.dropIndexes();
    await Transaction.collection.dropIndexes();
    await Server.collection.dropIndexes();

    logger.warn('All database indexes dropped');
  } catch (error) {
    logger.error('Error dropping database indexes:', error);
    throw error;
  }
};

/**
 * List all indexes for a specific collection
 */
export const listIndexes = async (modelName) => {
  try {
    const models = {
      User,
      Client,
      Domain,
      Product,
      Order,
      Service,
      Invoice,
      Transaction,
      Server,
    };

    const model = models[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const indexes = await model.collection.getIndexes();
    logger.info(`Indexes for ${modelName}:`, indexes);
    return indexes;
  } catch (error) {
    logger.error(`Error listing indexes for ${modelName}:`, error);
    throw error;
  }
};

/**
 * Rebuild all indexes
 * Useful when indexes are corrupted or need to be recreated
 */
export const rebuildIndexes = async () => {
  try {
    logger.info('Rebuilding all database indexes...');
    
    await dropIndexes();
    await createIndexes();
    
    logger.info('All database indexes rebuilt successfully');
  } catch (error) {
    logger.error('Error rebuilding database indexes:', error);
    throw error;
  }
};

export default {
  createIndexes,
  dropIndexes,
  listIndexes,
  rebuildIndexes,
};
