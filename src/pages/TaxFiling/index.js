import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Description,
  Calculate,
  CheckCircle,
  Timer,
  Security,
  Language,
  AttachMoney
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { startInterview } from '../../store/slices/taxFilingSlice';

const TaxFilingLanding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleStartFiling = async () => {
    try {
      await dispatch(startInterview({ taxYear: 2024, language: 'en' })).unwrap();
      navigate('/tax-filing/interview');
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  const features = [
    {
      icon: <Timer color="primary" />,
      title: 'Quick & Easy',
      description: 'Complete your tax filing in under 30 minutes'
    },
    {
      icon: <Security color="primary" />,
      title: 'Secure & Private',
      description: 'Bank-level encryption for all your data'
    },
    {
      icon: <Language color="primary" />,
      title: 'Multi-language',
      description: 'Available in German, French, Italian, and English'
    },
    {
      icon: <AttachMoney color="primary" />,
      title: 'Maximum Refund',
      description: 'AI-powered deduction finder ensures you get every franc back'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Interview',
      description: 'Answer simple questions about your tax situation'
    },
    {
      number: '2',
      title: 'Documents',
      description: 'Upload required documents with OCR scanning'
    },
    {
      number: '3',
      title: 'Review',
      description: 'Check your calculated taxes and deductions'
    },
    {
      number: '4',
      title: 'Submit',
      description: 'E-file directly to tax authorities'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Swiss Tax Filing Made Simple
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          File your Swiss taxes in minutes with AI-powered assistance
        </Typography>
        <Box mt={4}>
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartFiling}
            sx={{ mr: 2, px: 4, py: 1.5 }}
          >
            Start Filing Now
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Calculate />}
            onClick={() => navigate('/tax-filing/calculator')}
            sx={{ px: 4, py: 1.5 }}
          >
            Quick Estimate
          </Button>
        </Box>
      </Box>

      {/* Features Grid */}
      <Grid container spacing={3} mb={6}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Box mb={2}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How It Works Section */}
      <Paper elevation={2} sx={{ p: 4, mb: 6 }}>
        <Typography variant="h4" gutterBottom align="center" mb={4}>
          How It Works
        </Typography>
        <Grid container spacing={3}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box display="flex" alignItems="flex-start">
                <Chip
                  label={step.number}
                  color="primary"
                  sx={{ mr: 2, minWidth: 40, height: 40, fontSize: '1.2rem' }}
                />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Supported Cantons */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Supported Cantons
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {['Zürich', 'Bern', 'Lucerne', 'Basel-Stadt', 'Zug'].map((canton) => (
              <Grid item key={canton}>
                <Chip
                  label={canton}
                  variant="outlined"
                  color="primary"
                  icon={<CheckCircle />}
                />
              </Grid>
            ))}
          </Grid>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            More cantons coming soon!
          </Typography>
        </CardContent>
      </Card>

      {/* Documents Checklist */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Documents You'll Need
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Income Documents
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Lohnausweis (Salary Certificate)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Bank Statements" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Investment Income Statements" />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Deduction Documents
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Pillar 3a Certificates" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Insurance Premium Statements" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Description fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Medical Expense Receipts" />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={handleStartFiling}
          >
            Start Your Tax Filing
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default TaxFilingLanding;