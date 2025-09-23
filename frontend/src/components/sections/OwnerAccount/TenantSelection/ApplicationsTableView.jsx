import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as XIcon,
  CompareArrows as CompareIcon,
  EventAvailable as AttendedIcon,
  Schedule as ScheduledIcon,
  Person as PersonIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ApplicationsTableView = ({
  applications,
  onViewDetails,
  onMakeDecision,
  onCompareToggle,
  onViewMessages,
  compareList
}) => {
  const { t } = useTranslation();
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
  const getStatusColor = (status) => {
    const statusColors = {
      'viewing_requested': 'default',
      'viewing_scheduled': 'info',
      'viewing_attended': 'primary',
      'dossier_requested': 'warning',
      'dossier_submitted': 'secondary',
      'qualified': 'success',
      'selected': 'success',
      'rejected': 'error'
    };
    return statusColors[status] || 'default';
  };
  
  const getStatusLabel = (status) => {
    const labels = {
      'viewing_requested': 'Pending',
      'viewing_scheduled': 'Scheduled',
      'viewing_attended': 'Viewed',
      'dossier_requested': 'Docs Requested',
      'dossier_submitted': 'Complete',
      'qualified': 'Qualified',
      'selected': 'Selected',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  };
  
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };
  
  const isComparing = (app) => {
    return compareList.some(item => item.id === app.id);
  };
  
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Tooltip title="Compare">
                <CompareIcon />
              </Tooltip>
            </TableCell>
            <TableCell>Applicant</TableCell>
            <TableCell align="center">Score</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Viewing</TableCell>
            <TableCell>Income Ratio</TableCell>
            <TableCell>Documents</TableCell>
            <TableCell>Applied</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((application, index) => {
            const aiData = application.ai_extracted_data || {};
            const dossierData = application.dossier_data || {};
            const income = aiData.income || dossierData.monthly_income;
            const incomeRatio = income ? (income / 3500).toFixed(1) : '-';
            const docsCount = dossierData.documents_provided?.length || 0;
            
            return (
              <TableRow
                key={application.id}
                hover
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  ...(isComparing(application) && {
                    bgcolor: 'primary.lighter',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main'
                  })
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isComparing(application)}
                    onChange={() => onCompareToggle(application)}
                    disabled={!isComparing(application) && compareList.length >= 3}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.400' }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {application.anonymized_id || `Applicant #${index + 1}`}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell align="center">
                  <Chip
                    label={Math.round(application.soft_score || 0)}
                    color={getScoreColor(application.soft_score || 0)}
                    size="small"
                    sx={{ fontWeight: 'bold', minWidth: 50 }}
                  />
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={getStatusLabel(application.lead_status)}
                    color={getStatusColor(application.lead_status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  {application.viewing_attended_at ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttendedIcon color="success" fontSize="small" />
                      <Typography variant="caption">
                        {formatDate(application.viewing_attended_at)}
                      </Typography>
                    </Box>
                  ) : application.viewing_slot_id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ScheduledIcon color="info" fontSize="small" />
                      <Typography variant="caption">Scheduled</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {incomeRatio !== '-' && parseFloat(incomeRatio) >= 3 ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : incomeRatio !== '-' ? (
                      <XIcon color="error" fontSize="small" />
                    ) : null}
                    <Typography variant="body2">
                      {incomeRatio}x
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {docsCount >= 5 ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : docsCount > 0 ? (
                      <Typography variant="body2" color="warning.main">
                        {docsCount}/5
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        0/5
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="caption">
                    {formatDate(application.created_at)}
                  </Typography>
                </TableCell>
                
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => onViewDetails(application)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {onViewMessages && (
                      <Tooltip title="View Messages">
                        <IconButton size="small" onClick={() => onViewMessages(application.id)}>
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {application.lead_status !== 'selected' && application.lead_status !== 'rejected' && (
                      <Tooltip title="Make Decision">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onMakeDecision(application)}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ApplicationsTableView;