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
        title="Privacy Policy - SwissTax"
        description="SwissTax privacy policy and data protection information for Swiss tax filing"
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
                      'At SwissTax, we are committed to protecting your privacy and ensuring the security of your sensitive tax and financial information. This Privacy Policy outlines how we collect, use, disclose, and safeguard your data when you use our Swiss tax filing services. By accessing or using SwissTax, you agree to the terms of this Privacy Policy. If you do not agree, please do not use our services.'
                    )}
                  </Typography>
                  <Typography sx={{ pl: 0.5, mt: 1 }}>
                    {t(
                      'Given the highly sensitive nature of tax and financial data, we implement enterprise-grade security measures including 256-bit encryption, two-factor authentication (2FA), and secure cloud infrastructure. This policy applies to all users accessing our services via our website or mobile applications.'
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
                            'This includes your name, email address, phone number, billing information, and Swiss tax identification numbers when you create an account or subscribe to our services.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Tax and Financial Data:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'We collect tax-related information including income, deductions, canton of residence, employment details, investment income, property information, and other data necessary for accurate Swiss tax calculations and filing.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Usage Data:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'We collect data about how you interact with our services, including tax calculation history, document uploads, filing progress, and pages visited.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Document Data:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Tax-related documents you upload (such as salary certificates, bank statements, and deduction receipts) are encrypted and stored securely using 256-bit AES encryption.'
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
                            'Calculate and prepare your Swiss tax returns accurately based on federal and cantonal regulations.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Generate and submit tax filing documents to Swiss tax authorities on your behalf.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Process your subscription payments and manage your account securely.')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Provide tax optimization insights and identify potential deductions.')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Improve our tax calculation algorithms and services by analyzing anonymized usage patterns.')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Communicate with you regarding tax deadlines, updates to Swiss tax laws, or support inquiries (you can opt out of promotional emails at any time).'
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
                        'Your tax and financial data is protected with bank-level security measures. All sensitive data is encrypted at rest using 256-bit AES encryption and in transit using TLS 1.3. We store data securely in AWS cloud infrastructure with redundant backups.'
                      )}
                    </Typography>
                    <Typography sx={{ pl: 0.5, mt: 1 }}>
                      {t(
                        'Your account is protected by two-factor authentication (2FA), requiring both your password and a verification code to access your tax information. We implement strict access controls, regular security audits, and continuous monitoring to protect your data from unauthorized access, disclosure, alteration, or destruction.'
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
                        'We do not share, sell, or disclose your tax or financial data to third parties for marketing purposes. Your tax information remains strictly confidential. However, we may share your data with:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Swiss tax authorities when you authorize us to file your tax returns on your behalf.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Service providers who assist us in operating our services, such as payment processors (Stripe) and secure cloud hosting providers (AWS), under strict confidentiality and data processing agreements.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Legal authorities if required by Swiss law or to comply with legal obligations, protect the rights and safety of SwissTax and its users, or respond to lawful requests.'
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
