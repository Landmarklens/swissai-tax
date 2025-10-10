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
  { questionKey: 'security.faq.q6.question', answerKey: 'security.faq.q6.answer' },
  { questionKey: 'security.faq.q7.question', answerKey: 'security.faq.q7.answer' },
  { questionKey: 'security.faq.q8.question', answerKey: 'security.faq.q8.answer' }
];

const SecurityFAQ = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
      <Container maxWidth="md">
        {/* Section Header */}
        <Typography
          variant="h4"
          component="h2"
          fontWeight={700}
          textAlign="center"
          mb={4}
          sx={{ fontSize: { xs: '1.75rem', md: '2rem' } }}
        >
          {t('security.faq.title')}
        </Typography>

        {/* FAQ Accordions */}
        <Stack spacing={2}>
          {faqItems.map((item, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              elevation={0}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px !important',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5, py: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}>
                  {t(item.questionKey)}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
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
