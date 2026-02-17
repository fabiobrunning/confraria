/**
 * Password generation utilities for pre-registration flow
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 */

import { randomBytes } from 'crypto';

/**
 * Get a cryptographically secure random integer in [0, max)
 */
function secureRandomInt(max: number): number {
  const bytes = randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return value % max;
}

/**
 * Fisher-Yates shuffle using CSPRNG
 */
function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a secure temporary password
 * Uses crypto.randomBytes() for CSPRNG
 * Format: 12 characters default with uppercase, lowercase, numbers
 */
export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  if (length < 3) {
    throw new Error('Password length must be at least 3 characters');
  }

  const allChars = uppercase + lowercase + numbers;

  // Start with at least one of each type
  const password: string[] = [
    uppercase[secureRandomInt(uppercase.length)],
    lowercase[secureRandomInt(lowercase.length)],
    numbers[secureRandomInt(numbers.length)],
  ];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password.push(allChars[secureRandomInt(allChars.length)]);
  }

  // Shuffle with CSPRNG to avoid predictable positions
  return secureShuffle(password).join('');
}

/**
 * Generates a user-friendly temporary password for SMS/WhatsApp
 * Uses CSPRNG, no index out-of-bounds
 */
export function generateSMSFriendlyPassword(length: number = 8): string {
  if (length < 4) {
    throw new Error('Password length must be at least 4 characters');
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  const password: string[] = [
    uppercase[secureRandomInt(uppercase.length)],
    numbers[secureRandomInt(numbers.length)],
    lowercase[secureRandomInt(lowercase.length)],
  ];

  // Fill remaining with random mix
  for (let i = password.length; i < length; i++) {
    if (i % 2 === 0) {
      password.push(lowercase[secureRandomInt(lowercase.length)]);
    } else {
      const pool = secureRandomInt(2) === 0 ? uppercase : numbers;
      password.push(pool[secureRandomInt(pool.length)]);
    }
  }

  return secureShuffle(password).join('');
}

/**
 * Validates password strength for display purposes
 */
export function validatePasswordStrength(password: string): {
  score: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  isLongEnough: boolean;
} {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    isLongEnough: password.length >= 8,
    score: (
      (/[A-Z]/.test(password) ? 1 : 0) +
      (/[a-z]/.test(password) ? 1 : 0) +
      (/\d/.test(password) ? 1 : 0) +
      (password.length >= 12 ? 1 : 0)
    ),
  };
}

/**
 * Format password for display in messages
 * Shows first chars, hides the rest for security
 */
export function formatPasswordForAudit(password: string): string {
  if (password.length <= 4) {
    return '****';
  }
  return password.substring(0, password.length - 4) + '****';
}

/**
 * Validate phone number format (Brazilian)
 */
export function validatePhoneFormat(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('55')) {
    return /^55\d{10,11}$/.test(cleaned);
  }
  return /^\d{10,11}$/.test(cleaned);
}

/**
 * Normalize phone to standard format
 * Returns: +55XXXXXXXXXXX (13 digits total)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return '+' + cleaned;
}
