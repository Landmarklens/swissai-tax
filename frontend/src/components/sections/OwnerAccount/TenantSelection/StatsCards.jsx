import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  People as PeopleIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const StatsCards = ({ stats }) => {
  const { t } = useTranslation();
  
  const statCards = [
    {
      title: t('Total Applications'),
      value: stats.totalApplications,
      icon: <PeopleIcon />,
      color: 'primary.main',
      bgColor: 'primary.light'
    },
    {
      title: t('Qualified'),
      value: stats.qualifiedCount,
      icon: <CheckIcon />,
      color: 'success.main',
      bgColor: 'success.light'
    },
    {
      title: t('Pending Review'),
      value: stats.pendingCount,
      icon: <PendingIcon />,
      color: 'warning.main',
      bgColor: 'warning.light'
    },
    {
      title: t('Rejected'),
      value: stats.rejectedCount,
      icon: <CancelIcon />,
      color: 'error.main',
      bgColor: 'error.light'
    },
    {
      title: t('Average Score'),
      value: Math.round(stats.averageScore),
      icon: <TrendIcon />,
      color: 'info.main',
      bgColor: 'info.light',
      suffix: '/100'
    }
  ];
  
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={2.4} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: stat.bgColor,
                    color: stat.color,
                    mr: 2
                  }}
                >
                  {stat.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {stat.value}{stat.suffix}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;