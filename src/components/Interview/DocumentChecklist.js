import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  // Map document types to icons and descriptions
  const documentInfo = {
    lohnausweis: {
      icon: <Work />,
      label: t('document.checklist.types.lohnausweis.label'),
      description: t('document.checklist.types.lohnausweis.description'),
      category: t('document.checklist.categories.employment')
    },
    unemployment_statement: {
      icon: <Assignment />,
      label: t('document.checklist.types.unemployment_statement.label'),
      description: t('document.checklist.types.unemployment_statement.description'),
      category: t('document.checklist.categories.benefits')
    },
    insurance_benefits: {
      icon: <Assignment />,
      label: t('document.checklist.types.insurance_benefits.label'),
      description: t('document.checklist.types.insurance_benefits.description'),
      category: t('document.checklist.categories.benefits')
    },
    pension_certificate: {
      icon: <AccountBalance />,
      label: t('document.checklist.types.pension_certificate.label'),
      description: t('document.checklist.types.pension_certificate.description'),
      category: t('document.checklist.categories.pension')
    },
    pillar_3a_certificate: {
      icon: <AccountBalance />,
      label: t('document.checklist.types.pillar_3a_certificate.label'),
      description: t('document.checklist.types.pillar_3a_certificate.description'),
      category: t('document.checklist.categories.pension')
    },
    property_tax_statement: {
      icon: <Home />,
      label: t('document.checklist.types.property_tax_statement.label'),
      description: t('document.checklist.types.property_tax_statement.description'),
      category: t('document.checklist.categories.property')
    },
    mortgage_statement: {
      icon: <Home />,
      label: t('document.checklist.types.mortgage_statement.label'),
      description: t('document.checklist.types.mortgage_statement.description'),
      category: t('document.checklist.categories.property')
    },
    securities_statement: {
      icon: <AttachMoney />,
      label: t('document.checklist.types.securities_statement.label'),
      description: t('document.checklist.types.securities_statement.description'),
      category: t('document.checklist.categories.investments')
    },
    donation_receipts: {
      icon: <VolunteerActivism />,
      label: t('document.checklist.types.donation_receipts.label'),
      description: t('document.checklist.types.donation_receipts.description'),
      category: t('document.checklist.categories.deductions')
    },
    medical_receipts: {
      icon: <LocalHospital />,
      label: t('document.checklist.types.medical_receipts.label'),
      description: t('document.checklist.types.medical_receipts.description'),
      category: t('document.checklist.categories.deductions')
    }
  };

  // Group requirements by category
  const groupedRequirements = requirements.reduce((acc, req) => {
    const info = documentInfo[req.type] || {
      category: t('document.checklist.categories.other'),
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
        {t('document.checklist.no_documents_required')}
      </Alert>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t('document.checklist.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('document.checklist.subtitle')}
          </Typography>

          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                <Typography variant="h4" color="primary.contrastText">
                  {totalDocuments}
                </Typography>
                <Typography variant="body2" color="primary.contrastText">
                  {t('document.checklist.total_documents')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                <Typography variant="h4">
                  {Object.keys(groupedRequirements).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('document.checklist.categories_label')}
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
                              label={t('document.checklist.quantity_required', { count: doc.quantity })}
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
                            {t('document.checklist.rule_label')}: {doc.rule}
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
              {t('document.checklist.important_notes')}
            </Typography>
            <Typography variant="body2">
              • {t('document.checklist.note_tax_year', { year: new Date().getFullYear() - 1 })}
            </Typography>
            <Typography variant="body2">
              • {t('document.checklist.note_format')}
            </Typography>
            <Typography variant="body2">
              • {t('document.checklist.note_originals')}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DocumentChecklist;