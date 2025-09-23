import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Rating
} from '@mui/material';
import { styled } from '@mui/system';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import { useTranslation } from 'react-i18next';

const CaseStudyCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '16px',
  border: '1px solid rgba(62, 99, 221, 0.1)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
    borderColor: theme.palette.primary.main,
  },
}));

const QuoteIcon = styled(FormatQuoteIcon)(({ theme }) => ({
  position: 'absolute',
  top: -10,
  left: 20,
  fontSize: '3rem',
  color: theme.palette.primary.light,
  opacity: 0.3,
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: 'rgba(62, 99, 221, 0.05)',
  borderRadius: '8px',
  marginBottom: theme.spacing(1),
}));

const CaseStudies = () => {
  const { t } = useTranslation();

  const caseStudies = [
    {
      name: 'Marcel Schneider',
      role: t('Property Owner, Zurich'),
      avatar: 'MS',
      properties: 5,
      quote: t('HomeAI reduced my vacancy periods by 60%. What used to take weeks now happens in days. The AI screening saves me hours of manual review.'),
      rating: 5,
      metrics: [
        { icon: <TrendingUpIcon fontSize="small" />, label: t('Vacancy'), value: '-18 days' },
        { icon: <AccessTimeIcon fontSize="small" />, label: t('Time saved'), value: '12 hrs/month' },
      ],
      highlight: t('60% faster rentals')
    },
    {
      name: 'Sophie Dubois',
      role: t('Real Estate Manager, Geneva'),
      avatar: 'SD',
      properties: 12,
      quote: t('The automated tenant screening is incredible. I get quality applicants ranked by AI, and the document automation has streamlined everything.'),
      rating: 5,
      metrics: [
        { icon: <HomeWorkIcon fontSize="small" />, label: t('Properties'), value: '12 managed' },
        { icon: <TrendingUpIcon fontSize="small" />, label: t('Efficiency'), value: '+85%' },
      ],
      highlight: t('85% more efficient')
    },
    {
      name: 'Andreas Weber',
      role: t('Private Landlord, Basel'),
      avatar: 'AW',
      properties: 3,
      quote: t('As a part-time landlord, HomeAI is a game-changer. The platform handles inquiries 24/7, and I never miss a good tenant anymore.'),
      rating: 5,
      metrics: [
        { icon: <AccessTimeIcon fontSize="small" />, label: t('Response'), value: '24/7 instant' },
        { icon: <TrendingUpIcon fontSize="small" />, label: t('ROI'), value: 'CHF 8,400/year' },
      ],
      highlight: t('CHF 8,400 saved yearly')
    }
  ];

  return (
    <Box sx={{ mt: 6, mb: 6 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
        {t('Success Stories from Swiss Landlords')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
        {t('See how property owners are transforming their rental business with AI')}
      </Typography>

      <Grid container spacing={4}>
        {caseStudies.map((study, index) => (
          <Grid item xs={12} md={4} key={index}>
            <CaseStudyCard elevation={0}>
              <QuoteIcon />
              <CardContent sx={{ pt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 48,
                      height: 48,
                      fontWeight: 600
                    }}>
                    {study.avatar}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {study.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {study.role}
                    </Typography>
                  </Box>
                </Box>

                <Rating value={study.rating} readOnly size="small" sx={{ mb: 2 }} />

                <Typography variant="body2" sx={{ mb: 3, fontStyle: 'italic', color: 'text.secondary' }}>
                  "{study.quote}"
                </Typography>

                <Chip
                  label={study.highlight}
                  color="primary"
                  size="small"
                  sx={{ mb: 2, fontWeight: 600 }}
                />

                <Box>
                  {study.metrics.map((metric, idx) => (
                    <MetricBox key={idx}>
                      {metric.icon}
                      <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>
                        {metric.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {metric.value}
                      </Typography>
                    </MetricBox>
                  ))}
                </Box>
              </CardContent>
            </CaseStudyCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CaseStudies;