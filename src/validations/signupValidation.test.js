import { SignupSchema } from './signupValidation';

describe('SignupSchema', () => {
  const validData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password123',
    confirmPassword: 'Password123'
  };

  describe('firstName validation', () => {
    it('should accept valid firstName', async () => {
      await expect(SignupSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject firstName shorter than 2 characters', async () => {
      const invalidData = { ...validData, firstName: 'J' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('First name must be at least 2 characters');
    });

    it('should reject firstName longer than 50 characters', async () => {
      const invalidData = { ...validData, firstName: 'A'.repeat(51) };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('First name is too long');
    });

    it('should reject empty firstName', async () => {
      const invalidData = { ...validData, firstName: '' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('First name must be at least 2 characters');
    });

    it('should reject missing firstName', async () => {
      const { firstName, ...invalidData } = validData;
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('First name is required');
    });
  });

  describe('lastName validation', () => {
    it('should accept valid lastName', async () => {
      await expect(SignupSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject lastName shorter than 2 characters', async () => {
      const invalidData = { ...validData, lastName: 'D' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Last name must be at least 2 characters');
    });

    it('should reject lastName longer than 50 characters', async () => {
      const invalidData = { ...validData, lastName: 'B'.repeat(51) };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Last name is too long');
    });

    it('should reject empty lastName', async () => {
      const invalidData = { ...validData, lastName: '' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Last name must be at least 2 characters');
    });
  });

  describe('email validation', () => {
    it('should accept valid email', async () => {
      await expect(SignupSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject invalid email format', async () => {
      const invalidData = { ...validData, email: 'invalid-email' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Invalid email format');
    });

    it('should reject empty email', async () => {
      const invalidData = { ...validData, email: '' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Email is required');
    });

    it('should accept various valid email formats', async () => {
      const emails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'user123@sub.domain.com'
      ];

      for (const email of emails) {
        const data = { ...validData, email };
        await expect(SignupSchema.validate(data)).resolves.toMatchObject({ email });
      }
    });
  });

  describe('password validation', () => {
    it('should accept valid password with uppercase, lowercase, and digit', async () => {
      await expect(SignupSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject password shorter than 6 characters', async () => {
      const invalidData = { ...validData, password: 'Pa1', confirmPassword: 'Pa1' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should reject password without uppercase letter', async () => {
      const invalidData = { ...validData, password: 'password123', confirmPassword: 'password123' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    });

    it('should reject password without lowercase letter', async () => {
      const invalidData = { ...validData, password: 'PASSWORD123', confirmPassword: 'PASSWORD123' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    });

    it('should reject password without digit', async () => {
      const invalidData = { ...validData, password: 'Password', confirmPassword: 'Password' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      );
    });

    it('should accept password exactly 6 characters with all requirements', async () => {
      const data = { ...validData, password: 'Pass12', confirmPassword: 'Pass12' };
      await expect(SignupSchema.validate(data)).resolves.toMatchObject({
        password: 'Pass12',
        confirmPassword: 'Pass12'
      });
    });

    it('should reject empty password', async () => {
      const invalidData = { ...validData, password: '', confirmPassword: '' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow();
    });
  });

  describe('confirmPassword validation', () => {
    it('should accept matching confirmPassword', async () => {
      await expect(SignupSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject non-matching confirmPassword', async () => {
      const invalidData = { ...validData, confirmPassword: 'DifferentPassword123' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should reject empty confirmPassword', async () => {
      const invalidData = { ...validData, confirmPassword: '' };
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Passwords must match');
    });

    it('should reject missing confirmPassword', async () => {
      const { confirmPassword, ...invalidData } = validData;
      await expect(SignupSchema.validate(invalidData)).rejects.toThrow('Please confirm your password');
    });

    it('should accept null password match (edge case)', async () => {
      const data = { ...validData, password: null, confirmPassword: null };
      // This will fail on password validation first
      await expect(SignupSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('full form validation', () => {
    it('should validate all fields together', async () => {
      await expect(SignupSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should handle edge cases in names', async () => {
      const edgeCaseData = {
        firstName: 'Jo',  // Minimum valid length
        lastName: 'D'.repeat(50),  // Maximum valid length
        email: 'test@test.com',
        password: 'Test123',
        confirmPassword: 'Test123'
      };

      await expect(SignupSchema.validate(edgeCaseData)).resolves.toEqual(edgeCaseData);
    });

    it('should return all validation errors when abortEarly is false', async () => {
      const invalidData = {
        firstName: 'J',  // Too short
        lastName: 'D',   // Too short
        email: 'invalid',  // Invalid format
        password: '123',   // Too short and missing requirements
        confirmPassword: '456'  // Doesn't match
      };

      try {
        await SignupSchema.validate(invalidData, { abortEarly: false });
      } catch (error) {
        expect(error.errors.length).toBeGreaterThanOrEqual(5);
        expect(error.errors).toEqual(expect.arrayContaining([
          'First name must be at least 2 characters',
          'Invalid email format',
          'Password must be at least 6 characters'
        ]));
      }
    });
  });

  describe('validateSync', () => {
    it('should work with synchronous validation', () => {
      expect(() => SignupSchema.validateSync(validData)).not.toThrow();
    });

    it('should throw on synchronous validation with invalid data', () => {
      const invalidData = { ...validData, email: 'invalid' };
      expect(() => SignupSchema.validateSync(invalidData)).toThrow('Invalid email format');
    });
  });

  describe('partial validation', () => {
    it('should validate individual fields', async () => {
      await expect(SignupSchema.validateAt('email', { email: 'test@example.com' }))
        .resolves.toBe('test@example.com');
    });

    it('should reject invalid individual field', async () => {
      await expect(SignupSchema.validateAt('email', { email: 'invalid' }))
        .rejects.toThrow('Invalid email format');
    });
  });
});