/**
 * Password generation utilities for pre-registration flow
 * Uses crypto.randomBytes() for cryptographically secure randomness
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
 * Generates a numeric PIN for first access
 * Uses crypto.randomBytes() for CSPRNG
 * Format: 6 digits by default (e.g. "847291")
 * Simple to type, no ambiguity between characters
 */
export function generateTemporaryPassword(length: number = 6): string {
  const digits = '0123456789';

  if (length < 6) {
    throw new Error('PIN length must be at least 6 digits');
  }

  const pin: string[] = [];
  for (let i = 0; i < length; i++) {
    pin.push(digits[secureRandomInt(digits.length)]);
  }

  return pin.join('');
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
