/**
 * Name & Phone validation utilities for Viraasat 2.0.
 * Supports Unicode alphabetic letters (English Latin, Devanagari, Bengali, Tamil, etc.),
 * spaces, hyphens, and apostrophes. Rejects digits and invalid special characters.
 */

// Matches any string composed strictly of Unicode letters, combining marks (vital for Indic scripts like Devanagari matras), whitespace, hyphens, apostrophes, and periods.
const ALPHABETIC_NAME_REGEX = /^[\p{L}\p{M}\s\-'.’]+$/u;

// Matches Indian mobile numbers (+91 optional, starting with 6-9, followed by 9 digits)
const INDIAN_PHONE_REGEX = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;

// Matches standard international phone numbers starting with + and having 7 to 15 digits
const INTERNATIONAL_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Remove accidental leading, trailing, and consecutive whitespace.
 */
export function sanitizeWhitespace(val: string): string {
  if (!val) return '';
  return val.replace(/\s+/g, ' ').trim();
}

/**
 * Check if string contains any numeric digits.
 */
export function hasNumericDigits(val: string): boolean {
  return /\d/.test(val);
}

/**
 * Format capitalization consistently without destroying deliberate casing
 * like "O'Connor", "Anne-Marie", or "MacDonald". Non-Latin scripts (Devanagari, etc.)
 * are preserved unmodified.
 */
export function formatNameCasing(name: string): string {
  const sanitized = sanitizeWhitespace(name);
  if (!sanitized) return '';

  // If the string contains no Latin alphabet letters (e.g. Hindi, Tamil), return sanitized directly
  if (!/[a-zA-Z]/.test(sanitized)) {
    return sanitized;
  }

  // Check if string is entirely UPPERCASE or entirely lowercase
  const isAllUpper = sanitized === sanitized.toUpperCase();
  const isAllLower = sanitized === sanitized.toLowerCase();

  // If it's already mixed case with intentional casing, keep it while capitalizing first letter
  if (!isAllUpper && !isAllLower) {
    // Ensure the very first character of each word/delimiter is capitalized
    return sanitized.replace(/(^|[\s\-'.’])([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
  }

  // Otherwise, normalize each segment: capitalize first letter, lowercase the rest
  return sanitized
    .toLowerCase()
    .replace(/(^|[\s\-'.’])([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  value: string;
}

/**
 * Validates a person's first or last name.
 * - Allows alphabetic letters in English and Indian scripts (Devanagari, Bengali, Tamil, etc.).
 * - Allows spaces, hyphens, periods, and apostrophes (e.g. O'Connor, Anne-Marie, A.P.J.).
 * - Rejects numbers and invalid special characters.
 * - Preserves the customer's actual input order (no alphabetical sorting).
 */
export function validateName(
  input: string,
  fieldName: 'First Name' | 'Last Name' = 'First Name',
  isRequired: boolean = true
): ValidationResult {
  const sanitized = sanitizeWhitespace(input);

  if (!sanitized) {
    if (isRequired) {
      return {
        isValid: false,
        error: `${fieldName} is required.`,
        value: '',
      };
    }
    return {
      isValid: true,
      value: '',
    };
  }

  if (hasNumericDigits(sanitized)) {
    return {
      isValid: false,
      error: `${fieldName} cannot contain numbers.`,
      value: sanitized,
    };
  }

  if (!ALPHABETIC_NAME_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes.`,
      value: sanitized,
    };
  }

  if (sanitized.length < 2 && isRequired) {
    return {
      isValid: false,
      error: `${fieldName} must be at least 2 characters long.`,
      value: sanitized,
    };
  }

  if (sanitized.length > 60) {
    return {
      isValid: false,
      error: `${fieldName} cannot exceed 60 characters.`,
      value: sanitized,
    };
  }

  const formatted = formatNameCasing(sanitized);

  return {
    isValid: true,
    value: formatted,
  };
}

/**
 * Validates a contact phone number.
 * Supports Indian mobile numbers (+91 optional, 10 digits starting with 6-9)
 * and international phone numbers.
 */
export function validatePhoneNumber(
  input: string,
  isRequired: boolean = false
): ValidationResult {
  const sanitized = sanitizeWhitespace(input);

  if (!sanitized) {
    if (isRequired) {
      return {
        isValid: false,
        error: 'Contact Phone Number is required.',
        value: '',
      };
    }
    return {
      isValid: true,
      value: '',
    };
  }

  // Strip spaces, dashes, and parentheses for raw validation
  const digitsOnly = sanitized.replace(/[\s\-()]/g, '');

  const isIndian = INDIAN_PHONE_REGEX.test(digitsOnly);
  const isInternational = INTERNATIONAL_PHONE_REGEX.test(digitsOnly);

  if (!isIndian && !isInternational) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (e.g. +91 98765 43210).',
      value: sanitized,
    };
  }

  // Format Indian phone numbers cleanly if 10 digits
  let formatted = sanitized;
  if (/^[6-9]\d{9}$/.test(digitsOnly)) {
    formatted = `+91 ${digitsOnly.slice(0, 5)} ${digitsOnly.slice(5)}`;
  } else if (/^\+91[6-9]\d{9}$/.test(digitsOnly)) {
    const core = digitsOnly.slice(3);
    formatted = `+91 ${core.slice(0, 5)} ${core.slice(5)}`;
  }

  return {
    isValid: true,
    value: formatted,
  };
}
