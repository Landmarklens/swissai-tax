import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Person,
  Home,
  Work,
  AttachMoney,
  FamilyRestroom,
  Church,
  LocalHospital,
  Gavel
} from '@mui/icons-material';

const ProfileSummary = ({ profile, answers }) => {
  if (!profile) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const sections = [
    {
      title: 'Personal Information',
      icon: <Person />,
      items: [
        { label: 'Civil Status', value: profile.civil_status },
        { label: 'Canton', value: profile.canton },
        { label: 'Municipality', value: profile.municipality }
      ]
    },
    {
      title: 'Family',
      icon: <FamilyRestroom />,
      items: profile.civil_status === 'married' ? [
        { label: 'Spouse', value: `${profile.spouse?.first_name} ${profile.spouse?.last_name}` },
        { label: 'Spouse Employed', value: profile.spouse?.is_employed ? 'Yes' : 'No' },
        { label: 'Children', value: profile.num_children || 0 }
      ] : [
        { label: 'Children', value: profile.num_children || 0 }
      ]
    },
    {
      title: 'Employment & Income',
      icon: <Work />,
      items: [
        { label: 'Number of Employers', value: profile.num_employers },
        { label: 'Unemployment Benefits', value: profile.unemployment_benefits ? 'Yes' : 'No' },
        { label: 'Disability Benefits', value: profile.disability_benefits ? 'Yes' : 'No' },
        { label: 'Pension Fund', value: profile.has_pension_fund ? 'Yes' : 'No' }
      ]
    },
    {
      title: 'Assets & Investments',
      icon: <AttachMoney />,
      items: [
        { label: 'Property Owner', value: profile.owns_property ? 'Yes' : 'No' },
        { label: 'Securities/Investments', value: profile.has_securities ? 'Yes' : 'No' },
        profile.pillar_3a_contribution && {
          label: 'Pillar 3a Contribution',
          value: profile.pillar_3a_amount ? formatCurrency(profile.pillar_3a_amount) : 'Yes'
        }
      ].filter(Boolean)
    },
    {
      title: 'Deductions',
      icon: <Gavel />,
      items: [
        profile.charitable_donations && {
          label: 'Charitable Donations',
          value: profile.donation_amount ? formatCurrency(profile.donation_amount) : 'Yes'
        },
        profile.pays_alimony && {
          label: 'Alimony Payments',
          value: profile.alimony_amount ? formatCurrency(profile.alimony_amount) : 'Yes'
        },
        profile.medical_expenses && {
          label: 'Medical Expenses',
          value: profile.medical_expense_amount ? formatCurrency(profile.medical_expense_amount) : 'Yes'
        }
      ].filter(Boolean)
    },
    {
      title: 'Other',
      icon: <Church />,
      items: [
        {
          label: 'Church Tax',
          value: profile.church_tax === 'none' ? 'No church tax' : profile.church_tax
        }
      ]
    }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Tax Profile Summary
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please review your information below
        </Typography>

        <Grid container spacing={3}>
          {sections.map((section, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {section.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {section.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {section.items.map((item, itemIndex) => (
                    <ListItem key={itemIndex}>
                      <ListItemText
                        primary={item.label}
                        secondary={
                          <Typography variant="body2" color="text.primary">
                            {item.value}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Summary Statistics */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Quick Stats
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Questions Answered
              </Typography>
              <Typography variant="h6">
                {Object.keys(answers).length}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Tax Year
              </Typography>
              <Typography variant="h6">
                {new Date().getFullYear()}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Filing Status
              </Typography>
              <Typography variant="h6">
                {profile.civil_status === 'married' ? 'Joint' : 'Individual'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Canton
              </Typography>
              <Typography variant="h6">
                {profile.canton}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileSummary;