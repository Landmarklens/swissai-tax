import { LoginSchema } from './loginValidation';

describe('LoginSchema', () => {
  describe('email validation', () => {
    it('should accept valid email', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(LoginSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(LoginSchema.validate(invalidData)).rejects.toThrow('Invalid email format');
    });

    it('should reject empty email', async () => {
      const invalidData = {
        email: '',
        password: 'password123'
      };

      await expect(LoginSchema.validate(invalidData)).rejects.toThrow('Email is required');
    });

    it('should reject missing email', async () => {
      const invalidData = {
        password: 'password123'
      };

      await expect(LoginSchema.validate(invalidData)).rejects.toThrow('Email is required');
    });
  });

  describe('password validation', () => {
    it('should accept valid password', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'validPassword'
      };

      await expect(LoginSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should reject password shorter than 6 characters', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345'
      };

      await expect(LoginSchema.validate(invalidData)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('should reject empty password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };

      await expect(LoginSchema.validate(invalidData)).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should reject missing password', async () => {
      const invalidData = {
        email: 'test@example.com'
      };

      await expect(LoginSchema.validate(invalidData)).rejects.toThrow('Password is required');
    });

    it('should accept exactly 6 characters password', async () => {
      const validData = {
        email: 'test@example.com',
        password: '123456'
      };

      await expect(LoginSchema.validate(validData)).resolves.toEqual(validData);
    });

    // Note: The password regex rule is commented out in the original code
    it('should accept password without special pattern (regex is commented)', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'simplepassword'
      };

      await expect(LoginSchema.validate(validData)).resolves.toEqual(validData);
    });
  });

  describe('full form validation', () => {
    it('should validate all fields together', async () => {
      const validData = {
        email: 'user@domain.com',
        password: 'securePassword123'
      };

      await expect(LoginSchema.validate(validData)).resolves.toEqual(validData);
    });

    it('should return first validation error when multiple fields are invalid', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123'
      };

      await expect(LoginSchema.validate(invalidData, { abortEarly: true }))
        .rejects.toThrow();
    });

    it('should return all validation errors when abortEarly is false', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123'
      };

      try {
        await LoginSchema.validate(invalidData, { abortEarly: false });
      } catch (error) {
        expect(error.errors).toHaveLength(2);
        expect(error.errors).toContain('Invalid email format');
        expect(error.errors).toContain('Password must be at least 6 characters');
      }
    });
  });

  describe('validateSync', () => {
    it('should work with synchronous validation', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      expect(() => LoginSchema.validateSync(validData)).not.toThrow();
    });

    it('should throw on synchronous validation with invalid data', () => {
      const invalidData = {
        email: 'invalid',
        password: 'short'
      };

      expect(() => LoginSchema.validateSync(invalidData)).toThrow();
    });
  });
});