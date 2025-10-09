import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Paper
} from '@mui/material';
import { theme } from '../../../theme/theme';
import { useTranslation } from 'react-i18next';
import { FAQ } from '../../../constants/FAQ';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const FAQSection = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Define categories with icons
  const categories = [
    {
      title: FAQ[0]?.title || 'Getting Started',
      icon: <SecurityIcon />,
      color: '#DC0018'
    },
    {
      title: FAQ[1]?.title || 'Tax Filing Process',
      icon: <MonetizationOnIcon />,
      color: '#00A651'
    },
    {
      title: FAQ[2]?.title || 'Deductions & Savings',
      icon: <IntegrationInstructionsIcon />,
      color: '#003DA5'
    },
    {
      title: FAQ[3]?.title || 'Security & Privacy',
      icon: <TrendingUpIcon />,
      color: '#FFB81C'
    },
    {
      title: FAQ[4]?.title || 'Technical Support',
      icon: <SecurityIcon />,
      color: '#6B46C1'
    },
    {
      title: FAQ[5]?.title || 'Pricing & Payment',
      icon: <MonetizationOnIcon />,
      color: '#DC0018'
    }
  ];

  const renderContent = (question) => {
    return (
      <Box>
        {/* Main answer */}
        <Typography sx={{ mb: question.bulletPoints || question.detailedPoints || question.examples ? 1 : 0 }}>
          {question.answer}
        </Typography>

        {/* Simple bullet points */}
        {question.bulletPoints && (
          <Box component="ul" sx={{ pl: 3, mb: 1 }}>
            {question.bulletPoints.map((point, idx) => (
              <li key={idx}>
                <Typography>{point}</Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Detailed points with titles and descriptions */}
        {question.detailedPoints && (
          <Box component="ul" sx={{ pl: 3, mb: 1 }}>
            {question.detailedPoints.map((point, idx) => (
              <li key={idx}>
                <Typography>
                  <strong>{point.title}</strong> {point.description}
                </Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Free text example (not a bullet point) */}
        {question.freeTextExample && (
          <Typography sx={{ mt: 1, mb: 1 }}>
            <strong>{t('filing.example')}</strong> {question.freeTextExample.replace('Example: ', '')}
          </Typography>
        )}

        {/* Family considerations (as bullet points) */}
        {question.familyConsiderations && (
          <Box component="ul" sx={{ pl: 3, mt: 1, mb: 1 }}>
            {question.familyConsiderations.map((consideration, idx) => (
              <li key={idx}>
                <Typography>
                  <strong>{t('filing.family_considerations')}</strong> {consideration.replace('Family Considerations: ', '')}
                </Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Examples section (for other examples) */}
        {question.examples && (
          <Box sx={{ mt: 1, mb: 1 }}>
            {question.examples.map((example, idx) => (
              <Typography key={idx} sx={{ mb: 1 }}>
                <strong>{example.title}</strong> {example.description}
              </Typography>
            ))}
          </Box>
        )}

        {/* Quote */}
        {question.quote && (
          <Typography sx={{
            fontStyle: 'italic',
            pl: 2,
            borderLeft: '3px solid #3356D4',
            my: 1,
            color: '#555'
          }}>
            {question.quote}
          </Typography>
        )}

        {/* Process description */}
        {question.process && (
          <Typography sx={{ mt: 1, mb: 1 }}>
            {question.process}
          </Typography>
        )}

        {/* Process steps */}
        {question.processSteps && (
          <Box component="ol" sx={{ pl: 3, mb: 1 }}>
            {question.processSteps.map((step, idx) => (
              <li key={idx}>
                <Typography>{step}</Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Analysis points (nested bullet points) */}
        {question.analysisPoints && (
          <Box component="ul" sx={{ pl: 5, mb: 1 }}>
            {question.analysisPoints.map((point, idx) => (
              <li key={idx}>
                <Typography>{point}</Typography>
              </li>
            ))}
          </Box>
        )}

        {/* Result introduction */}
        {question.resultIntro && (
          <Typography sx={{ mt: 1, mb: 1 }}>
            {question.resultIntro}
          </Typography>
        )}

        {/* Result quote */}
        {question.resultQuote && (
          <Typography sx={{
            fontStyle: 'italic',
            pl: 2,
            borderLeft: '3px solid #28a745',
            my: 1,
            color: '#155724',
            backgroundColor: '#f8f9fa',
            p: 1.5,
            borderRadius: 1
          }}>
            {question.resultQuote}
          </Typography>
        )}

        {/* Conclusion */}
        {question.conclusion && (
          <Typography sx={{ mt: 1, fontWeight: 500 }}>
            {question.conclusion}
          </Typography>
        )}

        {/* Legacy solution field (for backward compatibility) */}
        {question.solution && (
          <Typography sx={{ mt: 1, fontStyle: 'italic' }}>
            {question.solution}
          </Typography>
        )}

        {/* Legacy options field (for backward compatibility) */}
        {question.options && Array.isArray(question.options) && (
          <Box component="ul" sx={{ pl: 3, mt: 1 }}>
            {question.options.map((opt, idx) => (
              <li key={idx}>
                <Typography>
                  <strong>{opt.title}</strong>{opt.text}
                </Typography>
              </li>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{
      backgroundColor: '#f8f9fb',
      borderRadius: '24px',
      padding: 6,
      marginTop: 8,
      marginBottom: 8,
    }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            {t('Frequently Asked Questions')}
          </Typography>
        </Box>

        {/* Category Selector */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                onClick={() => setSelectedCategory(index)}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: selectedCategory === index ? `2px solid ${category.color}` : '2px solid transparent',
                  backgroundColor: selectedCategory === index ? 'rgba(62, 99, 221, 0.04)' : 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Box sx={{ color: category.color, mb: 1 }}>
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
        <Box component="div" display="flex" flexDirection="column" gap={2}>
          {FAQ[selectedCategory] && (
            <>
              {FAQ[selectedCategory].questions.map((q, questionIndex) => {
                const panelId = `panel-${selectedCategory}-${questionIndex}`;
                return (
                  <Accordion
                    key={panelId}
                    expanded={expanded === panelId}
                    onChange={handleChange(panelId)}
                    sx={{
                      marginBottom: 2,
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: 'none',
                      '&:before': {
                        display: 'none',
                      },
                      '&.Mui-expanded': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        borderColor: theme.palette.primary.main,
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
                          margin: '8px 0',
                        },
                      }}
                    >
                      <Typography sx={{ fontWeight: 500, fontSize: '1.05rem' }}>
                        {q.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{
                      padding: '16px 24px 24px 24px',
                      backgroundColor: '#fafbfc',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    }}>
                      {renderContent(q)}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default FAQSection;