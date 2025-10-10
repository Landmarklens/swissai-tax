import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const faqItems = [
  { questionKey: 'security.faq.q1.question', answerKey: 'security.faq.q1.answer' },
  { questionKey: 'security.faq.q2.question', answerKey: 'security.faq.q2.answer' },
  { questionKey: 'security.faq.q3.question', answerKey: 'security.faq.q3.answer' },
  { questionKey: 'security.faq.q4.question', answerKey: 'security.faq.q4.answer' },
  { questionKey: 'security.faq.q5.question', answerKey: 'security.faq.q5.answer' },
  { questionKey: 'security.faq.q6.question', answerKey: 'security.faq.q6.answer' }
];

const SecurityFAQ = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ py: 10, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="md">
        {/* Section Header */}
        <Stack spacing={2} alignItems="center" textAlign="center" mb={6}>
          <Typography
            variant="h3"
            component="h2"
            fontWeight={700}
            sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}
          >
            {t('security.faq.title')}
          </Typography>
        </Stack>

        {/* FAQ Accordions */}
        <Stack spacing={2}>
          {faqItems.map((item, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px !important',
                '&:before': {
                  display: 'none'
                },
                '&.Mui-expanded': {
                  margin: 0,
                  borderColor: 'primary.main'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
                sx={{
                  px: 3,
                  py: 1.5,
                  '& .MuiAccordionSummary-content': {
                    my: 1.5
                  }
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}
                >
                  {t(item.questionKey)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  px: 3,
                  pb: 3,
                  pt: 0,
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  {t(item.answerKey)}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default SecurityFAQ;
