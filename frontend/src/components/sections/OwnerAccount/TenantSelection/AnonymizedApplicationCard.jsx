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
  LinearProgress,
  Grid,
  Paper
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Star as StarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  CheckCircleOutline as CheckIcon,
  HighlightOff as XIcon,
  Assignment as DocumentIcon,
  Groups as GroupIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const AnonymizedApplicationCard = ({ 
  lead, 
  index,
  onView, 
  onSelect, 
  selected, 
  onAccept, 
  onReject,
  isCompactView = false 
}) => {
  const { t } = useTranslation();
  
  // Generate anonymous ID
  const anonymousId = `Applicant #${index + 1}`;
  
  // Score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
  // Extract key criteria checks
  const getCriteriaStatus = () => {
    const criteria = [];
    const details = lead.application_details || {};
    const insights = lead.ai_insights || {};
    
    // Income check
    if (details.income) {
      const incomeRatio = details.income / (lead.property_rent || 3500);
      criteria.push({
        label: t('Income Ratio'),
        value: `${incomeRatio.toFixed(1)}x`,
        met: incomeRatio >= 3,
        icon: <MoneyIcon />
      });
    }
    
    // Employment
    if (details.employment_status) {
      criteria.push({
        label: t('Employment'),
        value: details.employment_status === 'employed' ? 'Stable' : details.employment_status,
        met: details.employment_status === 'employed',
        icon: <WorkIcon />
      });
    }
    
    // Documents
    const docsComplete = details.documents_provided?.length >= 4;
    criteria.push({
      label: t('Documents'),
      value: docsComplete ? 'Complete' : 'Partial',
      met: docsComplete,
      icon: <DocumentIcon />
    });
    
    // Move-in date
    if (details.move_in_date) {
      const moveInDate = new Date(details.move_in_date);
      const isFlexible = moveInDate <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Within 60 days
      criteria.push({
        label: t('Move-in'),
        value: moveInDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        met: isFlexible,
        icon: <CalendarIcon />
      });
    }
    
    // Household size
    if (details.household_size) {
      criteria.push({
        label: t('Household'),
        value: `${details.household_size} ${details.household_size === 1 ? 'person' : 'people'}`,
        met: details.household_size <= 4,
        icon: <GroupIcon />
      });
    }
    
    return criteria;
  };
  
  // Get viewing slot info
  const getViewingInfo = () => {
    if (lead.viewing_slot) {
      return {
        date: new Date(lead.viewing_slot.date).toLocaleDateString(),
        time: lead.viewing_slot.time,
        status: lead.viewing_slot.status
      };
    }
    return null;
  };
  
  const criteria = getCriteriaStatus();
  const viewingInfo = getViewingInfo();
  const metCriteria = criteria.filter(c => c.met).length;
  const totalCriteria = criteria.length;
  
  if (isCompactView) {
    // Compact table row view
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '&:hover': { bgcolor: 'action.hover' },
          cursor: 'pointer'
        }}
        onClick={onView}
      >
        <Checkbox
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => e.stopPropagation()}
        />
        
        <Typography sx={{ width: 120, fontWeight: 500 }}>
          {anonymousId}
        </Typography>
        
        <Box sx={{ width: 80, textAlign: 'center' }}>
          <Chip
            label={lead.score}
            color={getScoreColor(lead.score)}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
          {criteria.map((c, idx) => (
            <Tooltip key={idx} title={`${c.label}: ${c.value}`}>
              <Box sx={{ color: c.met ? 'success.main' : 'text.disabled' }}>
                {c.met ? <CheckIcon /> : <XIcon />}
              </Box>
            </Tooltip>
          ))}
        </Box>
        
        {viewingInfo && (
          <Chip
            label={`${viewingInfo.date} ${viewingInfo.time}`}
            size="small"
            variant="outlined"
            sx={{ mr: 2 }}
          />
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onView(); }}>
            <ViewIcon />
          </IconButton>
          {lead.status !== 'rejected' && lead.status !== 'selected' && (
            <>
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onReject?.(lead); }}>
                <RejectIcon />
              </IconButton>
              <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); onAccept?.(lead); }}>
                <AcceptIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
    );
  }
  
  // Full card view
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
        {/* Anonymous Header with Score */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'grey.400' }}>
            <PersonIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {anonymousId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Application received')}: {new Date(lead.created_at).toLocaleDateString()}
            </Typography>
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
              {t('AI Score')}
            </Typography>
          </Box>
        </Box>
        
        {/* Criteria Overview */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('Criteria Met')}: {metCriteria}/{totalCriteria}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(metCriteria / totalCriteria) * 100}
            color={metCriteria === totalCriteria ? 'success' : metCriteria >= totalCriteria * 0.7 ? 'warning' : 'error'}
            sx={{ mb: 1.5, height: 6, borderRadius: 3 }}
          />
          
          <Grid container spacing={1}>
            {criteria.map((criterion, idx) => (
              <Grid item xs={12} key={idx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: criterion.met ? 'success.main' : 'text.disabled', display: 'flex' }}>
                    {criterion.icon}
                  </Box>
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {criterion.label}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: criterion.met ? 'success.main' : 'text.secondary'
                    }}
                  >
                    {criterion.value}
                  </Typography>
                  {criterion.met ? (
                    <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                  ) : (
                    <XIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
        
        {/* Viewing Slot */}
        {viewingInfo && (
          <Chip
            icon={<CalendarIcon />}
            label={`Viewing: ${viewingInfo.date} at ${viewingInfo.time}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mb: 2 }}
          />
        )}
        
        {/* AI Summary (Anonymized) */}
        {lead.ai_insights && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('AI Analysis')}:
            </Typography>
            {lead.ai_insights.summary && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {/* Remove any names from summary */}
                {lead.ai_insights.summary.replace(/\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g, 'The applicant')}
              </Typography>
            )}
            {lead.ai_insights.recommendation && (
              <Chip
                label={lead.ai_insights.recommendation}
                size="small"
                color={
                  lead.ai_insights.recommendation === 'Highly Recommended' ? 'success' :
                  lead.ai_insights.recommendation === 'Recommended' ? 'primary' :
                  'default'
                }
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}
        
        {/* Status */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {lead.status === 'selected' && (
            <Chip label={t('Selected')} color="success" size="small" />
          )}
          {lead.status === 'rejected' && (
            <Chip label={t('Rejected')} color="error" size="small" />
          )}
          {lead.documents_received && (
            <Chip label={t('Documents Received')} color="info" size="small" variant="outlined" />
          )}
        </Box>
      </CardContent>
      
      {/* Action Buttons */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          fullWidth
        >
          {t('View Details')}
        </Button>
        
        {lead.status !== 'rejected' && lead.status !== 'selected' && (
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onReject?.(lead);
              }}
              sx={{ flex: 1 }}
            >
              {t('Reject')}
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.(lead);
              }}
              sx={{ flex: 1 }}
            >
              {t('Select')}
            </Button>
          </Box>
        )}
      </CardActions>
    </Card>
  );
};

export default AnonymizedApplicationCard;