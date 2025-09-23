import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Groups as GroupsIcon,
  EmojiEvents as TrophyIcon,
  Lightbulb as LightbulbIcon,
  CompareArrows as CompareIcon
} from '@mui/icons-material';

const AIInsightsPanel = ({ insights, loading = false }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!insights) {
    return (
      <Alert severity="info">
        AI insights will be generated once more information is available.
      </Alert>
    );
  }

  const {
    executive_summary,
    match_percentage = 0,
    key_highlights = [],
    considerations = [],
    comparison_metrics = {},
    recommendation = {},
    unique_factors = []
  } = insights;

  // Get recommendation color based on action
  const getRecommendationColor = (action) => {
    switch (action) {
      case 'highly_recommended':
        return 'success';
      case 'recommended':
        return 'primary';
      case 'consider':
        return 'warning';
      case 'not_recommended':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get icon for highlights/considerations
  const getIcon = (category) => {
    switch (category) {
      case 'financial':
        return <TrendingUpIcon />;
      case 'employment':
        return <WorkIcon />;
      case 'documentation':
        return <DescriptionIcon />;
      case 'communication':
        return <ChatIcon />;
      case 'timing':
        return <ScheduleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Box>
      {/* Executive Summary */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PsychologyIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">AI Analysis</Typography>
            <Typography variant="caption" color="text.secondary">
              Generated {new Date(insights.generated_at).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress
              variant="determinate"
              value={match_percentage}
              size={60}
              thickness={4}
              sx={{
                color: match_percentage >= 80 ? 'success.main' :
                       match_percentage >= 60 ? 'primary.main' :
                       match_percentage >= 40 ? 'warning.main' : 'error.main'
              }}
            />
            <Typography variant="caption" display="block" mt={0.5}>
              {match_percentage}% Match
            </Typography>
          </Box>
        </Stack>

        <Typography variant="body1" paragraph>
          {executive_summary}
        </Typography>

        {/* AI Recommendation */}
        <Alert
          severity={getRecommendationColor(recommendation.action)}
          icon={<TrophyIcon />}
          sx={{ mt: 2 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Recommendation: {recommendation.action?.replace(/_/g, ' ').toUpperCase()}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {recommendation.reasoning}
          </Typography>
          {recommendation.next_steps && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              <strong>Next Steps:</strong> {recommendation.next_steps}
            </Typography>
          )}
        </Alert>
      </Paper>

      {/* Key Highlights & Considerations */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <CheckIcon color="success" />
              <Typography variant="h6">Key Strengths</Typography>
            </Stack>
            <List dense>
              {key_highlights.map((highlight, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.light' }}>
                      <CheckIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={highlight.text}
                    secondary={highlight.category}
                  />
                </ListItem>
              ))}
              {key_highlights.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No standout strengths identified yet
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <WarningIcon color="warning" />
              <Typography variant="h6">Considerations</Typography>
            </Stack>
            <List dense>
              {considerations.map((consideration, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: consideration.severity === 'high' ? 'error.light' : 'warning.light'
                      }}
                    >
                      <WarningIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={consideration.text}
                    secondary={`Severity: ${consideration.severity}`}
                  />
                </ListItem>
              ))}
              {considerations.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No significant concerns identified
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Comparison Metrics */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <CompareIcon color="primary" />
          <Typography variant="h6">Comparative Analysis</Typography>
          <Chip
            label={`vs ${comparison_metrics.total_applicants || 0} other applicants`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {comparison_metrics.income_percentile || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Income Percentile
              </Typography>
              <LinearProgress
                variant="determinate"
                value={comparison_metrics.income_percentile || 0}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {comparison_metrics.score_percentile || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Score Percentile
              </Typography>
              <LinearProgress
                variant="determinate"
                value={comparison_metrics.score_percentile || 0}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color="secondary"
              />
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {comparison_metrics.document_percentile || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Documentation
              </Typography>
              <LinearProgress
                variant="determinate"
                value={comparison_metrics.document_percentile || 0}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color="success"
              />
            </Box>
          </Grid>

          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                #{comparison_metrics.rank_overall || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall Rank
              </Typography>
              <Chip
                label={comparison_metrics.rank_overall <= 3 ? 'Top Candidate' : 'Qualified'}
                size="small"
                color={comparison_metrics.rank_overall <= 3 ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Unique Factors */}
      {unique_factors && unique_factors.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <LightbulbIcon color="warning" />
            <Typography variant="h6">Unique Factors</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {unique_factors.map((factor, index) => (
              <Chip
                key={index}
                icon={<StarIcon />}
                label={factor}
                variant="outlined"
                color="primary"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

// Import missing icons
import {
  Work as WorkIcon,
  Description as DescriptionIcon,
  Chat as ChatIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

export default AIInsightsPanel;