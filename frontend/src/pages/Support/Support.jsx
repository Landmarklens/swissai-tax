import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import BasicLayout from '../Layout/BasicLayout';

const Support = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        title="Support - HomeAI"
        description="Get help and support for HomeAI services"
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
              {t('Support')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Section: Getting Started */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Getting Started')}
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
                      {t('How do I start using HomeAI.CH?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'To start using HomeAI.CH, simply create an account on our website or mobile app. Once registered, you can begin the interview process, where the assistant will ask you a series of questions to understand your property search preferences. After completing the interview, you’ll receive personalized property recommendations tailored to your needs.'
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
                      {t('Is there a free trial available?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Yes, you can try HomeAI.CH free for 1 day. During the trial, you\'ll have full access to all features, including personalized property recommendations and notifications. After the trial, unlimited access costs CHF 29.99 per month.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Account Management */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Account Management')}
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
                      {t('How do I cancel my subscription?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Canceling is simple and hassle-free. Visit your account page, select "Billing," and click "Cancel Subscription." Your subscription remains active until the current billing period ends, with no further charges afterward.'
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
                      {t('Can I change my subscription plan?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Yes, you can upgrade or downgrade your subscription plan at any time. Go to the "Billing" section in your account settings, choose your desired plan, and follow the instructions. Changes will take effect at the start of your next billing cycle.'
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
                      {t('How do I update my billing information?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'To update your billing information, navigate to the "Billing" section in your account settings. You can add a new payment method, update existing details, or remove outdated information securely.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Using the Assistant */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Using the Assistant')}
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
                      {t('How do I provide feedback on property recommendations?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'After receiving a property recommendation, you can provide feedback directly through the chat interface. For example, you can indicate if a property is "too expensive" or "too small." The assistant will use this feedback to refine future recommendations, ensuring they better match your preferences over time.'
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
                      {t('How do I enable or disable notifications for new properties?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You can manage notifications in your account settings. Navigate to the "Notifications" section, where you can enable or disable email alerts for new properties that match your criteria. You can also customize the frequency of these notifications.'
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
                      {t('What should I do if the assistant isn’t finding suitable properties?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t('If the assistant isn’t finding suitable properties, you can:')}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Review and update your preferences in the interview process to ensure they accurately reflect your needs.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Provide feedback on the recommendations you’ve received to help the assistant refine its suggestions.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Contact our support team for assistance—we’re here to help you get the most out of HomeAI.CH.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Section: Billing and Payments */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Billing and Payments')}
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
                      {t('What payment methods are accepted?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We accept major credit cards (Visa, MasterCard, American Express), as well as payments via PayPal and direct bank transfers. All transactions are processed securely using encrypted payment gateways.'
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
                      {t('What happens if my payment fails?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'If your payment fails, we’ll notify you via email and attempt to process the payment again after 48 hours. During this period, you can update your payment method in the "Billing" section of your account. If the payment continues to fail, your subscription may be paused until the issue is resolved.'
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
                      {t('Can I get a refund?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'We offer a 1-day money-back guarantee after the trial period ends. If you\'re not satisfied with our services, you can request a refund within 1 day of your first paid subscription by contacting our support team. Refunds will be processed within 5-10 business days.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Contacting Support */}
              <Box sx={{ pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Contacting Support')}
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
                      {t('How can I contact HomeAI.CH support?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You can reach our support team via email at support@homeai.ch or through the live chat feature available on our website and app. Our team is available Monday to Friday, 9:00 AM to 6:00 PM CET, and we aim to respond to all inquiries within 24 hours.'
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
                      {t('What should I do if I encounter a technical issue?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'If you encounter a technical issue, such as problems with the chat interface, notifications, or account access, please contact our support team at support@homeai.ch. Include a detailed description of the issue, including any error messages, and we’ll assist you promptly.'
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

export default Support;
