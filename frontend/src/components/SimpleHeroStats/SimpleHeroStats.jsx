import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/system';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AnimatedCounter from '../AnimatedCounter/AnimatedCounter';
import { getLandlordStats } from '../../api/landlordStats';
import { useTranslation } from 'react-i18next';

const StatsContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(3),
  padding: theme.spacing(4),
}));

const StatCard = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: theme.spacing(3, 4),
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: '2px solid rgba(62, 99, 221, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  width: '100%',
  maxWidth: '450px',
  minHeight: '100px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateX(8px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    borderColor: 'rgba(62, 99, 221, 0.3)',
  }
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  width: 64,
  height: 64,
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color === 'blue' ? 'rgba(62, 99, 221, 0.1)' :
                   color === 'green' ? 'rgba(101, 186, 116, 0.1)' :
                   'rgba(170, 153, 236, 0.1)',
  marginRight: theme.spacing(3),
  flexShrink: 0,
  '& .MuiSvgIcon-root': {
    fontSize: 32,
    color: color === 'blue' ? '#3E63DD' :
           color === 'green' ? '#65BA74' :
           '#AA99EC',
  }
}));

const SimpleHeroStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    properties_managed: 450,
    successful_rentals: 42,
    average_time_saved: 8.5
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getLandlordStats();
      if (data) {
        setStats({
          properties_managed: data.properties_managed || 450,
          successful_rentals: data.successful_rentals || 42,
          average_time_saved: data.average_time_saved || 8.5
        });
      }
    } catch (error) {
      console.error('[DEBUG] Error fetching landlord stats:', error);
      // Stats already have default values
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      icon: <HomeWorkIcon />,
      value: stats?.properties_managed || 450,
      label: t('Properties Managed'),
      color: 'blue'
    },
    {
      icon: <CheckCircleIcon />,
      value: stats?.successful_rentals || 42,
      label: t('Successful Rentals This Month'),
      color: 'green'
    },
    {
      icon: <AccessTimeIcon />,
      value: stats?.average_time_saved || 8.5,
      label: t('Time Saved Per Property'),
      suffix: ' hrs',
      decimals: 1,
      color: 'purple'
    }
  ];

  return (
    <StatsContainer>
      {statsData.map((stat, index) => (
        <StatCard key={index} elevation={0}>
          <IconWrapper color={stat.color}>
            {stat.icon}
          </IconWrapper>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: '#1F2D5C',
                fontSize: '42px',
                lineHeight: 1,
                mb: 0.5
              }}
            >
              <AnimatedCounter
                value={stat.value || 0}
                duration={2000}
                decimals={stat.decimals || 0}
                suffix={stat.suffix || ''}
                delay={index * 200}
              />
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#6B7280',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: 1.2
              }}
            >
              {stat.label}
            </Typography>
          </Box>
        </StatCard>
      ))}
    </StatsContainer>
  );
};

export default SimpleHeroStats;