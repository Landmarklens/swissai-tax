import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Box,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import {
  Description,
  Assignment,
  AccountBalance,
  Receipt,
  Home,
  LocalHospital,
  AttachMoney,
  Work,
  VolunteerActivism,
  CheckCircleOutline
} from '@mui/icons-material';

const DocumentChecklist = ({ requirements }) => {
  // Map document types to icons and descriptions
  const documentInfo = {
    lohnausweis: {
      icon: <Work />,
      label: 'Salary Certificate (Lohnausweis)',
      description: 'Annual salary statement from your employer',
      category: 'Employment'
    },
    unemployment_statement: {
      icon: <Assignment />,
      label: 'Unemployment Benefits Statement',
      description: 'Statement from unemployment insurance',
      category: 'Benefits'
    },
    insurance_benefits: {
      icon: <Assignment />,
      label: 'Insurance Benefits Statement',
      description: 'Disability or accident insurance benefits',
      category: 'Benefits'
    },
    pension_certificate: {
      icon: <AccountBalance />,
      label: 'Pension Fund Certificate',
      description: '2nd pillar pension statement',
      category: 'Pension'
    },
    pillar_3a_certificate: {
      icon: <AccountBalance />,
      label: 'Pillar 3a Certificate',
      description: 'Private pension savings statement',
      category: 'Pension'
    },
    property_tax_statement: {
      icon: <Home />,
      label: 'Property Tax Statement',
      description: 'Real estate tax assessment',
      category: 'Property'
    },
    mortgage_statement: {
      icon: <Home />,
      label: 'Mortgage Statement',
      description: 'Annual mortgage interest statement',
      category: 'Property'
    },
    securities_statement: {
      icon: <AttachMoney />,
      label: 'Securities Account Statement',
      description: 'Investment account annual statement',
      category: 'Investments'
    },
    donation_receipts: {
      icon: <VolunteerActivism />,
      label: 'Donation Receipts',
      description: 'Receipts from charitable organizations',
      category: 'Deductions'
    },
    medical_receipts: {
      icon: <LocalHospital />,
      label: 'Medical Expense Receipts',
      description: 'Medical bills and pharmacy receipts',
      category: 'Deductions'
    }
  };

  // Group requirements by category
  const groupedRequirements = requirements.reduce((acc, req) => {
    const info = documentInfo[req.type] || {
      category: 'Other',
      icon: <Description />,
      label: req.type,
      description: req.description
    };

    if (!acc[info.category]) {
      acc[info.category] = [];
    }

    acc[info.category].push({
      ...req,
      ...info
    });

    return acc;
  }, {});

  const totalDocuments = requirements.reduce((sum, req) => sum + (req.quantity || 1), 0);

  if (!requirements || requirements.length === 0) {
    return (
      <Alert severity="info">
        No documents required based on your answers.
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Required Documents Checklist
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Based on your answers, you'll need to provide the following documents
          </Typography>

          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                <Typography variant="h4" color="primary.contrastText">
                  {totalDocuments}
                </Typography>
                <Typography variant="body2" color="primary.contrastText">
                  Total Documents
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="h4">
                  {Object.keys(groupedRequirements).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Categories
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Document Categories */}
          {Object.entries(groupedRequirements).map(([category, docs]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                {category}
              </Typography>
              <List>
                {docs.map((doc, index) => (
                  <ListItem
                    key={`${doc.type}-${index}`}
                    sx={{
                      bgcolor: 'grey.50',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}
                  >
                    <ListItemIcon>
                      {doc.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {doc.label}
                          </Typography>
                          {doc.quantity > 1 && (
                            <Chip
                              label={`${doc.quantity} required`}
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {doc.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rule: {doc.rule}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}

          {/* Important Notes */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Important Notes:
            </Typography>
            <Typography variant="body2">
              • Ensure all documents are for tax year {new Date().getFullYear() - 1}
            </Typography>
            <Typography variant="body2">
              • Documents should be in PDF or image format
            </Typography>
            <Typography variant="body2">
              • Keep original copies for your records
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DocumentChecklist;