import React from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import BasicLayout from '../Layout/BasicLayout';

const CookiePolicy = () => {
  const { t } = useTranslation();

  const cookieTypes = [
    {
      category: t('cookiePolicy.essential.name', 'Essential Cookies'),
      purpose: t('cookiePolicy.essential.purpose', 'Required for website functionality, authentication, and security'),
      examples: t('cookiePolicy.essential.examples', 'Session cookies, authentication tokens, security preferences'),
      duration: t('cookiePolicy.essential.duration', 'Session or up to 1 year'),
    },
    {
      category: t('cookiePolicy.analytics.name', 'Analytics Cookies'),
      purpose: t('cookiePolicy.analytics.purpose', 'Help us understand how visitors interact with our website'),
      examples: t('cookiePolicy.analytics.examples', 'Google Analytics, page views, user behavior tracking'),
      duration: t('cookiePolicy.analytics.duration', 'Up to 2 years'),
    },
    {
      category: t('cookiePolicy.preferences.name', 'Preference Cookies'),
      purpose: t('cookiePolicy.preferences.purpose', 'Remember your settings and preferences'),
      examples: t('cookiePolicy.preferences.examples', 'Language selection, theme preferences, display settings'),
      duration: t('cookiePolicy.preferences.duration', 'Up to 1 year'),
    },
  ];

  return (
    <>
      <SEOHelmet
        title="Cookie Policy - SwissTax"
        description="Learn about how SwissTax uses cookies and similar technologies"
      />
      <BasicLayout>
        <Box
          sx={{
            width: '100%',
            backgroundColor: theme.palette.background.lightBlue,
            pt: 8,
            pb: 2,
          }}
        >
          <Container
            maxWidth="md"
            sx={{
              [theme.breakpoints.down('sm')]: {
                px: 2,
              },
            }}
          >
            <Typography variant="h5" fontWeight={700} fontSize={'35px'} align="center" gutterBottom>
              {t('cookiePolicy.title', 'Cookie Policy')}
            </Typography>

            <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 4 }}>
              {/* Last Updated */}
              <Typography variant="body2" color="text.secondary">
                {t('cookiePolicy.lastUpdated', 'Last Updated')}: {new Date().toLocaleDateString()}
              </Typography>

              {/* Introduction */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.whatAreCookies.title', 'What Are Cookies?')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'cookiePolicy.whatAreCookies.description',
                      'Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.'
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* How We Use Cookies */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.howWeUse.title', 'How We Use Cookies')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'cookiePolicy.howWeUse.description',
                      'SwissTax uses cookies to enhance your experience, understand how you use our platform, and improve our services. We use both first-party cookies (set by us) and third-party cookies (set by our partners).'
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Types of Cookies */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.typesOfCookies.title', 'Types of Cookies We Use')}
                </Typography>
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {t('cookiePolicy.table.category', 'Category')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {t('cookiePolicy.table.purpose', 'Purpose')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {t('cookiePolicy.table.examples', 'Examples')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {t('cookiePolicy.table.duration', 'Duration')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cookieTypes.map((cookie) => (
                        <TableRow key={cookie.category}>
                          <TableCell sx={{ fontWeight: 600 }}>{cookie.category}</TableCell>
                          <TableCell>{cookie.purpose}</TableCell>
                          <TableCell>{cookie.examples}</TableCell>
                          <TableCell>{cookie.duration}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Your Choices */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.yourChoices.title', 'Your Cookie Choices')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'cookiePolicy.yourChoices.consent',
                      'When you first visit our website, you will see a cookie consent banner. You can choose to:'
                    )}
                  </Typography>
                  <Box component="ul" sx={{ pl: 4 }}>
                    <Typography component="li" sx={{ mb: 1 }}>
                      {t('cookiePolicy.yourChoices.acceptAll', 'Accept all cookies')}
                    </Typography>
                    <Typography component="li" sx={{ mb: 1 }}>
                      {t('cookiePolicy.yourChoices.rejectNonEssential', 'Reject non-essential cookies')}
                    </Typography>
                    <Typography component="li" sx={{ mb: 1 }}>
                      {t('cookiePolicy.yourChoices.customize', 'Customize your preferences by category')}
                    </Typography>
                  </Box>
                  <Typography sx={{ pl: 0.5, mt: 1 }}>
                    {t(
                      'cookiePolicy.yourChoices.browserSettings',
                      'You can also control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may affect the functionality of our website.'
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Third-Party Cookies */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.thirdParty.title', 'Third-Party Cookies')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'cookiePolicy.thirdParty.description',
                      'We use third-party services such as Google Analytics to analyze website usage and improve our services. These third parties may set their own cookies. We recommend reviewing their privacy policies:'
                    )}
                  </Typography>
                  <Box component="ul" sx={{ pl: 4, mt: 1 }}>
                    <Typography component="li" sx={{ mb: 1 }}>
                      Google Analytics:{' '}
                      <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: theme.palette.primary.main }}
                      >
                        https://policies.google.com/privacy
                      </a>
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Updates to This Policy */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.updates.title', 'Updates to This Cookie Policy')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'cookiePolicy.updates.description',
                      'We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. When we make significant changes, we will update the "Last Updated" date and may notify you through our website or by email.'
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Contact Us */}
              <Box sx={{ pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2,
                  }}
                >
                  {t('cookiePolicy.contact.title', 'Contact Us')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'cookiePolicy.contact.description',
                      'If you have any questions about our use of cookies, please contact us:'
                    )}
                  </Typography>
                  <Box component="ul" sx={{ pl: 4, mt: 1 }}>
                    <Typography component="li" sx={{ mb: 1 }}>
                      {t('cookiePolicy.contact.email', 'Email')}: support@swisstax.com
                    </Typography>
                    <Typography component="li" sx={{ mb: 1 }}>
                      {t('cookiePolicy.contact.address', 'Address')}: SwissTax, Switzerland
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </BasicLayout>
    </>
  );
};

export default CookiePolicy;
