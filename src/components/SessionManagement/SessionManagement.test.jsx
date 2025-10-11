import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SessionManagement from './SessionManagement';
import sessionService from '../../services/sessionService';

jest.mock('../../services/sessionService');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'sessions.title': 'Active Sessions',
        'sessions.description': 'Manage your active sessions',
        'sessions.refresh': 'Refresh',
        'sessions.noSessions': 'No active sessions',
        'sessions.revokeSuccess': 'Session revoked successfully',
        'sessions.revokeAll': 'Revoke All Other Sessions',
        'sessions.revokeAllTitle': 'Revoke All Sessions',
        'sessions.confirmRevokeAll': 'Are you sure you want to revoke all other sessions?',
        'sessions.revokeAllWarning': 'This will log you out from all other devices',
        'sessions.revokeAllSuccess': `Revoked ${options?.count || 0} session(s)`,
        'sessions.cancel': 'Cancel',
        'sessions.revoking': 'Revoking...',
        'sessions.error.loadFailed': 'Failed to load sessions',
        'sessions.error.revokeFailed': 'Failed to revoke session',
        'sessions.error.revokeAllFailed': 'Failed to revoke all sessions'
      };
      return translations[key] || key;
    }
  })
}));

// Mock SessionCard component
jest.mock('./SessionCard', () => {
  return function MockSessionCard({ session, onRevoke, disabled }) {
    return (
      <div data-testid={`session-card-${session.id}`}>
        <div>{session.device_name}</div>
        <div>{session.ip_address}</div>
        {!session.is_current && (
          <button
            onClick={() => onRevoke(session.id)}
            disabled={disabled}
            data-testid={`revoke-${session.id}`}
          >
            Revoke
          </button>
        )}
      </div>
    );
  };
});

describe('SessionManagement', () => {
  const mockSessions = [
    {
      id: 'session-1',
      session_id: 'sess-1',
      device_name: 'Chrome on MacOS',
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'MacOS',
      ip_address: '192.168.1.1',
      is_current: true,
      is_active: true,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString()
    },
    {
      id: 'session-2',
      session_id: 'sess-2',
      device_name: 'Firefox on Windows',
      device_type: 'desktop',
      browser: 'Firefox',
      os: 'Windows',
      ip_address: '192.168.1.2',
      is_current: false,
      is_active: true,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // Test initial render and loading
  it('should render loading state initially', () => {
    sessionService.getSessions.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<SessionManagement />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // Test successful session load
  it('should load and display sessions successfully', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
      expect(screen.getByTestId('session-card-session-1')).toBeInTheDocument();
      expect(screen.getByTestId('session-card-session-2')).toBeInTheDocument();
    });
  });

  // Test empty sessions
  it('should show no sessions message when list is empty', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: [] }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText('No active sessions')).toBeInTheDocument();
    });
  });

  // Test error handling
  it('should display error message on load failure', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
    });
  });

  // Test auto-refresh
  it('should auto-refresh sessions every 30 seconds', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    render(<SessionManagement />);

    // Initial load
    await waitFor(() => {
      expect(sessionService.getSessions).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should have called again
    await waitFor(() => {
      expect(sessionService.getSessions).toHaveBeenCalledTimes(2);
    });

    // Fast-forward another 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(sessionService.getSessions).toHaveBeenCalledTimes(3);
    });
  });

  // Test cleanup on unmount
  it('should clear interval on unmount', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    const { unmount } = render(<SessionManagement />);

    await waitFor(() => {
      expect(sessionService.getSessions).toHaveBeenCalledTimes(1);
    });

    unmount();

    // Fast-forward time - should not call again after unmount
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(sessionService.getSessions).toHaveBeenCalledTimes(1);
  });

  // Test manual refresh
  it('should refresh sessions when refresh button is clicked', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(sessionService.getSessions).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(sessionService.getSessions).toHaveBeenCalledTimes(2);
    });
  });

  // Test revoke single session
  it('should revoke a single session successfully', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });
    sessionService.revokeSession.mockResolvedValue({
      success: true
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('revoke-session-2')).toBeInTheDocument();
    });

    const revokeButton = screen.getByTestId('revoke-session-2');
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(sessionService.revokeSession).toHaveBeenCalledWith('session-2');
      expect(screen.getByText('Session revoked successfully')).toBeInTheDocument();
    });
  });

  // Test revoke session error
  it('should show error when revoking session fails', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });
    sessionService.revokeSession.mockResolvedValue({
      success: false,
      error: 'Failed to revoke'
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('revoke-session-2')).toBeInTheDocument();
    });

    const revokeButton = screen.getByTestId('revoke-session-2');
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to revoke session')).toBeInTheDocument();
    });
  });

  // Test revoke all button visibility
  it('should show revoke all button when there are other sessions', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Revoke All Other Sessions/i)).toBeInTheDocument();
    });
  });

  // Test revoke all button hidden when only current session
  it('should not show revoke all button with only current session', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: [mockSessions[0]] } // Only current session
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.queryByText(/Revoke All Other Sessions/i)).not.toBeInTheDocument();
    });
  });

  // Test revoke all dialog
  it('should open confirmation dialog when revoke all is clicked', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Revoke All Other Sessions/i)).toBeInTheDocument();
    });

    const revokeAllButton = screen.getByText(/Revoke All Other Sessions/i);
    fireEvent.click(revokeAllButton);

    await waitFor(() => {
      expect(screen.getByText('Revoke All Sessions')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });
  });

  // Test revoke all success
  it('should revoke all other sessions successfully', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });
    sessionService.revokeAllOtherSessions.mockResolvedValue({
      success: true,
      data: { count: 1 }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Revoke All Other Sessions/i)).toBeInTheDocument();
    });

    // Open dialog
    const revokeAllButton = screen.getByText(/Revoke All Other Sessions/i);
    fireEvent.click(revokeAllButton);

    await waitFor(() => {
      expect(screen.getByText('Revoke All Sessions')).toBeInTheDocument();
    });

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /Revoke All Other Sessions/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(sessionService.revokeAllOtherSessions).toHaveBeenCalled();
      expect(screen.getByText(/Revoked 1 session\(s\)/i)).toBeInTheDocument();
    });
  });

  // Test revoke all cancel
  it('should close dialog when cancel is clicked', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Revoke All Other Sessions/i)).toBeInTheDocument();
    });

    // Open dialog
    const revokeAllButton = screen.getByText(/Revoke All Other Sessions/i);
    fireEvent.click(revokeAllButton);

    await waitFor(() => {
      expect(screen.getByText('Revoke All Sessions')).toBeInTheDocument();
    });

    // Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Revoke All Sessions')).not.toBeInTheDocument();
    });

    expect(sessionService.revokeAllOtherSessions).not.toHaveBeenCalled();
  });

  // Test revoke all error
  it('should show error when revoking all sessions fails', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });
    sessionService.revokeAllOtherSessions.mockResolvedValue({
      success: false,
      error: 'Failed to revoke all'
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Revoke All Other Sessions/i)).toBeInTheDocument();
    });

    // Open and confirm
    const revokeAllButton = screen.getByText(/Revoke All Other Sessions/i);
    fireEvent.click(revokeAllButton);

    await waitFor(() => {
      expect(screen.getByText('Revoke All Sessions')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Revoke All Other Sessions/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to revoke all sessions')).toBeInTheDocument();
    });
  });

  // Test error dismissal
  it('should allow closing error alerts', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load sessions')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Failed to load sessions')).not.toBeInTheDocument();
    });
  });

  // Test success message dismissal
  it('should allow closing success alerts', async () => {
    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });
    sessionService.revokeSession.mockResolvedValue({
      success: true
    });

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('revoke-session-2')).toBeInTheDocument();
    });

    const revokeButton = screen.getByTestId('revoke-session-2');
    fireEvent.click(revokeButton);

    await waitFor(() => {
      expect(screen.getByText('Session revoked successfully')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Session revoked successfully')).not.toBeInTheDocument();
    });
  });

  // Test disabled state during actions
  it('should disable actions while revoke is in progress', async () => {
    let resolveRevoke;
    const revokePromise = new Promise((resolve) => {
      resolveRevoke = resolve;
    });

    sessionService.getSessions.mockResolvedValue({
      success: true,
      data: { sessions: mockSessions }
    });
    sessionService.revokeSession.mockReturnValue(revokePromise);

    render(<SessionManagement />);

    await waitFor(() => {
      expect(screen.getByTestId('revoke-session-2')).toBeInTheDocument();
    });

    const revokeButton = screen.getByTestId('revoke-session-2');
    fireEvent.click(revokeButton);

    // Button should be disabled during action
    await waitFor(() => {
      expect(revokeButton).toBeDisabled();
    });

    // Resolve
    resolveRevoke({ success: true });

    await waitFor(() => {
      expect(revokeButton).not.toBeDisabled();
    });
  });
});
