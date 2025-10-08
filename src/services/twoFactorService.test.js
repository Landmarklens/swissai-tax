import axios from 'axios';
import twoFactorService from './twoFactorService';
import config from '../config/environments';

jest.mock('axios');

const API_URL = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL || 'https://api.swissai.tax';

describe('twoFactorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeSetup', () => {
    it('should initialize 2FA setup successfully', async () => {
      const mockResponse = {
        data: {
          secret: 'TEST_SECRET_KEY',
          qr_code: 'data:image/png;base64,fake_qr_code',
          backup_codes: ['ABCD-1234', 'EFGH-5678']
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await twoFactorService.initializeSetup();

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/2fa/setup/init`,
        {},
        { withCredentials: true }
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle error in initializeSetup', async () => {
      const error = {
        response: {
          data: { detail: 'Already enabled' }
        }
      };
      axios.post.mockRejectedValue(error);

      const result = await twoFactorService.initializeSetup();

      expect(result).toEqual({
        success: false,
        error: 'Already enabled'
      });
    });

    it('should handle network error in initializeSetup', async () => {
      const error = new Error('Network error');
      axios.post.mockRejectedValue(error);

      const result = await twoFactorService.initializeSetup();

      expect(result).toEqual({
        success: false,
        error: 'Failed to initialize 2FA setup'
      });
    });
  });

  describe('verifyAndEnable', () => {
    it('should verify and enable 2FA successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Two-factor authentication has been enabled successfully',
          success: true
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const code = '123456';
      const secret = 'TEST_SECRET';
      const backupCodes = ['ABCD-1234', 'EFGH-5678'];

      const result = await twoFactorService.verifyAndEnable(code, secret, backupCodes);

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/2fa/setup/verify`,
        {
          code,
          secret,
          backup_codes: backupCodes
        },
        { withCredentials: true }
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle invalid code error', async () => {
      const error = {
        response: {
          data: { detail: 'Invalid verification code' }
        }
      };
      axios.post.mockRejectedValue(error);

      const result = await twoFactorService.verifyAndEnable('000000', 'secret', []);

      expect(result).toEqual({
        success: false,
        error: 'Invalid verification code'
      });
    });
  });

  describe('disable', () => {
    it('should disable 2FA successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Two-factor authentication has been disabled',
          success: true
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await twoFactorService.disable('password123');

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/2fa/disable`,
        { password: 'password123' },
        { withCredentials: true }
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle incorrect password error', async () => {
      const error = {
        response: {
          data: { detail: 'Invalid password' }
        }
      };
      axios.post.mockRejectedValue(error);

      const result = await twoFactorService.disable('wrong_password');

      expect(result).toEqual({
        success: false,
        error: 'Invalid password'
      });
    });
  });

  describe('regenerateBackupCodes', () => {
    it('should regenerate backup codes successfully', async () => {
      const mockResponse = {
        data: {
          backup_codes: ['NEW1-1111', 'NEW2-2222', 'NEW3-3333']
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await twoFactorService.regenerateBackupCodes('password123');

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/2fa/backup-codes/regenerate`,
        { password: 'password123' },
        { withCredentials: true }
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle error in regenerateBackupCodes', async () => {
      const error = {
        response: {
          data: { detail: 'Invalid password' }
        }
      };
      axios.post.mockRejectedValue(error);

      const result = await twoFactorService.regenerateBackupCodes('wrong_password');

      expect(result).toEqual({
        success: false,
        error: 'Invalid password'
      });
    });
  });

  describe('getStatus', () => {
    it('should get 2FA status when enabled', async () => {
      const mockResponse = {
        data: {
          enabled: true,
          verified_at: '2025-10-07T12:00:00Z',
          backup_codes_remaining: 7
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await twoFactorService.getStatus();

      expect(axios.get).toHaveBeenCalledWith(
        `${API_URL}/api/2fa/status`,
        { withCredentials: true }
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should get 2FA status when disabled', async () => {
      const mockResponse = {
        data: {
          enabled: false,
          verified_at: null,
          backup_codes_remaining: 0
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await twoFactorService.getStatus();

      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle error in getStatus', async () => {
      const error = {
        response: {
          data: { detail: 'Unauthorized' }
        }
      };
      axios.get.mockRejectedValue(error);

      const result = await twoFactorService.getStatus();

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized'
      });
    });
  });

  describe('verifyLogin', () => {
    it('should verify login with TOTP code', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: '1',
            email: 'test@example.com'
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await twoFactorService.verifyLogin('temp_token_123', '123456');

      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login/verify-2fa?use_cookie=true`,
        {
          temp_token: 'temp_token_123',
          code: '123456'
        },
        { withCredentials: true }
      );
      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should verify login with backup code', async () => {
      const mockResponse = {
        data: {
          success: true,
          user: {
            id: '1',
            email: 'test@example.com'
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await twoFactorService.verifyLogin('temp_token_123', 'ABCD1234');

      expect(result).toEqual({
        success: true,
        data: mockResponse.data
      });
    });

    it('should handle invalid code error', async () => {
      const error = {
        response: {
          data: { detail: 'Invalid 2FA code' }
        }
      };
      axios.post.mockRejectedValue(error);

      const result = await twoFactorService.verifyLogin('temp_token_123', '000000');

      expect(result).toEqual({
        success: false,
        error: 'Invalid 2FA code'
      });
    });
  });

  describe('downloadBackupCodes', () => {
    it('should download backup codes as text file', () => {
      // Mock DOM APIs
      const mockLink = {
        click: jest.fn(),
        setAttribute: jest.fn()
      };
      const mockBlob = {};

      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      document.createElement = jest.fn(() => mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const backupCodes = ['ABCD-1234', 'EFGH-5678'];
      twoFactorService.downloadBackupCodes(backupCodes);

      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('copyBackupCodes', () => {
    it('should copy backup codes to clipboard', async () => {
      const mockWriteText = jest.fn().mockResolvedValue();
      global.navigator.clipboard = {
        writeText: mockWriteText
      };

      const backupCodes = ['ABCD-1234', 'EFGH-5678'];
      const result = await twoFactorService.copyBackupCodes(backupCodes);

      expect(mockWriteText).toHaveBeenCalled();
      const copiedText = mockWriteText.mock.calls[0][0];
      expect(copiedText).toContain('ABCD-1234');
      expect(copiedText).toContain('EFGH-5678');
      expect(result).toBe(true);
    });

    it('should handle clipboard error', async () => {
      global.navigator.clipboard = {
        writeText: jest.fn().mockRejectedValue(new Error('Clipboard error'))
      };

      const result = await twoFactorService.copyBackupCodes(['ABCD-1234']);

      expect(result).toBe(false);
    });

    it('should handle missing clipboard API', async () => {
      global.navigator.clipboard = undefined;

      const result = await twoFactorService.copyBackupCodes(['ABCD-1234']);

      expect(result).toBe(false);
    });
  });
});
