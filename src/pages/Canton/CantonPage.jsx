import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Layout from '../Layout/Layout';
import SEOHelmet from '../../components/SEO/SEOHelmet';

const CantonPage = ({ canton }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const cantonKey = canton.toLowerCase();
  const cantonData = t(`cantons.${cantonKey}`, { returnObjects: true });
  const metaData = t(`cantons.${cantonKey}.meta`, { returnObjects: true });
  const stats = t(`cantons.${cantonKey}.stats`, { returnObjects: true });
  const benefits = t(`cantons.${cantonKey}.benefits`, { returnObjects: true });
  const faqData = t(`cantons.${cantonKey}.faq`, { returnObjects: true });

  const handleGetStarted = () => {
    navigate(`/${i18n.language}/filings`);
  };

  const handleBreadcrumbClick = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  // Icons for benefits
  const benefitIcons = {
    0: <SpeedIcon fontSize="large" color="primary" />,
    1: <SecurityIcon fontSize="large" color="primary" />,
    2: <AttachMoneyIcon fontSize="large" color="primary" />,
    3: <VerifiedUserIcon fontSize="large" color="primary" />,
  };

  return (
    <>
      <SEOHelmet
        title={metaData.title}
        description={metaData.description}
        keywords={metaData.keywords}
      >
        {/* LocalBusiness Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'SwissAI Tax',
            description: metaData.description,
            image: 'https://swissai.tax/og-image.png',
            '@id': `https://swissai.tax/${i18n.language}/${cantonKey}`,
            url: `https://swissai.tax/${i18n.language}/${cantonKey}`,
            telephone: '+41-44-123-4567',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Sandbuckstrasse 24',
              addressLocality: 'Schneisingen',
              postalCode: '5425',
              addressCountry: 'CH',
              addressRegion: canton,
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: stats.latitude || 47.3769,
              longitude: stats.longitude || 8.5417,
            },
            areaServed: {
              '@type': 'State',
              name: canton,
            },
            priceRange: 'CHF 49-149',
            openingHoursSpecification: {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              opens: '09:00',
              closes: '17:00',
            },
            sameAs: [
              'https://www.linkedin.com/company/swissai-tax',
              'https://twitter.com/swissaitax',
            ],
          })}
        </script>

        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `https://swissai.tax/${i18n.language}`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: cantonData.name,
                item: `https://swissai.tax/${i18n.language}/${cantonKey}`,
              },
            ],
          })}
        </script>
      </SEOHelmet>

      <Layout isLanding>
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Box sx={{ py: 2 }}>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
            >
              <MuiLink
                color="inherit"
                href={`/${i18n.language}`}
                onClick={handleBreadcrumbClick(`/${i18n.language}`)}
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                {t('cantons.breadcrumbs.home')}
              </MuiLink>
              <Typography color="text.primary">{cantonData.name}</Typography>
            </Breadcrumbs>
          </Box>

          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 700,
                mb: 2,
                color: 'primary.main',
              }}
            >
              {cantonData.heading}
            </Typography>
            <Typography
              variant="h2"
              component="p"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                color: 'text.secondary',
                mb: 4,
                maxWidth: '800px',
                mx: 'auto',
              }}
            >
              {cantonData.intro}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 2,
              }}
            >
              {cantonData.cta}
            </Button>
          </Box>

          {/* Statistics Section */}
          <Box sx={{ py: 6 }}>
            <Grid container spacing={3}>
              {stats.cards && stats.cards.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      height: '100%',
                      boxShadow: 3,
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 5,
                      },
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h3"
                        component="div"
                        sx={{ fontSize: '2.5rem', fontWeight: 700, color: 'primary.main', mb: 1 }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* About Canton Section */}
          <Box sx={{ py: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontSize: '2rem', fontWeight: 600, mb: 3, textAlign: 'center' }}
            >
              {cantonData.aboutHeading}
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary', mb: 3 }}
            >
              {cantonData.aboutText}
            </Typography>
          </Box>

          {/* Benefits Section */}
          <Box sx={{ py: 6, bgcolor: '#f7f9ff', borderRadius: 2, px: 4 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontSize: '2rem', fontWeight: 600, mb: 4, textAlign: 'center' }}
            >
              {cantonData.benefitsHeading}
            </Typography>
            <Grid container spacing={4}>
              {benefits && benefits.map((benefit, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flexShrink: 0 }}>
                      {benefitIcons[index] || <VerifiedUserIcon fontSize="large" color="primary" />}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ py: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{ fontSize: '2rem', fontWeight: 600, mb: 4, textAlign: 'center' }}
            >
              {cantonData.faqHeading}
            </Typography>
            {faqData && faqData.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 2,
                  '&:before': { display: 'none' },
                  boxShadow: 1,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`faq-${index}-content`}
                  id={`faq-${index}-header`}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* CTA Section */}
          <Box
            sx={{
              py: 6,
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: 2,
              mb: 6,
            }}
          >
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              {cantonData.ctaHeading}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              {cantonData.ctaText}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleGetStarted}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              {cantonData.cta}
            </Button>
          </Box>
        </Container>
      </Layout>
    </>
  );
};

export default CantonPage;
