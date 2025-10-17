import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt an OAuth token using AES-256-GCM
 * Returns base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from master key + salt
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  // Encrypt
  let encrypted = cipher.update(token, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + ciphertext
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'base64')
  ]);

  return combined.toString('base64');
}

/**
 * Decrypt an OAuth token encrypted with encryptToken()
 * Expects base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();

  // Decode base64
  const combined = Buffer.from(encryptedToken, 'base64');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  // Derive key from master key + salt
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  // Decrypt
  let decrypted = decipher.update(ciphertext.toString('base64'), 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date() >= expiresAt;
}

/**
 * Calculate expiration date from seconds
 */
export function calculateExpirationDate(expiresInSeconds: number): Date {
  return new Date(Date.now() + expiresInSeconds * 1000);
}
