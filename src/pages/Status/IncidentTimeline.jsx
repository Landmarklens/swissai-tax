import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

const IncidentTimeline = ({ incidents }) => {
  if (!incidents || incidents.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No incidents to display. All systems have been running smoothly!
        </Typography>
      </Box>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle />;
      case 'monitoring':
        return <Info />;
      case 'identified':
        return <Warning />;
      case 'investigating':
        return <Error />;
      default:
        return <Info />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Timeline position="right">
      {incidents.map((incident, index) => (
        <TimelineItem key={incident.id}>
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
            <Typography variant="body2">
              {formatDate(incident.created_at)}
            </Typography>
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color={getSeverityColor(incident.severity)}>
              {getStatusIcon(incident.status)}
            </TimelineDot>
            {index < incidents.length - 1 && <TimelineConnector />}
          </TimelineSeparator>

          <TimelineContent>
            <Box sx={{ mb: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="h6" fontWeight="600">
                  {incident.title}
                </Typography>
                <Chip
                  label={incident.severity}
                  color={getSeverityColor(incident.severity)}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip
                  label={incident.status}
                  size="small"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                {incident.description}
              </Typography>

              {incident.resolved_at && (
                <Typography variant="caption" color="success.main">
                  Resolved: {formatDate(incident.resolved_at)}
                </Typography>
              )}
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default IncidentTimeline;
