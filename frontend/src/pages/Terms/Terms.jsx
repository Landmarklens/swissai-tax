import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import BasicLayout from '../Layout/BasicLayout';

const Terms = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        title="Terms of Service - HomeAI"
        description="HomeAI terms of service and usage agreement"
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
              {t('Terms and Conditions')}
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
                      'Welcome to HomeAI.CH! These Terms and Conditions govern your use of our website, mobile applications, and services. By accessing or using HomeAI.CH, you agree to be bound by these Terms and Conditions, as well as our Privacy Policy. If you do not agree to these terms, please do not use our services.'
                    )}
                  </Typography>
                  <Typography sx={{ pl: 0.5, mt: 1 }}>
                    {t(
                      'HomeAI.CH reserves the right to update or modify these Terms and Conditions at any time. We will notify you of significant changes via email or a notice on our website. Your continued use of our services after such changes constitutes your acceptance of the updated terms.'
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Section: Use of Services */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Use of Services')}
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
                      {t('Who can use HomeAI.CH?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'HomeAI.CH services are available to individuals who are at least 18 years old and capable of entering into legally binding contracts. By using our services, you represent that you meet these eligibility requirements.'
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
                      {t('What are the rules for using the service?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You agree to use HomeAI.CH services only for lawful purposes and in accordance with these Terms and Conditions. You are prohibited from:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t('Using the service to engage in any illegal or fraudulent activity.')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Attempting to access, tamper with, or use non-public areas of the service, including our systems or databases.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Distributing viruses, malware, or any harmful code that could damage or interfere with the service.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Misrepresenting your identity or providing false information during the interview process or account creation.'
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
                      {t('Can HomeAI.CH terminate my access to the service?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We reserve the right to suspend or terminate your access to HomeAI.CH at our discretion, with or without notice, if we believe you have violated these Terms and Conditions, engaged in unlawful activity, or used the service in a manner that harms HomeAI.CH or its users.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Subscriptions and Payments */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Subscriptions and Payments')}
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
                      {t('What is the cost of using HomeAI.CH?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You can try HomeAI.CH free for 1 day. After the trial, unlimited access costs CHF 29.99 per month. You may cancel anytime, with no long-term commitment.'
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
                      {t('How do I cancel my subscription?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Canceling is simple and hassle-free. Visit your account page, select "Billing," and click "Cancel Subscription." Your subscription remains active until the current billing period ends, with no further charges afterward.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 3 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What payment methods are accepted?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and direct bank transfers. All payments are processed securely using encrypted payment gateways.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 4 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What happens if I miss a payment?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'If a payment fails, we will attempt to charge your payment method again after 48 hours and notify you via email. If the payment continues to fail, your subscription may be paused until the issue is resolved. You can update your payment method in the "Billing" section of your account.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 5 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Are there any refunds available?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We offer a 1-day money-back guarantee after the trial period. If you\'re not satisfied with our services, you can request a refund within 1 day of your first paid subscription by contacting our support team at support@homeai.ch. Refunds will be processed within 5-10 business days.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Intellectual Property */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Intellectual Property')}
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
                      {t('Who owns the content on HomeAI.CH?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'All content on HomeAI.CH, including text, graphics, logos, images, and software, is the property of HomeAI.CH or its licensors and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any content without our prior written consent.'
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
                      {t('Can I use property recommendations for commercial purposes?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Property recommendations provided by HomeAI.CH are for personal use only. You may not use our recommendations, data, or any other content for commercial purposes, such as reselling or distributing, without our explicit permission.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Data Privacy */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Data Privacy')}
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
                        'Your data and preferences are stored securely, kept strictly confidential, and never shared or sold. You can easily update or delete your information via account settings. For more details, please refer to our Privacy Policy.'
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
                      {t('Will my data be shared with third parties?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We do not share or sell your personal data to third parties for marketing purposes. We may share your data with service providers (e.g., payment processors) under strict confidentiality agreements, or with legal authorities if required by law.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Limitation of Liability */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Limitation of Liability')}
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
                      {t('Is HomeAI.CH liable for inaccuracies in property recommendations?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'While we strive to provide accurate and up-to-date property recommendations, HomeAI.CH is not liable for any inaccuracies, errors, or omissions in the information provided. Property listings are sourced from third parties, and we recommend verifying details directly with property owners or agents before making decisions.'
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
                      {t('What is the extent of HomeAI.CH’s liability?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'To the fullest extent permitted by law, HomeAI.CH and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our services, including but not limited to loss of profits, data, or goodwill.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Governing Law */}
              <Box sx={{ pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Governing Law')}
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
                      {t('What law governs these Terms and Conditions?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'These Terms and Conditions are governed by and construed in accordance with the laws of Switzerland. Any disputes arising under or related to these terms will be subject to the exclusive jurisdiction of the courts of Switzerland.'
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

export default Terms;
