import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GppGoodIcon from '@mui/icons-material/GppGood';
import LockIcon from '@mui/icons-material/Lock';
import PlaceIcon from '@mui/icons-material/Place';
import { useTranslation } from 'react-i18next';

const TrustBadgesContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: theme.spacing(2),
  padding: theme.spacing(2, 0),
  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(2),
    marginTop: theme.spacing(1),
    padding: theme.spacing(1, 0),
  }
}));

const Badge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  padding: theme.spacing(0.75, 1.5),
  backgroundColor: 'rgba(62, 99, 221, 0.05)',
  borderRadius: '16px',
  border: '1px solid rgba(62, 99, 221, 0.1)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(62, 99, 221, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
    color: theme.palette.primary.main,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1),
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    }
  }
}));

const BadgeText = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
  }
}));

const TrustBadges = ({ variant = 'default' }) => {
  const { t } = useTranslation();

  const badges = [
    {
      icon: <PlaceIcon />,
      text: t('Made in Switzerland'),
      tooltip: t('Proudly developed and hosted in Switzerland')
    },
    {
      icon: <GppGoodIcon />,
      text: t('Swiss Data Protection'),
      tooltip: t('Compliant with Swiss Federal Data Protection Act (FADP)')
    },
    {
      icon: <LockIcon />,
      text: t('Bank-Level Encryption'),
      tooltip: t('Industry-standard AES encryption for all your data')
    },
    {
      icon: <VerifiedUserIcon />,
      text: t('GDPR Compliant'),
      tooltip: t('Full compliance with European data protection regulations')
    },
    {
      icon: <SecurityIcon />,
      text: t('Secure Documents'),
      tooltip: t('All documents are encrypted and stored securely in Switzerland')
    }
  ];

  // For compact variant, show first three badges (Made in Switzerland, Swiss Data Protection, Bank-Level Encryption)
  const displayBadges = variant === 'compact' ? badges.slice(0, 3) : badges;

  return (
    <TrustBadgesContainer>
      {displayBadges.map((badge, index) => (
        <Tooltip key={index} title={badge.tooltip} arrow placement="top">
          <Badge>
            {badge.icon}
            <BadgeText>{badge.text}</BadgeText>
          </Badge>
        </Tooltip>
      ))}
    </TrustBadgesContainer>
  );
};

export default TrustBadges;