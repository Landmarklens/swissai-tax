import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

const FAQSection = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Tax-specific FAQ categories
  const categories = [
    {
      title: t('Getting Started'),
      icon: <HelpOutlineIcon />,
      color: '#003DA5'
    },
    {
      title: t('Pricing & Payment'),
      icon: <AccountBalanceIcon />,
      color: '#0052CC'
    },
    {
      title: t('Security & Privacy'),
      icon: <SecurityIcon />,
      color: '#00796B'
    },
    {
      title: t('Technical Support'),
      icon: <SupportAgentIcon />,
      color: '#5E35B1'
    }
  ];

  // Tax-specific FAQ data (using the taxFaqData structure)
  const taxFaqData = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: t('Who can use SwissAI Tax?'),
          answer: t('SwissAI Tax is designed for all Swiss residents who need to file a personal tax return. We support employees, pensioners, freelancers, and anyone with simple to moderately complex tax situations across all 26 Swiss cantons.')
        },
        {
          question: t('What documents do I need to get started?'),
          answer: t('You\'ll need your salary certificates (Lohnausweis), bank statements, insurance premium statements, and any receipts for deductible expenses. Don\'t worry if you don\'t have everything ready - our AI will guide you through what\'s needed and you can save your progress anytime.')
        },
        {
          question: t('How long does it really take to complete my tax return?'),
          answer: t('Most users complete their tax return in about 20 minutes. If you have all your documents ready, simple employee returns can be done in as little as 15 minutes. More complex situations with multiple income sources may take 30-45 minutes.')
        }
      ]
    },
    {
      category: 'Pricing & Payment',
      questions: [
        {
          question: t('What\'s included in the CHF 49 fee?'),
          answer: t('The CHF 49 fee includes: AI-guided tax interview, unlimited document uploads with OCR scanning, automatic deduction discovery, canton-specific form completion, real-time refund calculation, digital submission to your tax office, and email support. You only pay when you\'re ready to submit.')
        },
        {
          question: t('When do I have to pay?'),
          answer: t('You only pay when you\'re satisfied with your completed tax return and ready to submit it to the tax office. You can use all features, review your return, and see your estimated refund before making any payment.')
        },
        {
          question: t('Are there any hidden fees?'),
          answer: t('No hidden fees whatsoever. The price you see is the price you pay. Complex returns that require securities trading or real estate transactions are clearly marked as CHF 99, but we\'ll tell you upfront if your situation requires the Professional tier.')
        }
      ]
    },
    {
      category: 'Security & Privacy',
      questions: [
        {
          question: t('How is my data protected?'),
          answer: t('We use bank-level 256-bit SSL encryption for all data transmission and storage. Your documents and personal information are encrypted both in transit and at rest. We follow Swiss data protection laws (DSG) and GDPR compliance standards.')
        },
        {
          question: t('Where is my data stored?'),
          answer: t('All data is stored in secure data centers located in Switzerland. Your information never leaves Swiss borders, ensuring compliance with Swiss privacy laws and maintaining the highest standards of data sovereignty.')
        },
        {
          question: t('Who can access my tax information?'),
          answer: t('Only you can access your tax information using your secure login credentials. Our support team can only view your data if you explicitly grant permission for troubleshooting. We never share your information with third parties.')
        }
      ]
    },
    {
      category: 'Technical Support',
      questions: [
        {
          question: t('Which browsers are supported?'),
          answer: t('SwissAI Tax works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser for the best experience. The platform is fully responsive and works on all devices.')
        },
        {
          question: t('Can I use my phone to complete my tax return?'),
          answer: t('Yes! Our mobile-optimized platform works perfectly on smartphones and tablets. The camera on your phone is ideal for scanning documents - just take a photo and our OCR technology extracts the data automatically.')
        },
        {
          question: t('What if I need help during the process?'),
          answer: t('Help is always available! Click the help icon for contextual assistance, use our chat support during business hours, or email support@swissai.tax. Most questions are answered by our AI assistant instantly, with human experts available for complex issues.')
        }
      ]
    }
  ];

  return (
    <Box
      sx={{
        backgroundColor: '#f8f9fb',
        borderRadius: '24px',
        padding: { xs: 4, md: 6 },
        marginTop: 8,
        marginBottom: 8
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: '#1A1A1A' }}>
            {t('Frequently Asked Questions')}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t('Everything you need to know about filing your Swiss taxes')}
          </Typography>
        </Box>

        {/* Category Selector */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                onClick={() => setSelectedCategory(index)}
                sx={{
                  p: 2.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedCategory === index
                    ? `2px solid ${category.color}`
                    : '2px solid transparent',
                  backgroundColor: selectedCategory === index
                    ? `${category.color}10`
                    : 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box sx={{ color: category.color, mb: 1, '& svg': { fontSize: 32 } }}>
                  {category.icon}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {category.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Questions for selected category */}
        <Box>
          {taxFaqData[selectedCategory] &&
            taxFaqData[selectedCategory].questions.map((q, questionIndex) => {
              const panelId = `panel-${selectedCategory}-${questionIndex}`;
              return (
                <Accordion
                  key={panelId}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  sx={{
                    marginBottom: 2,
                    borderRadius: '12px !important',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: 'none',
                    overflow: 'hidden',
                    '&:before': {
                      display: 'none'
                    },
                    '&.Mui-expanded': {
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      borderColor: theme.palette.primary.main
                    }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}
                    aria-controls={`${panelId}-content`}
                    id={`${panelId}-header`}
                    sx={{
                      padding: '16px 24px',
                      '& .MuiAccordionSummary-content': {
                        margin: '8px 0'
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                      {q.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      padding: '16px 24px 24px 24px',
                      backgroundColor: '#fafbfc',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <Typography color="text.secondary">
                      {q.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })
          }
        </Box>
      </Container>
    </Box>
  );
};

export default FAQSection;