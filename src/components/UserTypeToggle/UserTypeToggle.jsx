import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, Typography, Switch, useMediaQuery } from '@mui/material';
import { Home as HomeIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const UserTypeToggle = ({ userType, onUserTypeChange }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme?.breakpoints?.down('sm') || '(max-width:600px)');

  // Ensure we have valid props
  if (!userType || !onUserTypeChange) {
    console.warn('UserTypeToggle: Missing required props', { userType, onUserTypeChange });
    return null;
  }

  const handleChange = (event, newType) => {
    if (newType && newType !== userType) {
      onUserTypeChange(newType);
    }
  };

  const handleSwitchChange = (event) => {
    onUserTypeChange(event.target.checked ? 'landlord' : 'tenant');
  };

  // Mobile slider version
  if (isMobile) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 2,
          width: '100%',
          minHeight: '80px',
        }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'white',
          borderRadius: '30px',
          padding: '8px 16px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: '2px solid #E0E7FF'
        }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: userType === 'tenant' ? 700 : 500,
              color: userType === 'tenant' ? '#3E63DD' : '#4A5568'
            }}>
            {t("Tenant")}
          </Typography>
          <Switch
            checked={userType === 'landlord'}
            onChange={handleSwitchChange}
            sx={{
              '& .MuiSwitch-switchBase': {
                '&.Mui-checked': {
                  color: '#3E63DD',
                  '& + .MuiSwitch-track': {
                    backgroundColor: '#3E63DD',
                  },
                },
              },
              '& .MuiSwitch-track': {
                backgroundColor: '#B0B0B0',
              },
            }}
          />
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: userType === 'landlord' ? 700 : 500,
              color: userType === 'landlord' ? '#3E63DD' : '#4A5568'
            }}>
            {t("Landlord")}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Desktop toggle button version
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: { xs: 2, sm: 3, md: 4 },
        width: '100%',
        minHeight: { xs: '50px', sm: '60px', md: '70px' },
      }}>
      <ToggleButtonGroup
        value={userType}
        exclusive
        onChange={handleChange}
        sx={{
          backgroundColor: 'white',
          borderRadius: { xs: '30px', sm: '40px', md: '60px' },
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: { xs: '2px solid #E0E7FF', md: '3px solid #E0E7FF' },
          '& .MuiToggleButton-root': {
            px: { xs: 2, sm: 3, md: 5 },
            py: { xs: 1, sm: 1.5, md: 2 },
            minWidth: { xs: '120px', sm: '160px', md: '200px' },
            border: 'none',
            borderRadius: { xs: '30px', sm: '40px', md: '60px' },
            textTransform: 'none',
            fontSize: { xs: '14px', sm: '16px', md: '20px' },
            fontWeight: 700,
            letterSpacing: '0.3px',
            color: '#1F2D5C',
            transition: 'all 0.3s ease',
            backgroundColor: 'transparent',
            '&:not(.Mui-selected)': {
              color: '#4A5568',
              '&:hover': {
                backgroundColor: 'rgba(62, 99, 221, 0.08)',
                color: '#1F2D5C'
              }
            },
            '&.Mui-selected': {
              backgroundColor: '#3E63DD',
              color: 'white',
              transform: { xs: 'scale(1)', md: 'scale(1.02)' },
              boxShadow: '0 6px 20px rgba(62, 99, 221, 0.4)',
              '&:hover': {
                backgroundColor: '#2D4FBC',
                color: 'white'
              }
            }
          }
        }}>
        <ToggleButton value="tenant">
          <HomeIcon sx={{
            mr: { xs: 0.5, sm: 1, md: 1.5 },
            fontSize: { xs: 18, sm: 22, md: 26 },
            display: { xs: 'none', sm: 'block' }
          }} />
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '14px', sm: '16px', md: '20px' },
              fontWeight: 700,
              color: 'inherit'
            }}>
            {t("I'm looking to rent")}
          </Typography>
        </ToggleButton>
        <ToggleButton value="landlord">
          <BusinessIcon sx={{
            mr: { xs: 0.5, sm: 1, md: 1.5 },
            fontSize: { xs: 18, sm: 22, md: 26 },
            display: { xs: 'none', sm: 'block' }
          }} />
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '14px', sm: '16px', md: '20px' },
              fontWeight: 700,
              color: 'inherit'
            }}>
            {t("I'm a landlord")}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default UserTypeToggle;