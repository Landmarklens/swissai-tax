import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Button,
  LinearProgress,
  Box,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApiUrl } from '../../../utils/api/getApiUrl';

// Icons
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const SetupChecklist = ({ propertyId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState({
    basicInfo: false,
    photos: false,
    description: false,
    tenantSelection: false,
    pricing: false,
    availability: false,
    published: false
  });
  
  useEffect(() => {
    if (propertyId) {
      checkPropertySetup();
    }
  }, [propertyId]);
  
  const checkPropertySetup = async () => {
    try {
      // Fetch property details
      const response = await fetch(`${getApiUrl()}/property/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user') || '{}')?.access_token}`
        }
      });
      const property = await response.json();
      
      // Check tenant selection config
      const configResponse = await fetch(
        `${getApiUrl()}/api/tenant-selection/config/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user') || '{}')?.access_token}`
          }
        }
      );
      const config = configResponse.ok ? await configResponse.json() : null;
      
      // Update checklist based on property data
      setChecklist({
        basicInfo: Boolean(
          property.title && 
          property.address && 
          property.city && 
          property.bedrooms && 
          property.bathrooms
        ),
        photos: Boolean(property.images && property.images.length >= 5),
        description: Boolean(property.description && property.description.length > 100),
        tenantSelection: Boolean(config && config.isActive),
        pricing: Boolean(property.price_chf || property.price),
        availability: Boolean(property.available_from),
        published: property.status === 'active'
      });
    } catch (error) {
      console.error('Error checking property setup:', error);
    }
  };
  
  const steps = [
    {
      key: 'basicInfo',
      label: t('Basic Information'),
      description: t('Address, bedrooms, bathrooms, size'),
      required: true,
      action: () => navigate(`/owner-account?section=listing&edit=${propertyId}`)
    },
    {
      key: 'photos',
      label: t('Property Photos'),
      description: t('At least 5 high-quality photos'),
      required: true,
      action: () => navigate(`/owner-account?section=listing&photos=${propertyId}`)
    },
    {
      key: 'description',
      label: t('Description'),
      description: t('Detailed property description'),
      required: true,
      action: () => navigate(`/owner-account?section=listing&description=${propertyId}`)
    },
    {
      key: 'tenantSelection',
      label: t('Tenant Selection'),
      description: t('Configure application criteria and scoring'),
      required: false,
      action: () => navigate(`/owner-account?section=tenant-applications&config=${propertyId}`)
    },
    {
      key: 'pricing',
      label: t('Pricing'),
      description: t('Set monthly rent and deposits'),
      required: true,
      action: () => navigate(`/owner-account?section=listing&pricing=${propertyId}`)
    },
    {
      key: 'availability',
      label: t('Availability'),
      description: t('Set move-in date'),
      required: true,
      action: () => navigate(`/owner-account?section=listing&availability=${propertyId}`)
    },
    {
      key: 'published',
      label: t('Publish'),
      description: t('Make property visible to tenants'),
      required: false,
      action: () => handlePublish()
    }
  ];
  
  const handlePublish = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/property/${propertyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user') || '{}')?.access_token}`
          },
          body: JSON.stringify({ status: 'active' })
        }
      );
      
      if (response.ok) {
        setChecklist(prev => ({ ...prev, published: true }));
      }
    } catch (error) {
      console.error('Error publishing property:', error);
    }
  };
  
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progress = (completedCount / 7) * 100;
  
  const canPublish = steps
    .filter(s => s.required && s.key !== 'published')
    .every(s => checklist[s.key]);
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">
              {t('Property Setup Progress')}
            </Typography>
            <Chip 
              label={`${completedCount}/7 ${t('completed')}`}
              color={progress === 100 ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{ height: 8, borderRadius: 4 }}
            color={progress === 100 ? 'success' : 'primary'}
          />
        </Box>
        
        <List>
          {steps.map((step) => (
            <ListItem 
              key={step.key}
              sx={{ 
                px: 0,
                opacity: step.key === 'published' && !canPublish ? 0.5 : 1
              }}
            >
              <ListItemIcon>
                {checklist[step.key] ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <RadioButtonUncheckedIcon color={step.required ? 'error' : 'default'} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">
                      {step.label}
                    </Typography>
                    {step.required && (
                      <Chip label={t('Required')} size="small" color="error" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={step.description}
              />
              <ListItemSecondaryAction>
                {!checklist[step.key] && (
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={step.action}
                    disabled={step.key === 'published' && !canPublish}
                  >
                    {step.key === 'published' ? t('Publish') : t('Complete')}
                  </Button>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        
        {!canPublish && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <InfoIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
              {t('Complete all required steps before publishing your property')}
            </Typography>
          </Box>
        )}
        
        {checklist.published && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }} />
              {t('Your property is live and accepting applications!')}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {t('Application email')}: listing-{propertyId}@listings.homeai.ch
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SetupChecklist;