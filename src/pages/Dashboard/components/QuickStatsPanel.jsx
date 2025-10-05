import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const QuickStatsPanel = ({ stats }) => {
  const { t } = useTranslation();

  const statItems = [
    {
      icon: <DescriptionIcon sx={{ color: '#DC0018' }} />,
      label: t('Total Filings'),
      value: stats.totalFilings,
      color: '#DC0018'
    },
    {
      icon: <AttachMoneyIcon sx={{ color: '#4CAF50' }} />,
      label: t('Total Refunds'),
      value: `CHF ${stats.totalRefunds}`,
      color: '#4CAF50'
    },
    {
      icon: <TimelineIcon sx={{ color: '#003DA5' }} />,
      label: t('Avg Refund'),
      value: `CHF ${stats.averageRefund}`,
      color: '#003DA5'
    },
    {
      icon: <EventIcon sx={{ color: '#FFB81C' }} />,
      label: t('Days to Deadline'),
      value: stats.daysUntilDeadline,
      color: '#FFB81C'
    }
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600} mb={2}>
          {t('Quick Stats')}
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          {statItems.map((item, index) => (
            <React.Fragment key={index}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: `${item.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.icon}
                </Box>
                <Box flex={1}>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {item.value}
                  </Typography>
                </Box>
              </Box>
              {index < statItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickStatsPanel;
