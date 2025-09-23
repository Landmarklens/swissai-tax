import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Grid,
  Paper,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import { styled } from '@mui/system';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useTranslation } from 'react-i18next';

const FAQContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8f9fb',
  borderRadius: '24px',
  padding: theme.spacing(6),
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  }
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: '12px !important',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: 'none',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: theme.spacing(2, 0),
    border: '2px solid',
    borderColor: theme.palette.primary.light,
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  '& .MuiAccordionSummary-content': {
    margin: '20px 0',
  },
  '&.Mui-expanded': {
    minHeight: 48,
  },
}));

const CategoryCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  borderRadius: '12px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: '2px solid transparent',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    backgroundColor: 'rgba(62, 99, 221, 0.05)',
  }
}));

const MetricBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(62, 99, 221, 0.05)',
  borderRadius: '8px',
  borderLeft: '3px solid',
  borderLeftColor: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const LandlordFAQ = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const categories = [
    {
      icon: <SecurityIcon sx={{ fontSize: '2rem', mb: 1 }} />,
      label: t('Security & Compliance'),
      color: '#3E63DD'
    },
    {
      icon: <MonetizationOnIcon sx={{ fontSize: '2rem', mb: 1 }} />,
      label: t('ROI & Pricing'),
      color: '#65BA74'
    },
    {
      icon: <IntegrationInstructionsIcon sx={{ fontSize: '2rem', mb: 1 }} />,
      label: t('Integration & Setup'),
      color: '#AA99EC'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: '2rem', mb: 1 }} />,
      label: t('Success Metrics'),
      color: '#FF9800'
    }
  ];

  const faqData = {
    security: [
      {
        question: t('How is my property and tenant data protected?'),
        answer: t('We implement bank-level security with 256-bit encryption for all data transmission and storage. All data is stored in Swiss data centers compliant with FADP and GDPR regulations.'),
        details: [
          t('End-to-end encryption for all communications'),
          t('Swiss data residency guarantees'),
          t('Regular security audits and penetration testing'),
          t('ISO 27001 compliance in progress'),
          t('Automatic data backups every 24 hours')
        ]
      },
      {
        question: t('Are you compliant with Swiss rental laws?'),
        answer: t('Yes, our platform is fully compliant with Swiss federal and cantonal rental regulations. All document templates and processes are regularly reviewed by legal experts.'),
        details: [
          t('Updated templates for all 26 cantons'),
          t('Automatic compliance checks for contracts'),
          t('Regular legal updates and notifications'),
          t('Built-in rent control calculations'),
          t('Proper notice period management')
        ]
      },
      {
        question: t('How is tenant privacy handled?'),
        answer: t('Tenant privacy is paramount. We only collect necessary information with explicit consent and follow strict data minimization principles.'),
        details: [
          t('GDPR-compliant consent management'),
          t('Automatic data deletion after legal retention periods'),
          t('Tenant right to data portability'),
          t('Anonymous analytics only'),
          t('No data sharing with third parties without consent')
        ]
      },
      {
        question: t('What happens to my data if I cancel?'),
        answer: t('You retain full ownership of your data. Upon cancellation, you can export all data, and we securely delete it after the legal retention period.'),
        details: [
          t('Full data export in standard formats (CSV, PDF)'),
          t('30-day grace period for data retrieval'),
          t('Secure deletion certificates provided'),
          t('Option to pause instead of delete'),
          t('No lock-in or proprietary formats')
        ]
      }
    ],
    roi: [
      {
        question: t('How much time will I actually save?'),
        answer: t('On average, landlords save 8-12 hours per property per month through automation of routine tasks.'),
        metrics: {
          listing: '2 hours saved',
          screening: '4 hours saved',
          communications: '3 hours saved',
          documentation: '2 hours saved',
          total: '11 hours/month'
        },
        calculation: t("Based on CHF 50/hour value of time, that's CHF 550 saved monthly per property")
      },
      {
        question: t("What's the real ROI for small landlords?"),
        answer: t('For landlords with 3-5 properties, the platform typically pays for itself within the first month through reduced vacancy alone.'),
        breakdown: [
          { label: t('Average vacancy reduction'), value: '12 days' },
          { label: t('Daily rental loss avoided'), value: 'CHF 70-100' },
          { label: t('Monthly savings from vacancy'), value: 'CHF 840-1200' },
          { label: t('Platform cost (3 properties)'), value: 'CHF 147' },
          { label: t('Net monthly benefit'), value: 'CHF 693-1053' }
        ]
      },
      {
        question: t('Are there hidden costs?'),
        answer: t('No hidden costs. Our transparent pricing includes all features with no setup fees, transaction fees, or surprise charges.'),
        included: [
          t('Unlimited property listings'),
          t('All applicant screenings'),
          t('Document generation and e-signatures'),
          t('Market analytics and pricing tools'),
          t('24/7 support and updates')
        ]
      },
      {
        question: t('Can I try before committing?'),
        answer: t('Yes! We offer a 7-day free trial with full access to all features. No credit card required to start.'),
        trial: [
          t('Full feature access during trial'),
          t('Up to 3 properties'),
          t('Real tenant applications'),
          t('Export data anytime'),
          t('Cancel without any charges')
        ]
      }
    ],
    integration: [
      {
        question: t('How long does setup take?'),
        answer: t('Most landlords are fully set up within 15 minutes. Import existing properties in bulk or add them individually.'),
        steps: [
          { step: 1, task: t('Create account'), time: '2 min' },
          { step: 2, task: t('Import/add properties'), time: '5 min' },
          { step: 3, task: t('Configure preferences'), time: '3 min' },
          { step: 4, task: t('Review and publish'), time: '5 min' }
        ]
      },
      {
        question: t('Can I import from existing tools?'),
        answer: t('Yes, we support imports from major property management tools and Excel/CSV files.'),
        supported: [
          'ImmoScout24 exports',
          'Homegate data',
          'Excel/CSV files',
          'Google Sheets',
          'Manual PDF extraction'
        ],
        process: t('Our AI automatically maps fields and validates data during import')
      },
      {
        question: t('Does it integrate with my accounting software?'),
        answer: t('We offer direct integrations with popular Swiss accounting tools and standard export formats.'),
        integrations: [
          { name: 'Bexio', status: 'Direct integration' },
          { name: 'Swiss21', status: 'API connection' },
          { name: 'QuickBooks', status: 'CSV export' },
          { name: 'Excel', status: 'Full export' },
          { name: 'Custom', status: 'API available' }
        ]
      },
      {
        question: t('What about existing tenant data?'),
        answer: t('Easily import your current tenant database with our migration tools. We help map fields and ensure data integrity.'),
        migration: [
          t('Bulk import via CSV/Excel'),
          t('Automatic field mapping'),
          t('Data validation and cleaning'),
          t('Duplicate detection'),
          t('Historical data preservation')
        ]
      }
    ],
    metrics: [
      {
        question: t('How do I measure success?'),
        answer: t('Our dashboard provides real-time metrics on all aspects of your property management performance.'),
        kpis: [
          { metric: t('Average days to rent'), target: '< 20 days', typical: '15-18 days' },
          { metric: t('Application quality score'), target: '> 85%', typical: '88-92%' },
          { metric: t('Response time'), target: '< 1 hour', typical: '5 minutes' },
          { metric: t('Tenant satisfaction'), target: '> 90%', typical: '94%' },
          { metric: t('Occupancy rate'), target: '> 95%', typical: '97%' }
        ]
      },
      {
        question: t('What improvements can I expect?'),
        answer: t('Based on our data, landlords typically see significant improvements across all metrics within the first month.'),
        improvements: [
          { area: t('Vacancy period'), improvement: '-60%', from: '30 days', to: '12 days' },
          { area: t('Time to first applicant'), improvement: '-75%', from: '4 days', to: '1 day' },
          { area: t('Admin time'), improvement: '-70%', from: '15 hrs', to: '4.5 hrs' },
          { area: t('Qualified applicants'), improvement: '+250%', from: '2-3', to: '7-8' },
          { area: t('Rental income'), improvement: '+5%', from: 'Market', to: 'Optimized' }
        ]
      },
      {
        question: t('How do you ensure quality tenants?'),
        answer: t('Our AI screening analyzes multiple data points to predict tenant reliability with 94% accuracy.'),
        screening: [
          t('Financial stability analysis'),
          t('Employment verification'),
          t('Previous rental history'),
          t('Credit score integration'),
          t('Social proof validation'),
          t('Automated reference checks')
        ]
      },
      {
        question: t('Can I track ROI over time?'),
        answer: t('Yes, our analytics dashboard shows your actual time and cost savings compared to traditional methods.'),
        tracking: [
          t('Monthly ROI reports'),
          t('Time saved tracking'),
          t('Vacancy cost analysis'),
          t('Efficiency trends'),
          t('Comparative benchmarks'),
          t('Exportable reports for taxes')
        ]
      }
    ]
  };

  const getCategoryFAQs = () => {
    switch (selectedCategory) {
      case 0:
        return faqData.security;
      case 1:
        return faqData.roi;
      case 2:
        return faqData.integration;
      case 3:
        return faqData.metrics;
      default:
        return faqData.security;
    }
  };

  return (
    <FAQContainer>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {t('FAQ')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Everything you need to know about managing properties with AI')}
          </Typography>
        </Box>

        {/* Category Selector */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {categories.map((category, index) => (
            <Grid item xs={6} md={3} key={index}>
              <CategoryCard
                elevation={0}
                className={selectedCategory === index ? 'selected' : ''}
                onClick={() => setSelectedCategory(index)}
              >
                <Box sx={{ color: category.color }}>
                  {category.icon}
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {category.label}
                </Typography>
              </CategoryCard>
            </Grid>
          ))}
        </Grid>

        {/* FAQ Items */}
        <Box>
          {getCategoryFAQs().map((faq, index) => (
            <StyledAccordion
              key={index}
              expanded={expanded === `panel${selectedCategory}-${index}`}
              onChange={handleChange(`panel${selectedCategory}-${index}`)}
            >
              <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>
                  {faq.question}
                </Typography>
              </StyledAccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" paragraph>
                  {faq.answer}
                </Typography>

                {/* Security Details */}
                {faq.details && (
                  <List dense>
                    {faq.details.map((detail, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={detail} />
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* ROI Metrics */}
                {faq.metrics && (
                  <MetricBox>
                    <Grid container spacing={2}>
                      {Object.entries(faq.metrics).map(([key, value]) => (
                        <Grid item xs={6} sm={4} key={key}>
                          <Typography variant="caption" color="text.secondary">
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="primary">
                            {value}
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                    {faq.calculation && (
                      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                        {faq.calculation}
                      </Typography>
                    )}
                  </MetricBox>
                )}

                {/* ROI Breakdown */}
                {faq.breakdown && (
                  <Box sx={{ mt: 2 }}>
                    {faq.breakdown.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={600} color={item.label.includes('Net') ? 'success.main' : 'text.primary'}>
                          {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Included Features */}
                {faq.included && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      {t('All included in your subscription:')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {faq.included.map((item, idx) => (
                        <Chip
                          key={idx}
                          label={item}
                          size="small"
                          icon={<CheckCircleIcon />}
                          color="success"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Trial Features */}
                {faq.trial && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(101, 186, 116, 0.1)', borderRadius: '8px' }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600} color="success.main">
                      {t('Free Trial Includes:')}
                    </Typography>
                    <Grid container spacing={1}>
                      {faq.trial.map((item, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                            <Typography variant="body2">{item}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Setup Steps */}
                {faq.steps && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      {faq.steps.map((item, idx) => (
                        <Grid item xs={6} sm={3} key={idx}>
                          <Paper elevation={0} sx={{ p: 2, textAlign: 'center', backgroundColor: 'rgba(62, 99, 221, 0.05)' }}>
                            <Typography variant="h6" color="primary">{item.step}</Typography>
                            <Typography variant="caption" display="block">{item.task}</Typography>
                            <Chip label={item.time} size="small" sx={{ mt: 1 }} />
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Supported Formats */}
                {faq.supported && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      {t('Supported Import Formats:')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {faq.supported.map((format, idx) => (
                        <Chip key={idx} label={format} variant="outlined" size="small" />
                      ))}
                    </Box>
                    {faq.process && (
                      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                        💡 {faq.process}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Integration List */}
                {faq.integrations && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {faq.integrations.map((integration, idx) => (
                      <Grid item xs={6} sm={4} key={idx}>
                        <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                          <Typography variant="subtitle2" fontWeight={600}>{integration.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{integration.status}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Migration Features */}
                {faq.migration && (
                  <List dense sx={{ mt: 2 }}>
                    {faq.migration.map((feature, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <VerifiedUserIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* KPIs */}
                {faq.kpis && (
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      {faq.kpis.map((kpi, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={idx}>
                          <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                            <Typography variant="caption" color="text.secondary">{kpi.metric}</Typography>
                            <Typography variant="h6" fontWeight={600} color="primary">{kpi.typical}</Typography>
                            <Typography variant="caption">Target: {kpi.target}</Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Improvements Table */}
                {faq.improvements && (
                  <Box sx={{ mt: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>{t('Area')}</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>{t('Before')}</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>{t('After')}</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>{t('Improvement')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faq.improvements.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                            <td style={{ padding: '8px' }}>{item.area}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.from}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.to}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <Chip
                                label={item.improvement}
                                size="small"
                                color={item.improvement.startsWith('+') ? 'success' : 'primary'}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}

                {/* Screening Features */}
                {faq.screening && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      {t('AI Screening Includes:')}
                    </Typography>
                    <Grid container spacing={1}>
                      {faq.screening.map((item, idx) => (
                        <Grid item xs={12} sm={6} key={idx}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <VerifiedUserIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                            <Typography variant="body2">{item}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Tracking Features */}
                {faq.tracking && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      {t('ROI Tracking Features:')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {faq.tracking.map((feature, idx) => (
                        <Chip
                          key={idx}
                          icon={<TrendingUpIcon />}
                          label={feature}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </StyledAccordion>
          ))}
        </Box>

        {/* CTA Section */}
        <Box sx={{
          textAlign: 'center',
          mt: 6,
          p: 4,
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <Typography variant="h5" gutterBottom fontWeight={600}>
            {t('Still have questions?')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('Our team is here to help you get started')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={() => window.location.href = '/contact-us'}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                py: 1,
                px: 3,
                borderColor: theme => theme.palette.primary.main,
                color: theme => theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme => theme.palette.primary.dark,
                  backgroundColor: 'rgba(62, 99, 221, 0.04)'
                }
              }}
            >
              {t('Email Support')}
            </Button>

            <Button
              variant="contained"
              startIcon={<CalendarTodayIcon />}
              href="https://calendly.com/homeai"
              target="_blank"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                py: 1,
                px: 3,
                backgroundColor: theme => theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme => theme.palette.primary.dark
                }
              }}
            >
              {t('Schedule Demo')}
            </Button>
          </Box>
        </Box>
      </Container>
    </FAQContainer>
  );
};

export default LandlordFAQ;