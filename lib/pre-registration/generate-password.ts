/**
 * Password generation utilities for pre-registration flow
 * Generates secure temporary passwords with mixed character types
 */

/**
 * Generates a secure temporary password
 * Pattern: Mixes uppercase, lowercase, numbers for better security
 * Format: 12 characters default (user-friendly but secure)
 * Example: A1bC2dEf3gH4
 */
export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  // Ensure we have all character types
  if (length < 3) {
    throw new Error('Password length must be at least 3 characters');
  }

  // Build pool with all characters
  const allChars = uppercase + lowercase + numbers;

  // Start with at least one of each type
  let password: string[] = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
  ];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle to avoid patterns
  return password.sort(() => Math.random() - 0.5).join('');
}

/**
 * Generates a user-friendly temporary password
 * Uses simpler format without special characters (better for SMS/WhatsApp)
 * Pattern: 8 characters - [A-Z][0-9][a-z][a-z][A-Z][a-z][0-9][a-z]
 * Example: A1b2C3d4
 */
export function generateSMSFriendlyPassword(length: number = 8): string {
  if (length < 4) {
    throw new Error('Password length must be at least 4 characters');
  }

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  // Build password with pattern
  let password: string[] = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
  ];

  // Fill remaining with random mix
  for (let i = password.length; i < length; i++) {
    if (i % 2 === 0) {
      password.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    } else {
      password.push(
        (Math.random() > 0.5 ? uppercase : numbers)[
          Math.floor(Math.random() * 26)
        ]
      );
    }
  }

  // Shuffle
  return password.sort(() => Math.random() - 0.5).join('');
}

/**
 * Validates password strength for display purposes
 * Note: Actual validation should be done on server with bcrypt
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
 * Shows last 4 chars, hides the rest for security
 * Example: "A1bC2d****"
 */
export function formatPasswordForAudit(password: string): string {
  if (password.length <= 4) {
    return '****';
  }
  return password.substring(0, password.length - 4) + '****';
}

/**
 * Validate phone number format (Brazilian)
 * Accepts: +55 11 99999-9999 or variations
 */
export function validatePhoneFormat(phone: string): boolean {
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // Check if it matches Brazilian format
  // With country code: 55 + 2 digits (area code) + 8-9 digits (number)
  if (cleaned.startsWith('55')) {
    return /^55\d{10,11}$/.test(cleaned);
  }

  // Without country code: 2 digits (area code) + 8-9 digits
  return /^\d{10,11}$/.test(cleaned);
}

/**
 * Normalize phone to standard format
 * Returns: +55XXXXXXXXXXX (13 digits total)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '');

  // Add country code if not present
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  return '+' + cleaned;
}
