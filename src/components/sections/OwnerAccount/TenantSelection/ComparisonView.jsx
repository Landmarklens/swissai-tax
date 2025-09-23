import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  LinearProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Cancel as XIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
  Groups as GroupIcon,
  Pets as PetsIcon,
  SmokeFree as SmokeIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
  Assignment as DocumentIcon,
  Star as StarIcon,
  EventAvailable as AttendedIcon,
  ThumbUp as SelectIcon,
  ThumbDown as RejectIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ComparisonView = ({
  applications,
  criteria,
  onRemove,
  onDecision
}) => {
  const { t } = useTranslation();
  
  if (applications.length < 2) {
    return (
      <Paper sx={{ p: 8, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Select at least 2 applications to compare
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use the checkbox on application cards to add them to comparison
        </Typography>
      </Paper>
    );
  }
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };
  
  const compareAttributes = [
    {
      key: 'score',
      label: 'AI Score',
      icon: <StarIcon />,
      getValue: (app) => Math.round(app.soft_score || 0),
      format: (val) => val,
      compare: (a, b) => a - b
    },
    {
      key: 'income',
      label: 'Income Ratio',
      icon: <MoneyIcon />,
      getValue: (app) => {
        const income = app.ai_extracted_data?.income || app.dossier_data?.monthly_income;
        return income ? (income / 3500).toFixed(1) : 0;
      },
      format: (val) => `${val}x`,
      compare: (a, b) => a - b
    },
    {
      key: 'employment',
      label: 'Employment',
      icon: <WorkIcon />,
      getValue: (app) => app.ai_extracted_data?.employment_status || app.dossier_data?.employment_type || 'Unknown',
      format: (val) => val,
      compare: (a, b) => {
        const order = { 'permanent': 3, 'employed': 2, 'self-employed': 1, 'Unknown': 0 };
        return (order[a] || 0) - (order[b] || 0);
      }
    },
    {
      key: 'household',
      label: 'Household Size',
      icon: <GroupIcon />,
      getValue: (app) => app.ai_extracted_data?.household_size || app.dossier_data?.number_of_residents || 0,
      format: (val) => `${val} ${val === 1 ? 'person' : 'people'}`,
      compare: (a, b) => b - a // Lower is better
    },
    {
      key: 'pets',
      label: 'Pets',
      icon: <PetsIcon />,
      getValue: (app) => app.ai_extracted_data?.has_pets || app.dossier_data?.pets || false,
      format: (val) => val ? 'Has pets' : 'No pets',
      compare: (a, b) => {
        if (!criteria?.hard_criteria?.pets_allowed) {
          return a === b ? 0 : a ? -1 : 1; // No pets is better if not allowed
        }
        return 0; // No preference if pets allowed
      }
    },
    {
      key: 'smoking',
      label: 'Smoking',
      icon: <SmokeIcon />,
      getValue: (app) => app.ai_extracted_data?.is_smoker || app.dossier_data?.smoker || false,
      format: (val) => val ? 'Smoker' : 'Non-smoker',
      compare: (a, b) => {
        if (!criteria?.hard_criteria?.smoking_allowed) {
          return a === b ? 0 : a ? -1 : 1; // Non-smoker is better if not allowed
        }
        return 0; // No preference if smoking allowed
      }
    },
    {
      key: 'viewing',
      label: 'Viewing',
      icon: <AttendedIcon />,
      getValue: (app) => app.viewing_attended_at ? 'Attended' : app.viewing_slot_id ? 'Scheduled' : 'Not scheduled',
      format: (val) => val,
      compare: (a, b) => {
        const order = { 'Attended': 2, 'Scheduled': 1, 'Not scheduled': 0 };
        return (order[a] || 0) - (order[b] || 0);
      }
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: <DocumentIcon />,
      getValue: (app) => app.dossier_data?.documents_provided?.length || 0,
      format: (val) => `${val}/5`,
      compare: (a, b) => a - b
    },
    {
      key: 'moveIn',
      label: 'Move-in Date',
      icon: <CalendarIcon />,
      getValue: (app) => app.ai_extracted_data?.move_in_date || 'Flexible',
      format: (val) => val === 'Flexible' ? val : new Date(val).toLocaleDateString(),
      compare: () => 0
    }
  ];
  
  // Find the best value for each attribute
  const getBestValue = (attr) => {
    const values = applications.map(app => attr.getValue(app));
    if (attr.compare) {
      const sorted = [...values].sort(attr.compare);
      return sorted[sorted.length - 1];
    }
    return null;
  };
  
  return (
    <Grid container spacing={3}>
      {applications.map((application, index) => {
        const anonymousId = application.anonymized_id || `Applicant #${index + 1}`;
        const score = Math.round(application.soft_score || 0);
        
        return (
          <Grid item xs={12} md={applications.length === 2 ? 6 : 4} key={application.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'grey.400' }}>
                      <PersonIcon />
                    </Avatar>
                    <Typography variant="h6">
                      {anonymousId}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => onRemove(application)}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                {/* Score */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${getScoreColor(score)}.light`,
                      color: `${getScoreColor(score)}.dark`,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    {score}
                  </Box>
                  <Typography variant="caption" display="block" color="text.secondary">
                    AI Score
                  </Typography>
                </Box>
                
                {/* Attributes Comparison */}
                <Table size="small">
                  <TableBody>
                    {compareAttributes.map(attr => {
                      const value = attr.getValue(application);
                      const bestValue = getBestValue(attr);
                      const isBest = attr.compare && bestValue !== null ? 
                        attr.compare(value, bestValue) === 0 : false;
                      
                      return (
                        <TableRow key={attr.key}>
                          <TableCell sx={{ border: 0, py: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                                {attr.icon}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {attr.label}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ border: 0, py: 1 }} align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: isBest ? 600 : 400,
                                  color: isBest ? 'success.main' : 'text.primary'
                                }}
                              >
                                {attr.format(value)}
                              </Typography>
                              {isBest && <StarIcon sx={{ fontSize: 14, color: 'gold' }} />}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {/* Status */}
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={application.lead_status}
                    size="small"
                    color={
                      application.lead_status === 'selected' ? 'success' :
                      application.lead_status === 'rejected' ? 'error' :
                      'default'
                    }
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              
              {/* Actions */}
              <CardActions sx={{ p: 2, pt: 0 }}>
                {application.lead_status !== 'selected' && application.lead_status !== 'rejected' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => onDecision(application)}
                  >
                    Make Decision
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default ComparisonView;