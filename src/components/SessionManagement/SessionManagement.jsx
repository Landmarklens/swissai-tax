import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider
} from '@mui/material';
import {
  Devices as DevicesIcon,
  DeleteSweep as DeleteSweepIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import sessionService from '../../services/sessionService';
import SessionCard from './SessionCard';
import { useTranslation } from 'react-i18next';

/**
 * SessionManagement Component
 * Manages user sessions - display, revoke, and revoke all
 */
const SessionManagement = () => {
  const { t } = useTranslation();

  // State
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  /**
   * Load all active sessions
   */
  const loadSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await sessionService.getSessions();

      if (result.success) {
        setSessions(result.data.sessions || []);
      } else {
        setError(result.error || t('sessions.error.loadFailed'));
      }
    } catch (err) {
      console.error('[Sessions] Load error:', err);
      setError(t('sessions.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Revoke a specific session
   */
  const handleRevokeSession = async (sessionId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sessionService.revokeSession(sessionId);

      if (result.success) {
        setSuccess(t('sessions.revokeSuccess'));
        // Reload sessions
        await loadSessions();
      } else {
        setError(result.error || t('sessions.error.revokeFailed'));
      }
    } catch (err) {
      console.error('[Sessions] Revoke error:', err);
      setError(t('sessions.error.revokeFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Revoke all sessions except current
   */
  const handleRevokeAll = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await sessionService.revokeAllOtherSessions();

      if (result.success) {
        setSuccess(t('sessions.revokeAllSuccess', { count: result.data.count || 0 }));
        setShowRevokeAllDialog(false);
        // Reload sessions
        await loadSessions();
      } else {
        setError(result.error || t('sessions.error.revokeAllFailed'));
      }
    } catch (err) {
      console.error('[Sessions] Revoke all error:', err);
      setError(t('sessions.error.revokeAllFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate other sessions count (exclude current)
  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <DevicesIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                {t('sessions.title')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('sessions.description')}
            </Typography>
          </Box>

          {/* Refresh Button */}
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadSessions}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            {t('sessions.refresh')}
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Alert severity="info">
          {t('sessions.noSessions')}
        </Alert>
      ) : (
        <>
          <Stack spacing={2}>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={handleRevokeSession}
                disabled={actionLoading}
              />
            ))}
          </Stack>

          {/* Revoke All Button */}
          {otherSessionsCount > 0 && (
            <Box mt={3} display="flex" justifyContent="center">
              <Button
                startIcon={<DeleteSweepIcon />}
                variant="outlined"
                color="error"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={actionLoading}
              >
                {t('sessions.revokeAll')} ({otherSessionsCount})
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Revoke All Confirmation Dialog */}
      <Dialog
        open={showRevokeAllDialog}
        onClose={() => !actionLoading && setShowRevokeAllDialog(false)}
      >
        <DialogTitle>{t('sessions.revokeAllTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            {t('sessions.confirmRevokeAll')}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('sessions.revokeAllWarning')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowRevokeAllDialog(false)}
            disabled={actionLoading}
          >
            {t('sessions.cancel')}
          </Button>
          <Button
            onClick={handleRevokeAll}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading && <CircularProgress size={20} />}
          >
            {actionLoading ? t('sessions.revoking') : t('sessions.revokeAll')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManagement;
