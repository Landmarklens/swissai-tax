import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import {
  Lock as LockIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TrustBadges = ({ variant = 'horizontal', showLabels = true }) => {
  const { t } = useTranslation();

  const badges = [
    {
      icon: <LockIcon sx={{ fontSize: 24 }} />,
      label: t('256-bit Encryption'),
      shortLabel: '256-bit',
      color: '#4CAF50'
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 24 }} />,
      label: t('2FA Protected'),
      shortLabel: '2FA',
      color: '#2196F3'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 24 }} />,
      label: t('Secure Connection'),
      shortLabel: 'SSL',
      color: '#FF9800'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 24 }} />,
      label: t('GDPR Compliant'),
      shortLabel: 'GDPR',
      color: '#9C27B0'
    }
  ];

  if (variant === 'compact') {
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        {badges.map((badge, index) => (
          <Chip
            key={index}
            icon={badge.icon}
            label={badge.shortLabel}
            size="small"
            sx={{
              backgroundColor: `${badge.color}15`,
              color: badge.color,
              border: `1px solid ${badge.color}30`,
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: badge.color
              }
            }}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack
      direction={variant === 'horizontal' ? 'row' : 'column'}
      spacing={3}
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      {badges.map((badge, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '12px',
              backgroundColor: `${badge.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${badge.color}30`,
              color: badge.color,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${badge.color}40`
              }
            }}
          >
            {badge.icon}
          </Box>
          {showLabels && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: '#666',
                textAlign: 'center',
                fontSize: '11px'
              }}
            >
              {badge.label}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
};

export default TrustBadges;
