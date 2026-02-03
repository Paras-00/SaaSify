import crypto from 'crypto';

const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';

// Lazy-load the encryption key to ensure environment variables are loaded first
let KEY = null;

function getKey() {
  if (!KEY) {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    if (KEY.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
  }
  return KEY;
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:authTag:encrypted
 */
export function encrypt(text) {
  if (!text) return '';
  
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt text encrypted with AES-256-GCM
 * @param {string} encryptedText - Encrypted text in format: iv:authTag:encrypted
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return '';
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const bcrypt = (await import('bcrypt')).default;
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 * @param {string} password - Plain password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
  const bcrypt = (await import('bcrypt')).default;
  return await bcrypt.compare(password, hash);
}

/**
 * Generate random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} - Random password
 */
export function generateSecurePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  
  return password;
}
