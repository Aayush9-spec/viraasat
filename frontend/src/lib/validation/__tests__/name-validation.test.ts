import {
  validateName,
  validatePhoneNumber,
  formatNameCasing,
  sanitizeWhitespace,
} from '../name-validation';

describe('Name Validation Utilities', () => {
  describe('validateName', () => {
    it('accepts valid standard English names and preserves word order', () => {
      const res = validateName('Aayush Kumar Singh', 'First Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Aayush Kumar Singh');
      expect(res.error).toBeUndefined();
    });

    it('formats lowercase names into proper capitalization', () => {
      const res = validateName('shreyansh kumar', 'First Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Shreyansh Kumar');
    });

    it('handles uppercase names properly', () => {
      const res = validateName('PRIYA PATEL', 'First Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Priya Patel');
    });

    it('preserves names with apostrophes such as O\'Connor', () => {
      const res = validateName("o'connor", 'Last Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe("O'Connor");
    });

    it('preserves hyphenated names such as Anne-Marie', () => {
      const res = validateName('anne-marie', 'First Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Anne-Marie');
    });

    it('preserves Indian names and scripts (Devanagari, Tamil, etc.)', () => {
      const devanagari = validateName('आकाश शर्मा', 'First Name', true);
      expect(devanagari.isValid).toBe(true);
      expect(devanagari.value).toBe('आकाश शर्मा');

      const tamil = validateName('முருகன்', 'First Name', true);
      expect(tamil.isValid).toBe(true);
      expect(tamil.value).toBe('முருகன்');
    });

    it('rejects names containing numbers', () => {
      const res1 = validateName('Aayush9', 'First Name', true);
      expect(res1.isValid).toBe(false);
      expect(res1.error).toBe('First Name cannot contain numbers.');

      const res2 = validateName('12345', 'Last Name', true);
      expect(res2.isValid).toBe(false);
      expect(res2.error).toBe('Last Name cannot contain numbers.');
    });

    it('rejects names containing disallowed special characters', () => {
      const res1 = validateName('Aayush@Singh', 'First Name', true);
      expect(res1.isValid).toBe(false);
      expect(res1.error).toBe('First Name can only contain letters, spaces, hyphens, and apostrophes.');

      const res2 = validateName('User #1!', 'Last Name', true);
      expect(res2.isValid).toBe(false);
    });

    it('rejects empty names when required', () => {
      const res = validateName('   ', 'First Name', true);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('First Name is required.');
    });

    it('allows empty names when not required', () => {
      const res = validateName('', 'Last Name', false);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('');
    });

    it('removes excessive consecutive, leading, and trailing whitespace', () => {
      const res = validateName('   Aayush    Kumar   Singh   ', 'First Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('Aayush Kumar Singh');
    });

    it('preserves intentional mixed casing such as MacDonald', () => {
      const res = validateName('MacDonald', 'Last Name', true);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('MacDonald');
    });
  });

  describe('validatePhoneNumber', () => {
    it('accepts 10-digit Indian numbers and formats with +91', () => {
      const res = validatePhoneNumber('9876543210');
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('+91 98765 43210');
    });

    it('accepts Indian numbers already with +91', () => {
      const res = validatePhoneNumber('+91 98765 43210');
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('+91 98765 43210');
    });

    it('accepts international numbers', () => {
      const res = validatePhoneNumber('+1 415 555 2671');
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects phone numbers with invalid characters or alphabets', () => {
      const res = validatePhoneNumber('98765abcde');
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('Please enter a valid phone number (e.g. +91 98765 43210).');
    });

    it('rejects phone numbers that are too short', () => {
      const res = validatePhoneNumber('12345');
      expect(res.isValid).toBe(false);
    });

    it('allows empty phone numbers when not required', () => {
      const res = validatePhoneNumber('', false);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe('');
    });
  });
});
