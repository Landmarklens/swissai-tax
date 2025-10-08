import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Pagination,
  Alert,
  Stack
} from '@mui/material';
import {
  Security as SecurityIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const pageSize = 20;

  // Fetch current session ID from API on component mount
  useEffect(() => {
    const fetchSessionId = async () => {
      try {
        const response = await axios.get('/api/user/session-id');
        console.log('[DEBUG] Session ID from API:', response.data.session_id);
        setCurrentSessionId(response.data.session_id);
      } catch (error) {
        console.error('[DEBUG] Error fetching session ID:', error);
      }
    };
    fetchSessionId();
  }, []);

  // Check if a log entry is from the current session
  const isCurrentSession = (log) => {
    return log.event_type === 'login_success' &&
           log.session_id &&
           log.session_id === currentSessionId;
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        page_size: pageSize
      };

      const response = await axios.get('/api/audit-logs/', { params });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch audit logs');
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType) => {
    if (eventType.includes('login')) return <LoginIcon fontSize="small" />;
    if (eventType.includes('logout')) return <LogoutIcon fontSize="small" />;
    if (eventType.includes('upload')) return <UploadIcon fontSize="small" />;
    if (eventType.includes('download') || eventType.includes('export')) return <DownloadIcon fontSize="small" />;
    if (eventType.includes('update') || eventType.includes('change')) return <EditIcon fontSize="small" />;
    return <SecurityIcon fontSize="small" />;
  };

  const getStatusColor = (status) => {
    return status === 'success' ? 'success' : 'error';
  };

  const formatEventType = (eventType) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Activity Log
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View your account activity and security events. Logs are kept for 90 days.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Logs Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No activity logs found
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date/Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getEventIcon(log.event_type)}
                        <Typography variant="body2" fontWeight={500}>
                          {formatEventType(log.event_type)}
                        </Typography>
                        {isCurrentSession(log) && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Current Session"
                            color="primary"
                            size="small"
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      {log.device_info ? (
                        <Typography variant="caption">
                          {log.device_info.browser} on {log.device_info.os}
                          {log.device_info.is_mobile && ' (Mobile)'}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{log.ip_address || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(total / pageSize)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Showing {logs.length} of {total} events
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuditLogsTab;
