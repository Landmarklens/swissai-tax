import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Stack,
  Badge
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CalendarMonth as CalendarIcon,
  AttachFile as AttachFileIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  Euro as EuroIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { 
  generateAICard,
  updateLeadStatus
} from '../../store/slices/tenantSelectionSlice';

const ApplicationCard = ({ 
  application, 
  onViewDetails, 
  onCompare,
  isCompareMode = false,
  isSelected = false,
  showIdentity = false,
  compact = false
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isRevealed, setIsRevealed] = useState(showIdentity);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      'viewing_requested': 'info',
      'viewing_scheduled': 'warning',
      'viewing_attended': 'primary',
      'dossier_submitted': 'secondary',
      'shortlisted': 'success',
      'selected': 'success',
      'rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleGenerateAICard = async () => {
    setIsGeneratingCard(true);
    try {
      await dispatch(generateAICard(application.id)).unwrap();
    } catch (error) {
      console.error('Failed to generate AI card:', error);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const renderIdentityInfo = () => {
    if (isRevealed) {
      return (
        <>
          <Typography variant="h6">
            {application.name || 'Unknown Applicant'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {application.email}
          </Typography>
          {application.phone && (
            <Typography variant="body2" color="text.secondary">
              {application.phone}
            </Typography>
          )}
        </>
      );
    } else {
      return (
        <>
          <Typography variant="h6">
            {application.anonymized_id || `APP-${application.id.slice(0, 8)}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Identity hidden
          </Typography>
        </>
      );
    }
  };

  const renderScores = () => {
    if (!application.ai_card_data?.scores) return null;

    const { hard_filter_passed, soft_score, criteria_matches } = application.ai_card_data.scores;

    return (
      <Box sx={{ mt: 2 }}>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Hard Criteria:
            </Typography>
            {hard_filter_passed ? (
              <Chip 
                icon={<CheckCircleIcon />} 
                label={t("filing.passed")} 
                size="small" 
                color="success" 
              />
            ) : (
              <Chip 
                icon={<WarningIcon />} 
                label={t("filing.failed")} 
                size="small" 
                color="error" 
              />
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Soft Score:
              </Typography>
              <Typography variant="body2" color={getScoreColor(soft_score).main}>
                {soft_score}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={soft_score} 
              color={getScoreColor(soft_score)}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>

          {criteria_matches && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
              {Object.entries(criteria_matches).map(([key, value]) => (
                <Chip 
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    );
  };

  const renderCompactView = () => (
    <Card 
      sx={{ 
        mb: 1,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        cursor: 'pointer'
      }}
      onClick={() => onViewDetails(application)}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                <PersonIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle2">
                {isRevealed ? application.name : application.anonymized_id}
              </Typography>
              <Chip 
                label={application.lead_status} 
                size="small" 
                color={getStatusColor(application.lead_status)}
              />
            </Box>
            
            {application.ai_card_data?.scores && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Hard: {application.ai_card_data.scores.hard_filter_passed ? '✓' : '✗'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Soft: {application.ai_card_data.scores.soft_score}%
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {application.documents_processed && (
              <Badge badgeContent={application.document_count || 0} color="primary">
                <AttachFileIcon fontSize="small" color="action" />
              </Badge>
            )}
            {application.viewing_slot_id && (
              <CalendarIcon fontSize="small" color="action" />
            )}
            {isCompareMode && (
              <Checkbox
                checked={isSelected}
                onChange={() => onCompare(application)}
                size="small"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (compact) {
    return renderCompactView();
  }

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 48, height: 48 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              {renderIdentityInfo()}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isRevealed ? "Hide Identity" : "Reveal Identity"}>
              <IconButton onClick={() => setIsRevealed(!isRevealed)} size="small">
                {isRevealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
            {isCompareMode && (
              <Checkbox
                checked={isSelected}
                onChange={() => onCompare(application)}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={application.lead_status.replace('_', ' ').toUpperCase()} 
            color={getStatusColor(application.lead_status)}
            size="small"
            sx={{ mr: 1 }}
          />
          {application.source_portal && (
            <Chip 
              label={application.source_portal}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          {application.auto_allocated && (
            <Chip 
              icon={<PsychologyIcon />}
              label={t("filing.ai_allocated")}
              variant="outlined"
              size="small"
              color="primary"
            />
          )}
        </Box>

        {renderScores()}

        {application.ai_card_data?.highlights && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Key Information:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              {application.ai_card_data.highlights.employment && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <WorkIcon fontSize="small" color="action" />
                  <Typography variant="caption">
                    {application.ai_card_data.highlights.employment}
                  </Typography>
                </Box>
              )}
              {application.ai_card_data.highlights.income && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EuroIcon fontSize="small" color="action" />
                  <Typography variant="caption">
                    CHF {application.ai_card_data.highlights.income}
                  </Typography>
                </Box>
              )}
              {application.ai_card_data.highlights.move_in && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <HomeIcon fontSize="small" color="action" />
                  <Typography variant="caption">
                    {application.ai_card_data.highlights.move_in}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        )}

        {application.viewing_slot_id && application.viewing_datetime && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon fontSize="small" color="primary" />
              <Typography variant="body2">
                Viewing scheduled: {format(new Date(application.viewing_datetime), 'PPp')}
              </Typography>
            </Box>
          </Box>
        )}

        {application.documents_processed && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachFileIcon fontSize="small" />
              <Typography variant="body2">
                {application.document_count || 0} documents processed
              </Typography>
              {application.ai_confidence_score && (
                <Chip 
                  label={`${Math.round(application.ai_confidence_score * 100)}% confidence`}
                  size="small"
                  color={application.ai_confidence_score > 0.8 ? 'success' : 'warning'}
                />
              )}
            </Box>
          </Box>
        )}

        {!application.ai_card_data && application.lead_status === 'dossier_submitted' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2" color="info.contrastText" gutterBottom>
              AI card not generated yet. GPT-5 analysis available.
            </Typography>
            <Button
              variant="contained"
              size="small"
              color="info"
              onClick={handleGenerateAICard}
              disabled={isGeneratingCard}
              startIcon={isGeneratingCard ? <CircularProgress size={16} /> : <PsychologyIcon />}
            >
              {isGeneratingCard ? 'Generating...' : 'Generate AI Card'}
            </Button>
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Applied {format(new Date(application.created_at), 'PP')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isCompareMode && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => onCompare(application)}
            >
              {isSelected ? 'Remove from Compare' : 'Add to Compare'}
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={() => onViewDetails(application)}
          >
            View Details
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

export default ApplicationCard;