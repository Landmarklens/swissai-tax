import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TwoFactorVerifyModal from './TwoFactorVerifyModal';
import twoFactorService from '../../services/twoFactorService';

jest.mock('../../services/twoFactorService');

describe('TwoFactorVerifyModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockTempToken = 'temp_token_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Authentication Code/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <TwoFactorVerifyModal
        open={false}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should allow entering TOTP code', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByLabelText(/Authentication Code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    expect(input.value).toBe('123456');
  });

  it('should verify TOTP code successfully', async () => {
    twoFactorService.verifyLogin.mockResolvedValue({
      success: true,
      data: { user: { id: '1', email: 'test@example.com' } }
    });

    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByLabelText(/Authentication Code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(twoFactorService.verifyLogin).toHaveBeenCalledWith(mockTempToken, '123456');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should show error for invalid code', async () => {
    twoFactorService.verifyLogin.mockResolvedValue({
      success: false,
      error: 'Invalid 2FA code'
    });

    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByLabelText(/Authentication Code/i);
    fireEvent.change(input, { target: { value: '000000' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid 2FA code/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  it('should toggle to backup code mode', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const toggleLink = screen.getByText(/Use backup code instead/i);
    fireEvent.click(toggleLink);

    expect(screen.getByLabelText(/Backup Code/i)).toBeInTheDocument();
    expect(screen.getByText(/Use authenticator app instead/i)).toBeInTheDocument();
  });

  it('should verify backup code successfully', async () => {
    twoFactorService.verifyLogin.mockResolvedValue({
      success: true,
      data: { user: { id: '1', email: 'test@example.com' } }
    });

    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    // Toggle to backup code mode
    const toggleLink = screen.getByText(/Use backup code instead/i);
    fireEvent.click(toggleLink);

    const input = screen.getByLabelText(/Backup Code/i);
    fireEvent.change(input, { target: { value: 'ABCD-1234' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(twoFactorService.verifyLogin).toHaveBeenCalledWith(mockTempToken, 'ABCD-1234');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should disable verify button when code is empty', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    expect(verifyButton).toBeDisabled();
  });

  it('should enable verify button when code is entered', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByLabelText(/Authentication Code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    expect(verifyButton).not.toBeDisabled();
  });

  it('should call onClose when cancel is clicked', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should clear error when switching between modes', () => {
    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    // Set an error first (by simulating failed verification)
    twoFactorService.verifyLogin.mockResolvedValue({
      success: false,
      error: 'Invalid code'
    });

    const input = screen.getByLabelText(/Authentication Code/i);
    fireEvent.change(input, { target: { value: '000000' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    fireEvent.click(verifyButton);

    waitFor(() => {
      expect(screen.getByText(/Invalid code/i)).toBeInTheDocument();
    });

    // Toggle to backup code mode
    const toggleLink = screen.getByText(/Use backup code instead/i);
    fireEvent.click(toggleLink);

    // Error should be cleared
    waitFor(() => {
      expect(screen.queryByText(/Invalid code/i)).not.toBeInTheDocument();
    });
  });

  it('should show loading state during verification', async () => {
    // Create a promise that we can control
    let resolveVerify;
    const verifyPromise = new Promise((resolve) => {
      resolveVerify = resolve;
    });
    twoFactorService.verifyLogin.mockReturnValue(verifyPromise);

    render(
      <TwoFactorVerifyModal
        open={true}
        onClose={mockOnClose}
        tempToken={mockTempToken}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByLabelText(/Authentication Code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const verifyButton = screen.getByRole('button', { name: /Verify/i });
    fireEvent.click(verifyButton);

    // Should show loading state
    await waitFor(() => {
      expect(verifyButton).toBeDisabled();
    });

    // Resolve the promise
    resolveVerify({ success: true, data: {} });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
