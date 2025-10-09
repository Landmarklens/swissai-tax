import { Box, Typography } from '@mui/material';
import React from 'react';
import AIAvatarColored from '../../assets/svg/AIAvatarColored';
import { useNavigate } from 'react-router-dom';
import { Upgrade, UpgradeRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const UpgradePlan = ({ title, text, color, dark, isMobile }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isMobile) {
    return (
      <Box
        id="UpgradePlan"
        onClick={() => navigate('/my-account?section=subscription')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
        <AIAvatarColored fill={color} />
        <Typography variant="body2" sx={{ color, lineHeight: '20px' }}>
          {title}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      id="UpgradePlan"
      onClick={() => navigate('/my-account?section=subscription')}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer'
      }}>
      <AIAvatarColored fill={color} />
      <Box>
        <Typography variant="body2" sx={{ color, lineHeight: '20px' }}>
          {title}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: dark ? '#1B1F26B8' : '#fff',
            fontSize: 12,
            lineHeight: '16px'
          }}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

export default UpgradePlan;