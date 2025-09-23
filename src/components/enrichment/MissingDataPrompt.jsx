import React from 'react';
import { Box, Typography, Button, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { LocationOn, AttachMoney, Home, Person, Info } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { theme } from '../../theme/theme';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MissingDataPrompt = ({ missingFields, onUpdateProfile }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  if (!missingFields || missingFields.length === 0) return null;

  // Group missing fields by reason
  const groupedFields = missingFields.reduce((acc, field) => {
    const key = field.reason;
    if (!acc[key]) acc[key] = [];
    acc[key].push(field);
    return acc;
  }, {});

  // Get unique required data fields
  const getRequiredFields = () => {
    const requiredSet = new Set();
    missingFields.forEach(field => {
      if (field.required_data) {
        field.required_data.forEach(data => requiredSet.add(data));
      }
    });
    return Array.from(requiredSet);
  };

  const requiredFields = getRequiredFields();

  // Map field names to user-friendly labels and icons
  const fieldConfig = {
    work_location: { 
      label: t('work_location'), 
      icon: <LocationOn />,
      description: t('work_location_description')
    },
    salary: { 
      label: t('income_information'), 
      icon: <AttachMoney />,
      description: t('income_information_description')
    },
    marital_status: { 
      label: t('marital_status'), 
      icon: <Person />,
      description: t('marital_status_description')
    },
    family_location: { 
      label: t('family_location'), 
      icon: <Home />,
      description: t('family_location_description')
    },
    household_size: { 
      label: t('household_size'), 
      icon: <Person />,
      description: t('household_size_description')
    }
  };

  const handleUpdateProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile(requiredFields);
    } else {
      navigate('/edit-profile');
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2, 
        mt: 2,
        backgroundColor: theme.palette.info.light + '10',
        border: `1px solid ${theme.palette.info.light}40`,
        borderRadius: 2
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Info sx={{ color: theme.palette.info.main, mt: 0.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
            {t('complete_profile_for_insights')}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('more_accurate_recommendations_with_info')}:
          </Typography>

          <List dense sx={{ p: 0 }}>
            {requiredFields.map(field => {
              const config = fieldConfig[field];
              if (!config) return null;
              
              return (
                <ListItem key={field} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {React.cloneElement(config.icon, { 
                      sx: { fontSize: 18, color: theme.palette.info.main } 
                    })}
                  </ListItemIcon>
                  <ListItemText 
                    primary={config.label}
                    secondary={config.description}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              );
            })}
          </List>

          <Button 
            variant="contained" 
            size="small"
            onClick={handleUpdateProfile}
            sx={{ 
              mt: 1.5,
              backgroundColor: theme.palette.info.main,
              '&:hover': {
                backgroundColor: theme.palette.info.dark
              }
            }}
          >
            {t('update_profile')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

MissingDataPrompt.propTypes = {
  missingFields: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string,
    reason: PropTypes.string,
    required_data: PropTypes.array
  })),
  onUpdateProfile: PropTypes.func
};

export default MissingDataPrompt;