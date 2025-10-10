import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Computer as DesktopIcon,
  PhoneAndroid as MobileIcon,
  Tablet as TabletIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, de, fr, it } from 'date-fns/locale';

/**
 * Get date-fns locale based on i18n language
 */
const getDateLocale = (language) => {
  const locales = { en: enUS, de, fr, it };
  return locales[language] || enUS;
};

/**
 * SessionCard Component
 * Displays individual session information with device details, location, and revoke option
 */
const SessionCard = ({ session, onRevoke, disabled }) => {
  const { t, i18n } = useTranslation();

  // Get device icon based on type
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <MobileIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
      case 'tablet':
        return <TabletIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
      default:
        return <DesktopIcon sx={{ fontSize: 40, color: 'primary.main' }} />;
    }
  };

  // Format last active time
  const formatLastActive = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const locale = getDateLocale(i18n.language);
      return formatDistanceToNow(date, { addSuffix: true, locale });
    } catch (error) {
      return t('sessions.unknownTime');
    }
  };

  // Handle revoke with confirmation
  const handleRevoke = () => {
    if (window.confirm(t('sessions.confirmRevoke'))) {
      onRevoke(session.id);
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        position: 'relative',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main'
        },
        opacity: disabled ? 0.6 : 1
      }}
    >
      <CardContent>
        <Box display="flex" gap={2}>
          {/* Device Icon */}
          <Box display="flex" alignItems="center" justifyContent="center">
            {getDeviceIcon(session.device_type)}
          </Box>

          {/* Session Details */}
          <Box flex={1}>
            {/* Device Name and Current Badge */}
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {session.device_name || t('sessions.unknownDevice')}
              </Typography>
              {session.is_current && (
                <Chip
                  label={t('sessions.currentSession')}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 500 }}
                />
              )}
            </Box>

            {/* Browser and OS */}
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {session.browser && session.os
                ? `${session.browser} • ${session.os}`
                : t('sessions.unknownBrowser')}
            </Typography>

            {/* IP Address and Location */}
            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {session.ip_address || t('sessions.unknownIP')}
                {session.location && ` • ${session.location}`}
              </Typography>
            </Box>

            {/* Last Active */}
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {t('sessions.lastActive')}: {formatLastActive(session.last_active)}
              </Typography>
            </Box>
          </Box>

          {/* Revoke Button */}
          {!session.is_current && (
            <Box display="flex" alignItems="center">
              <Tooltip title={t('sessions.revoke')}>
                <span>
                  <IconButton
                    onClick={handleRevoke}
                    disabled={disabled}
                    color="error"
                    size="small"
                    sx={{
                      '&:hover': {
                        bgcolor: 'error.light',
                        color: 'white'
                      }
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
