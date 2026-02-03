import { BILLING_CYCLE, PRODUCT_TYPE, SERVER_TYPE, USER_ROLES } from '../constants/enums.js';

import Client from '../modules/models/Client.js';
import Product from '../modules/models/Product.js';
import Server from '../modules/models/Server.js';
import User from '../modules/models/User.js';
import { hashPassword } from '../utils/encryption.js';
import logger from '../utils/logger.js';

/**
 * Seed admin user
 */
export const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@saasify.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return existingAdmin;
    }

    const passwordHash = await hashPassword(adminPassword);

    const admin = await User.create({
      email: adminEmail,
      passwordHash,
      role: USER_ROLES.ADMIN,
      emailVerified: true,
    });

    logger.info(`Admin user created: ${adminEmail}`);
    return admin;
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    throw error;
  }
};

/**
 * Seed sample products
 */
export const seedProducts = async () => {
  try {
    const existingProducts = await Product.countDocuments();
    
    if (existingProducts > 0) {
      logger.info('Products already exist');
      return;
    }

    const products = [
      // Domain TLDs
      {
        name: '.com Domain',
        slug: 'com-domain',
        type: PRODUCT_TYPE.DOMAIN,
        description: 'Register your .com domain name',
        tld: 'com',
        pricing: {
          annually: { price: 12.99, setupFee: 0 },
        },
        registrationYears: [1, 2, 3, 5, 10],
        isActive: true,
        isFeatured: true,
        category: 'domains',
        displayOrder: 1,
      },
      {
        name: '.net Domain',
        slug: 'net-domain',
        type: PRODUCT_TYPE.DOMAIN,
        description: 'Register your .net domain name',
        tld: 'net',
        pricing: {
          annually: { price: 14.99, setupFee: 0 },
        },
        registrationYears: [1, 2, 3, 5, 10],
        isActive: true,
        category: 'domains',
        displayOrder: 2,
      },
      {
        name: '.org Domain',
        slug: 'org-domain',
        type: PRODUCT_TYPE.DOMAIN,
        description: 'Register your .org domain name',
        tld: 'org',
        pricing: {
          annually: { price: 13.99, setupFee: 0 },
        },
        registrationYears: [1, 2, 3, 5, 10],
        isActive: true,
        category: 'domains',
        displayOrder: 3,
      },
      {
        name: '.in Domain',
        slug: 'in-domain',
        type: PRODUCT_TYPE.DOMAIN,
        description: 'Register your .in domain name',
        tld: 'in',
        pricing: {
          annually: { price: 9.99, setupFee: 0 },
        },
        registrationYears: [1, 2, 3, 5, 10],
        isActive: true,
        category: 'domains',
        displayOrder: 4,
      },
      // Shared Hosting Plans
      {
        name: 'Starter Hosting',
        slug: 'starter-hosting',
        type: PRODUCT_TYPE.SHARED_HOSTING,
        description: 'Perfect for personal websites and blogs',
        features: [
          { name: 'Disk Space', value: '10 GB SSD', highlight: true },
          { name: 'Bandwidth', value: '100 GB', highlight: true },
          { name: 'Websites', value: '1', highlight: false },
          { name: 'Email Accounts', value: '10', highlight: false },
          { name: 'Databases', value: '5', highlight: false },
          { name: 'Free SSL', value: 'Yes', highlight: true },
          { name: 'cPanel', value: 'Yes', highlight: false },
          { name: 'Daily Backups', value: 'Yes', highlight: false },
        ],
        pricing: {
          monthly: { price: 4.99, setupFee: 0 },
          quarterly: { price: 4.49, setupFee: 0 },
          semiannually: { price: 3.99, setupFee: 0 },
          annually: { price: 2.99, setupFee: 0 },
        },
        resources: {
          diskSpace: '10GB',
          bandwidth: '100GB',
          databases: '5',
          emailAccounts: '10',
          subdomains: '10',
        },
        autoSetup: true,
        setupType: 'automatic',
        provisioningModule: 'cpanel',
        isActive: true,
        isFeatured: true,
        category: 'hosting',
        displayOrder: 10,
      },
      {
        name: 'Business Hosting',
        slug: 'business-hosting',
        type: PRODUCT_TYPE.SHARED_HOSTING,
        description: 'Ideal for small business websites',
        features: [
          { name: 'Disk Space', value: '50 GB SSD', highlight: true },
          { name: 'Bandwidth', value: 'Unlimited', highlight: true },
          { name: 'Websites', value: '5', highlight: true },
          { name: 'Email Accounts', value: 'Unlimited', highlight: true },
          { name: 'Databases', value: 'Unlimited', highlight: false },
          { name: 'Free SSL', value: 'Yes', highlight: true },
          { name: 'cPanel', value: 'Yes', highlight: false },
          { name: 'Daily Backups', value: 'Yes', highlight: false },
          { name: 'Free Domain', value: '1 Year', highlight: true },
        ],
        pricing: {
          monthly: { price: 9.99, setupFee: 0 },
          quarterly: { price: 8.99, setupFee: 0 },
          semiannually: { price: 7.99, setupFee: 0 },
          annually: { price: 5.99, setupFee: 0 },
        },
        resources: {
          diskSpace: '50GB',
          bandwidth: 'Unlimited',
          databases: 'Unlimited',
          emailAccounts: 'Unlimited',
          subdomains: 'Unlimited',
        },
        autoSetup: true,
        setupType: 'automatic',
        provisioningModule: 'cpanel',
        isActive: true,
        isFeatured: true,
        category: 'hosting',
        displayOrder: 11,
      },
      {
        name: 'Enterprise Hosting',
        slug: 'enterprise-hosting',
        type: PRODUCT_TYPE.SHARED_HOSTING,
        description: 'Maximum performance for high-traffic websites',
        features: [
          { name: 'Disk Space', value: '100 GB SSD', highlight: true },
          { name: 'Bandwidth', value: 'Unlimited', highlight: true },
          { name: 'Websites', value: 'Unlimited', highlight: true },
          { name: 'Email Accounts', value: 'Unlimited', highlight: true },
          { name: 'Databases', value: 'Unlimited', highlight: false },
          { name: 'Free SSL', value: 'Yes', highlight: true },
          { name: 'cPanel', value: 'Yes', highlight: false },
          { name: 'Daily Backups', value: 'Yes', highlight: false },
          { name: 'Free Domain', value: '1 Year', highlight: true },
          { name: 'Priority Support', value: 'Yes', highlight: true },
          { name: 'Dedicated IP', value: 'Yes', highlight: true },
        ],
        pricing: {
          monthly: { price: 19.99, setupFee: 0 },
          quarterly: { price: 17.99, setupFee: 0 },
          semiannually: { price: 14.99, setupFee: 0 },
          annually: { price: 11.99, setupFee: 0 },
        },
        resources: {
          diskSpace: '100GB',
          bandwidth: 'Unlimited',
          databases: 'Unlimited',
          emailAccounts: 'Unlimited',
          subdomains: 'Unlimited',
        },
        autoSetup: true,
        setupType: 'automatic',
        provisioningModule: 'cpanel',
        isActive: true,
        isFeatured: true,
        category: 'hosting',
        displayOrder: 12,
      },
      // VPS Plans
      {
        name: 'VPS Basic',
        slug: 'vps-basic',
        type: PRODUCT_TYPE.VPS,
        description: 'Entry-level VPS with full root access',
        features: [
          { name: 'CPU Cores', value: '2', highlight: true },
          { name: 'RAM', value: '4 GB', highlight: true },
          { name: 'SSD Storage', value: '80 GB', highlight: true },
          { name: 'Bandwidth', value: '2 TB', highlight: false },
          { name: 'Root Access', value: 'Yes', highlight: true },
          { name: 'Dedicated IP', value: '1', highlight: false },
          { name: 'Free cPanel', value: 'No', highlight: false },
          { name: 'Daily Backups', value: 'Yes', highlight: false },
        ],
        pricing: {
          monthly: { price: 29.99, setupFee: 10 },
          quarterly: { price: 27.99, setupFee: 10 },
          semiannually: { price: 24.99, setupFee: 0 },
          annually: { price: 19.99, setupFee: 0 },
        },
        resources: {
          cpuCores: '2',
          ram: '4GB',
          ssdStorage: '80GB',
          bandwidth: '2TB',
        },
        autoSetup: true,
        setupType: 'automatic',
        provisioningModule: 'aws',
        isActive: true,
        category: 'vps',
        displayOrder: 20,
      },
      {
        name: 'VPS Advanced',
        slug: 'vps-advanced',
        type: PRODUCT_TYPE.VPS,
        description: 'High-performance VPS for demanding applications',
        features: [
          { name: 'CPU Cores', value: '4', highlight: true },
          { name: 'RAM', value: '8 GB', highlight: true },
          { name: 'SSD Storage', value: '160 GB', highlight: true },
          { name: 'Bandwidth', value: '4 TB', highlight: false },
          { name: 'Root Access', value: 'Yes', highlight: true },
          { name: 'Dedicated IP', value: '2', highlight: false },
          { name: 'Free cPanel', value: 'Optional', highlight: false },
          { name: 'Daily Backups', value: 'Yes', highlight: false },
          { name: 'Priority Support', value: 'Yes', highlight: true },
        ],
        pricing: {
          monthly: { price: 59.99, setupFee: 10 },
          quarterly: { price: 54.99, setupFee: 10 },
          semiannually: { price: 49.99, setupFee: 0 },
          annually: { price: 39.99, setupFee: 0 },
        },
        resources: {
          cpuCores: '4',
          ram: '8GB',
          ssdStorage: '160GB',
          bandwidth: '4TB',
        },
        autoSetup: true,
        setupType: 'automatic',
        provisioningModule: 'aws',
        isActive: true,
        isFeatured: true,
        category: 'vps',
        displayOrder: 21,
      },
    ];

    await Product.insertMany(products);
    logger.info(`${products.length} products created successfully`);
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
};

/**
 * Seed sample servers
 */
export const seedServers = async () => {
  try {
    const existingServers = await Server.countDocuments();
    
    if (existingServers > 0) {
      logger.info('Servers already exist');
      return;
    }

    const servers = [
      {
        name: 'cPanel Server 1',
        hostname: 'cp1.saasify.com',
        ipAddress: '192.168.1.100',
        type: SERVER_TYPE.SHARED,
        provider: 'cpanel',
        location: {
          datacenter: 'DC1',
          city: 'Mumbai',
          country: 'India',
          region: 'Asia',
        },
        controlPanel: {
          url: 'https://cp1.saasify.com:2087',
          port: 2087,
          username: 'root',
          whmUrl: 'https://cp1.saasify.com:2087',
          whmPort: 2087,
          nameservers: ['ns1.saasify.com', 'ns2.saasify.com'],
        },
        resources: {
          totalDiskSpace: 1000, // 1TB
          usedDiskSpace: 0,
          totalBandwidth: 10000, // 10TB
          usedBandwidth: 0,
          totalAccounts: 100,
          activeAccounts: 0,
          cpuCores: 16,
          ramGB: 64,
          maxAccounts: 100,
        },
        limits: {
          accountsPerServer: 100,
          diskSpacePerAccount: 50, // 50GB per account
          bandwidthPerAccount: 1000, // 1TB per account
          maxCPUPercent: 80,
          maxMemoryPercent: 80,
          maxDiskPercent: 90,
        },
        monitoring: {
          enabled: true,
          uptime: 100,
          cpuUsage: 20,
          memoryUsage: 30,
          diskUsage: 10,
        },
        status: 'active',
        isActive: true,
        acceptNewAccounts: true,
        priority: 10,
      },
      {
        name: 'AWS Server 1',
        hostname: 'aws1.saasify.com',
        ipAddress: '192.168.2.100',
        type: SERVER_TYPE.VPS,
        provider: 'aws',
        location: {
          datacenter: 'AWS Mumbai',
          city: 'Mumbai',
          country: 'India',
          region: 'ap-south-1',
        },
        aws: {
          region: 'ap-south-1',
          ec2InstanceType: 't3.large',
          ami: 'ami-0a23ccb2cdd9286bb',
        },
        resources: {
          totalDiskSpace: 500,
          usedDiskSpace: 0,
          totalBandwidth: 5000,
          usedBandwidth: 0,
          totalAccounts: 50,
          activeAccounts: 0,
          cpuCores: 8,
          ramGB: 32,
          maxAccounts: 50,
        },
        limits: {
          accountsPerServer: 50,
          maxCPUPercent: 80,
          maxMemoryPercent: 80,
          maxDiskPercent: 90,
        },
        monitoring: {
          enabled: true,
          uptime: 100,
          cpuUsage: 15,
          memoryUsage: 25,
          diskUsage: 5,
        },
        status: 'active',
        isActive: true,
        acceptNewAccounts: true,
        priority: 5,
      },
    ];

    await Server.insertMany(servers);
    logger.info(`${servers.length} servers created successfully`);
  } catch (error) {
    logger.error('Error seeding servers:', error);
    throw error;
  }
};

/**
 * Run all seeds
 */
export const runAllSeeds = async () => {
  try {
    logger.info('Starting database seeding...');
    
    await seedAdminUser();
    await seedProducts();
    await seedServers();
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
};

export default {
  seedAdminUser,
  seedProducts,
  seedServers,
  runAllSeeds,
};
