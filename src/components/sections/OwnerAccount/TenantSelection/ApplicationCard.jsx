import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Button,
  Checkbox,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ApplicationCard = ({ lead, onView, onSelect, selected, onAccept, onReject, onSchedule, onMessage }) => {
  const { t } = useTranslation();
  
  // Score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
  // Status color and label
  const getStatusInfo = (status) => {
    const statusMap = {
      'viewing_requested': { color: 'info', label: t('Viewing Requested') },
      'viewing_scheduled': { color: 'primary', label: t('Viewing Scheduled') },
      'viewing_attended': { color: 'secondary', label: t('Viewing Attended') },
      'dossier_requested': { color: 'warning', label: t('Dossier Requested') },
      'dossier_submitted': { color: 'default', label: t('Dossier Submitted') },
      'qualified': { color: 'success', label: t('Qualified') },
      'selected': { color: 'success', label: t('Selected') },
      'rejected': { color: 'error', label: t('Rejected') }
    };
    return statusMap[status] || { color: 'default', label: status };
  };
  
  // Portal icon
  const getPortalIcon = (portal) => {
    const icons = {
      'homegate': '🏠',
      'flatfox': '🦊',
      'immoscout24': '🔍',
      'direct': '✉️',
      'forwarded': '↗️'
    };
    return icons[portal] || '📧';
  };
  
  const statusInfo = getStatusInfo(lead.status);
  const initials = lead.name
    ? lead.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : lead.email?.[0]?.toUpperCase() || '?';
  
  return (
    <Card 
      data-testid={`application-card-${lead.id}`}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)'
        },
        ...(selected && {
          borderColor: 'primary.main',
          borderWidth: 2
        })
      }}
      onClick={onView}
    >
      {/* Selection Checkbox */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Checkbox
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </Box>
      
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header with Avatar and Score */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.main' }}>
            {initials}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {lead.name || t('Anonymous')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {lead.email}
            </Typography>
            {lead.phone && (
              <Typography variant="body2" color="text.secondary">
                {lead.phone}
              </Typography>
            )}
          </Box>
          
          {/* Score Badge */}
          <Box sx={{ textAlign: 'center' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${getScoreColor(lead.score)}.light`,
                color: `${getScoreColor(lead.score)}.dark`,
                fontWeight: 'bold',
                fontSize: '1.2rem',
                position: 'relative'
              }}
            >
              {lead.score}
              {lead.score >= 80 && (
                <StarIcon 
                  sx={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: -4, 
                    fontSize: 16,
                    color: 'gold'
                  }} 
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('Score')}
            </Typography>
          </Box>
        </Box>
        
        {/* Status and Source */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            sx={{ fontWeight: 500 }}
          />
          <Chip
            label={lead.source_portal}
            icon={<span style={{ marginLeft: 8 }}>{getPortalIcon(lead.source_portal)}</span>}
            size="small"
            variant="outlined"
          />
        </Box>
        
        {/* Key Information */}
        <Box sx={{ mb: 2 }}>
          {lead.application_details?.income && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>{t('Income')}:</strong> CHF {lead.application_details.income?.toLocaleString()}
            </Typography>
          )}
          {lead.application_details?.move_in_date && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>{t('Move-in')}:</strong> {new Date(lead.application_details.move_in_date).toLocaleDateString()}
            </Typography>
          )}
          {lead.application_details?.household_size && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>{t('Household')}:</strong> {lead.application_details.household_size} {t('person(s)')}
            </Typography>
          )}
        </Box>
        
        {/* AI Insights */}
        {lead.ai_insights && (
          <Box sx={{ mb: 2 }}>
            {lead.ai_insights.green_flags?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'success.main' }}>
                  ✓ {lead.ai_insights.green_flags[0]}
                </Typography>
              </Box>
            )}
            {lead.ai_insights.red_flags?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  ⚠ {lead.ai_insights.red_flags[0]}
                </Typography>
              </Box>
            )}
          </Box>
        )}
        
        {/* Application Date */}
        <Typography variant="caption" color="text.secondary">
          {t('Applied')}: {new Date(lead.created_at).toLocaleString()}
        </Typography>
      </CardContent>
      
      {/* Action Buttons */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Tooltip title={t('View Details')}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
        
        {lead.status !== 'rejected' && lead.status !== 'selected' && (
          <>
            <Tooltip title={t('Schedule Viewing')}>
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSchedule?.(lead);
                }}
              >
                <ScheduleIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={t('Send Message')}>
              <IconButton 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onMessage?.(lead);
                }}
              >
                <EmailIcon />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Tooltip title={t('Reject')}>
              <IconButton 
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.(lead);
                }}
              >
                <RejectIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={t('Accept')}>
              <IconButton 
                size="small"
                color="success"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept?.(lead);
                }}
              >
                <AcceptIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </CardActions>
      
      {/* Score Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={lead.score} 
        color={getScoreColor(lead.score)}
        sx={{ 
          height: 3,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}
      />
    </Card>
  );
};

export default ApplicationCard;