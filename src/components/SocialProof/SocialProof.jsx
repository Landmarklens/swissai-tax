import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { styled } from '@mui/system';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AnimatedCounter from '../AnimatedCounter/AnimatedCounter';
import { getLandlordStats } from '../../api/landlordStats';
import { useTranslation } from 'react-i18next';

const SocialProofContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  }
}));

const StatBadge = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2.5),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(62, 99, 221, 0.2)',
  borderRadius: '30px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
    borderColor: 'rgba(62, 99, 221, 0.4)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 1.5),
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
    }
  }
}));

const UrgencyBanner = styled(motion.div)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.success.light,
  borderRadius: '20px',
  marginTop: theme.spacing(2),
  '& .MuiTypography-root': {
    color: theme.palette.success.dark,
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75, 1.5),
    '& .MuiTypography-root': {
      fontSize: '0.85rem',
    }
  }
}));

const SocialProof = ({ userType = 'tenant' }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userType === 'landlord') {
      fetchLandlordStats();
    }
  }, [userType]);

  const fetchLandlordStats = async () => {
    try {
      const data = await getLandlordStats();
      setStats(data);
    } catch (error) {
      console.error('[DEBUG] Failed to fetch landlord stats in SocialProof:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userType === 'tenant') {
    // Tenant-specific social proof
    return (
      <SocialProofContainer>
        <StatBadge elevation={0}>
          <GroupIcon sx={{ color: '#3E63DD' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2d5c' }}>
              12,500+
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {t('Active Tenants')}
            </Typography>
          </Box>
        </StatBadge>

        <StatBadge elevation={0}>
          <HomeWorkIcon sx={{ color: '#65BA74' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2d5c' }}>
              8,750+
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {t('Properties Found')}
            </Typography>
          </Box>
        </StatBadge>

        <StatBadge elevation={0}>
          <TrendingUpIcon sx={{ color: '#AA99EC' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2d5c' }}>
              94%
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {t('Success Rate')}
            </Typography>
          </Box>
        </StatBadge>
      </SocialProofContainer>
    );
  }

  // Landlord-specific social proof with animated counters
  if (loading || !stats) {
    return (
      <SocialProofContainer>
        <StatBadge elevation={0}>
          <HomeWorkIcon sx={{ color: '#3E63DD' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2d5c' }}>
              Loading...
            </Typography>
          </Box>
        </StatBadge>
      </SocialProofContainer>
    );
  }

  return (
    <>
      <SocialProofContainer>
        <StatBadge elevation={0}>
          <HomeWorkIcon sx={{ color: '#3E63DD' }} />
          <Box>
            <AnimatedCounter
              value={stats.properties_managed}
              duration={2000}
              delay={0}
            />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {t('Properties Managed')}
            </Typography>
          </Box>
        </StatBadge>

        <StatBadge elevation={0}>
          <CheckCircleIcon sx={{ color: '#65BA74' }} />
          <Box>
            <AnimatedCounter
              value={stats.successful_rentals}
              duration={2000}
              delay={200}
            />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {t('Successful Rentals This Month')}
            </Typography>
          </Box>
        </StatBadge>

        <StatBadge elevation={0}>
          <TrendingUpIcon sx={{ color: '#AA99EC' }} />
          <Box>
            <AnimatedCounter
              value={stats.average_time_saved}
              suffix=" hrs"
              decimals={1}
              duration={2000}
              delay={400}
            />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              {t('Time Saved Per Property')}
            </Typography>
          </Box>
        </StatBadge>
      </SocialProofContainer>

      <AnimatePresence>
        <UrgencyBanner
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <GroupIcon fontSize="small" />
          <Typography>
            {t('Join')} {stats.active_landlords}+ {t('landlords already using AI to manage properties')}
          </Typography>
        </UrgencyBanner>
      </AnimatePresence>
    </>
  );
};

export default SocialProof;