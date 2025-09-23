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
  Chip,
  IconButton,
  Avatar,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ApplicationsTable = ({ leads, onLeadClick, selectedLeads, onSelectLead }) => {
  const { t } = useTranslation();
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
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
  
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={selectedLeads.length > 0 && selectedLeads.length < leads.length}
                checked={leads.length > 0 && selectedLeads.length === leads.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    leads.forEach(lead => {
                      if (!selectedLeads.includes(lead.id)) {
                        onSelectLead(lead.id);
                      }
                    });
                  } else {
                    selectedLeads.forEach(id => onSelectLead(id));
                  }
                }}
              />
            </TableCell>
            <TableCell>{t('Applicant')}</TableCell>
            <TableCell>{t('Contact')}</TableCell>
            <TableCell>{t('Score')}</TableCell>
            <TableCell>{t('Status')}</TableCell>
            <TableCell>{t('Source')}</TableCell>
            <TableCell>{t('Applied')}</TableCell>
            <TableCell>{t('Actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leads.map((lead) => {
            const statusInfo = getStatusInfo(lead.status);
            const initials = lead.name
              ? lead.name.split(' ').map(n => n[0]).join('').toUpperCase()
              : lead.email?.[0]?.toUpperCase() || '?';
            
            return (
              <TableRow
                key={lead.id}
                hover
                onClick={() => onLeadClick(lead)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onSelectLead(lead.id)}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                      {initials}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {lead.name || t('Anonymous')}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">{lead.email}</Typography>
                  {lead.phone && (
                    <Typography variant="caption" color="text.secondary">
                      {lead.phone}
                    </Typography>
                  )}
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={lead.score}
                    color={getScoreColor(lead.score)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={statusInfo.label}
                    color={statusInfo.color}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">{lead.source_portal}</Typography>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title={t('View Details')}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeadClick(lead);
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Send Message')}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle message action
                        }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('Schedule Viewing')}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle schedule action
                        }}
                      >
                        <ScheduleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

export default ApplicationsTable;