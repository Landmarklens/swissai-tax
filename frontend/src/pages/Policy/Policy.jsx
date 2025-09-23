import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import BasicLayout from '../Layout/BasicLayout';

const Policy = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        title="Privacy Policy - HomeAI"
        description="HomeAI privacy policy and data protection information"
      />
      <BasicLayout>
        <Box
          sx={{
            width: '100%',
            backgroundColor: theme.palette.background.lightBlue,
            pt: 8,
            pb: 2
          }}>
          <Container
            maxWidth="md"
            sx={{
              [theme.breakpoints.down('sm')]: {
                px: 2
              }
            }}>
            <Typography variant="h5" fontWeight={700} fontSize={'35px'} align="center" gutterBottom>
              {t('Privacy Policy')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Section: Introduction */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Introduction')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Typography sx={{ pl: 0.5 }}>
                    {t(
                      'At HomeAI.CH, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your data when you use our services. By accessing or using HomeAI.CH, you agree to the terms of this Privacy Policy. If you do not agree, please do not use our services.'
                    )}
                  </Typography>
                  <Typography sx={{ pl: 0.5, mt: 1 }}>
                    {t(
                      'This policy applies to all users, including those who access our services via our website, mobile applications, or any other platform provided by HomeAI.CH. We encourage you to read this policy carefully to understand our practices regarding your data.'
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Section: Information We Collect */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Information We Collect')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What types of information do we collect?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We collect various types of information to provide and improve our services, including:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Personal Information:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'This includes your name, email address, phone number, and billing information when you create an account or subscribe to our services.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Preference Data:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'We collect information about your property search preferences, such as desired location, budget, property type, and lifestyle needs (e.g., pet-friendly accommodations, commute preferences).'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Usage Data:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'We collect data about how you interact with our services, including search history, feedback on recommendations, and pages visited.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Technical Data:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'This includes your IP address, browser type, device information, and operating system to ensure optimal performance and security.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How do we collect this information?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>{t('We collect information through:')}</Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Direct input during the interview process when you provide your preferences and requirements for property search.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Account creation and subscription processes, where you provide personal and billing information.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Automated tracking technologies, such as cookies, to monitor usage patterns and improve user experience.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Section: How We Use Your Information */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('How We Use Your Information')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What do we use your information for?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t('We use the information we collect to:')}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Provide personalized property recommendations based on your preferences and lifestyle needs.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Send you notifications about new properties that match your criteria.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Process your subscription payments and manage your account.')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Improve our services by analyzing usage patterns and feedback.')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Communicate with you regarding updates, promotions, or support inquiries (you can opt out of promotional emails at any time).'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Section: Data Security */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Data Security')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How secure is my personal data?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Your data and preferences are stored securely, kept strictly confidential, and never shared or sold. You can easily update or delete your information via account settings.'
                      )}
                    </Typography>
                    <Typography sx={{ pl: 0.5, mt: 1 }}>
                      {t(
                        'We implement industry-standard security measures, including encryption, secure servers, and access controls, to protect your data from unauthorized access, disclosure, alteration, or destruction.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What happens in case of a data breach?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'In the unlikely event of a data breach, we will notify affected users promptly and take immediate steps to mitigate the issue, including working with cybersecurity experts to secure our systems and prevent future incidents.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Data Sharing and Third Parties */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Data Sharing and Third Parties')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Do we share your data with third parties?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We do not share, sell, or disclose your personal data to third parties for marketing purposes. However, we may share your data with:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Service providers who assist us in operating our services, such as payment processors and cloud hosting providers, under strict confidentiality agreements.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Legal authorities if required by law or to protect the rights, safety, or property of HomeAI.CH and its users.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Section: Your Rights and Choices */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Your Rights and Choices')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What rights do I have regarding my data?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t('You have the following rights regarding your personal data:')}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Access: You can request access to the personal data we hold about you.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Correction: You can request corrections to any inaccurate or incomplete data.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Deletion: You can request the deletion of your data at any time via your account settings.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Opt-Out: You can opt out of receiving promotional emails or notifications about new properties.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How can I manage my preferences?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You can manage your preferences, update your data, or delete your account directly through the account settings page. For further assistance, contact our support team.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Cookies and Tracking Technologies */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Cookies and Tracking Technologies')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Do we use cookies?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Yes, we use cookies and similar tracking technologies to enhance your experience, analyze usage, and improve our services. Cookies help us remember your preferences, track your interactions, and provide personalized recommendations.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What types of cookies do we use?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t('We use the following types of cookies:')}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Essential Cookies:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'These are necessary for the operation of our services, such as maintaining your login session.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Analytics Cookies:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'These help us understand how users interact with our services, allowing us to improve functionality and performance.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Preference Cookies:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'These store your preferences, such as language settings, to provide a more personalized experience.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Question 3 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How can I manage cookies?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You can manage your cookie preferences through your browser settings, where you can block or delete cookies. Note that disabling essential cookies may affect the functionality of our services.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Changes to This Privacy Policy */}
              <Box sx={{ pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Changes to This Privacy Policy')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Will this Privacy Policy change?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or services. We will notify you of significant changes by posting the updated policy on our website and, if applicable, via email.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How will I be notified of changes?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You will be notified of significant changes to this Privacy Policy via email or through a prominent notice on our website. We recommend reviewing this policy periodically to stay informed of any updates.'
                      )}
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

export default Policy;
